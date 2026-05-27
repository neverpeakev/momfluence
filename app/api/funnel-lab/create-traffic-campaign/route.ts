/**
 * POST /api/funnel-lab/create-traffic-campaign
 *
 * Creates a brand-new Meta campaign + ad set + top-N cloned ads,
 * optimizing for LANDING_PAGE_VIEWS with a COST_CAP bid.
 *
 * Built specifically for the 2026-05-27 apply-flow soft-launch test:
 * cheap top-of-funnel traffic to /signup (and its LP variants) to
 * measure whether the new "Apply to join MomFluence" hero converts
 * better than the prior $5/mo subscription hero.
 *
 * Why this exists alongside meta-spawn-experiment:
 *   meta-spawn-experiment creates an AD SET inside an EXISTING campaign
 *   (used for switching optimization within the same campaign). This
 *   endpoint creates a NEW CAMPAIGN entirely — different objective
 *   (OUTCOME_TRAFFIC vs whatever the existing one is), separate budget
 *   envelope, separate measurement.
 *
 * Body (all fields optional, sensible defaults below):
 *   {
 *     campaign_name?:      string  // default: "Apply-Hero Traffic Test <date>"
 *     ad_set_name?:        string  // default: "<campaign_name> — LP Views"
 *     lifetime_budget_usd?: number // default: 100
 *     bid_amount_usd?:     number  // default: 0.10
 *     top_n_ads?:          number  // default: 3
 *     end_days_from_now?:  number  // default: 30
 *     source_ad_set_id?:   string  // default: env META_AD_SET_ID
 *     dry_run?:            boolean // default: false — if true, returns plan without executing
 *   }
 *
 * Auth: cookie (admin) | Bearer CRON_SECRET | Bearer FUNNEL_LAB_PUSH_TOKEN
 *
 * Safety:
 *   - Campaign + ad set are created with status=ACTIVE per Kevin's
 *     explicit instruction "set it live". Ad set start_time is
 *     "now + 5 min" so there's a small window to verify in Meta Ads
 *     Manager before any spend.
 *   - lifetime_budget + end_time bound the spend — even if something
 *     misconfigures, Meta won't spend more than budget by end_time.
 *   - dry_run=true returns the planned config WITHOUT calling Meta —
 *     useful for verifying before committing real spend.
 */

import { NextResponse, type NextRequest } from "next/server";
import {
  createClient as createSsrClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";
import { z } from "zod";
import {
  isConfigured,
  adAccountId,
  META_API_VERSION,
} from "@/lib/optimizer/meta-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const BASE = `https://graph.facebook.com/${META_API_VERSION}`;

function token(): string {
  const t = process.env.META_MARKETING_API_TOKEN;
  if (!t) throw new Error("META_MARKETING_API_TOKEN not set");
  return t.trim();
}

function defaultSourceAdSetId(): string {
  const id = process.env.META_AD_SET_ID;
  if (!id) throw new Error("META_AD_SET_ID not set");
  return id;
}

function bearerFrom(req: NextRequest): string | null {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

type Auth = { ok: true; via: string } | { ok: false; status: number; error: string };

async function authorize(req: NextRequest): Promise<Auth> {
  try {
    const sb = await createSsrClient();
    const { data: { user } } = await sb.auth.getUser();
    if (user) {
      // Use service-role client for the is_admin lookup. The user's own
      // session occasionally fails to propagate auth.uid() into Postgres
      // (suspected: custom auth domain + cookie-name mismatch). Using
      // service-role bypasses RLS so the admin check is deterministic.
      const admin = createServiceRoleClient();
      const { data: me } = await admin
        .from("momfluencers")
        .select("is_admin,email")
        .eq("id", user.id)
        .maybeSingle();
      if (me?.is_admin) return { ok: true, via: "cookie" };
      return {
        ok: false,
        status: 403,
        error: `signed in as ${me?.email ?? user.id} but not admin`,
      };
    }
  } catch (e) {
    console.error("[create-traffic-campaign] auth error:", e instanceof Error ? e.message : e);
    // fall through to bearer-token check
  }

  const t = bearerFrom(req);
  if (t) {
    if (process.env.FUNNEL_LAB_PUSH_TOKEN && t === process.env.FUNNEL_LAB_PUSH_TOKEN) {
      return { ok: true, via: "push-secret" };
    }
    if (process.env.CRON_SECRET && t === process.env.CRON_SECRET) {
      return { ok: true, via: "cron-secret" };
    }
    return { ok: false, status: 401, error: "invalid bearer token" };
  }
  return { ok: false, status: 401, error: "missing auth" };
}

async function metaFetch(
  path: string,
  init: RequestInit = {}
): Promise<{ status: number; text: string }> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  return { status: res.status, text: await res.text() };
}

const Body = z.object({
  campaign_name: z.string().min(1).max(200).optional(),
  ad_set_name: z.string().min(1).max(200).optional(),
  lifetime_budget_usd: z.number().min(10).max(10000).default(100),
  bid_amount_usd: z.number().min(0.01).max(100).default(0.1),
  top_n_ads: z.number().int().min(1).max(20).default(3),
  end_days_from_now: z.number().int().min(1).max(180).default(30),
  source_ad_set_id: z.string().optional(),
  dry_run: z.boolean().default(false),
  // For retry runs — skip campaign+adset creation, just add ads to an existing
  // ad set. Used when a prior call created campaign+adset but the ad
  // cloning failed (e.g. objective-mismatch error from /copies on the first
  // attempt before we switched to the creative-id approach).
  existing_ad_set_id: z.string().optional(),
});

interface AdInsightRow {
  ad_id: string;
  ad_name?: string;
  impressions: number;
}

interface AdListRow {
  id: string;
  name?: string;
  status?: string;
  effective_status?: string;
}

export async function POST(req: NextRequest) {
  const auth = await authorize(req);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const cfg = isConfigured();
  if (!cfg.ok) {
    return NextResponse.json(
      { ok: false, error: `Meta env missing: ${cfg.missing.join(", ")}` },
      { status: 503 }
    );
  }

  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json().catch(() => ({})));
  } catch (e) {
    const msg =
      e instanceof z.ZodError
        ? e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
        : "invalid json";
    return NextResponse.json({ ok: false, error: `bad request: ${msg}` }, { status: 400 });
  }

  const sourceAdSetId = parsed.source_ad_set_id ?? defaultSourceAdSetId();
  const today = new Date().toISOString().slice(0, 10);
  const campaignName =
    parsed.campaign_name ?? `Apply-Hero Traffic Test ${today}`;
  const adSetName = parsed.ad_set_name ?? `${campaignName} — LP Views`;
  const lifetimeBudgetCents = Math.round(parsed.lifetime_budget_usd * 100);
  const bidAmountCents = Math.round(parsed.bid_amount_usd * 100);
  const startTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const endTime = new Date(
    Date.now() + parsed.end_days_from_now * 24 * 60 * 60 * 1000
  ).toISOString();

  // Step 1: fetch source ad set's targeting + promoted_object (pixel) so the
  // new ad set inherits the same audience + pixel attribution.
  const sourceRes = await metaFetch(
    `/${sourceAdSetId}?fields=targeting,promoted_object,billing_event`
  );
  if (sourceRes.status !== 200) {
    return NextResponse.json(
      {
        ok: false,
        step: "fetch_source_ad_set",
        error: `${sourceRes.status}: ${sourceRes.text.slice(0, 400)}`,
      },
      { status: 502 }
    );
  }
  const sourceData = JSON.parse(sourceRes.text) as {
    targeting?: Record<string, unknown>;
    promoted_object?: Record<string, unknown>;
    billing_event?: string;
  };
  if (!sourceData.targeting) {
    return NextResponse.json(
      { ok: false, step: "fetch_source_ad_set", error: "source has no targeting" },
      { status: 500 }
    );
  }

  // Step 2: pick top-N ads from source by 14d impressions. Fall back to
  // listAds() filtered to ACTIVE if insights are empty (new account or
  // recently-launched ad set with no traffic yet).
  let pickedAds: AdListRow[] = [];
  const insightsRes = await metaFetch(
    `/${sourceAdSetId}/insights?level=ad&fields=ad_id,ad_name,impressions&date_preset=last_14d&limit=100`
  );
  if (insightsRes.status === 200) {
    const insightsData = JSON.parse(insightsRes.text) as {
      data?: Array<Record<string, unknown>>;
    };
    const rows: AdInsightRow[] = (insightsData.data ?? [])
      .map((r) => ({
        ad_id: String(r.ad_id ?? ""),
        ad_name: typeof r.ad_name === "string" ? r.ad_name : undefined,
        impressions: Number(r.impressions ?? 0),
      }))
      .filter((r) => r.ad_id && r.impressions > 0)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, parsed.top_n_ads);
    pickedAds = rows.map((r) => ({
      id: r.ad_id,
      name: r.ad_name,
    }));
  }

  if (pickedAds.length === 0) {
    // Fallback: list source ad set's active ads
    const listRes = await metaFetch(
      `/${sourceAdSetId}/ads?fields=id,name,status,effective_status&limit=100`
    );
    if (listRes.status === 200) {
      const listData = JSON.parse(listRes.text) as { data?: AdListRow[] };
      pickedAds = (listData.data ?? [])
        .filter((a) => a.effective_status === "ACTIVE")
        .slice(0, parsed.top_n_ads);
    }
  }

  if (pickedAds.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        step: "pick_ads",
        error: "no ads found in source ad set (neither by insights nor by ACTIVE status)",
      },
      { status: 500 }
    );
  }

  // Step 3: assemble the plan. If dry_run, return it without executing.
  const plan = {
    campaign: {
      name: campaignName,
      objective: "OUTCOME_TRAFFIC",
      status: "ACTIVE",
      special_ad_categories: [],
      buying_type: "AUCTION",
    },
    ad_set: {
      name: adSetName,
      lifetime_budget_cents: lifetimeBudgetCents,
      bid_amount_cents: bidAmountCents,
      bid_strategy: "COST_CAP",
      optimization_goal: "LANDING_PAGE_VIEWS",
      billing_event: "IMPRESSIONS",
      start_time: startTime,
      end_time: endTime,
      status: "ACTIVE",
      targeting: "(copied from source ad set)",
      promoted_object: "(skipped — LANDING_PAGE_VIEWS doesn't need it)",
    },
    ads: pickedAds.map((a) => ({
      source_ad_id: a.id,
      source_name: a.name,
      paste_status: "ACTIVE",
    })),
  };

  if (parsed.dry_run) {
    return NextResponse.json({ ok: true, dry_run: true, plan });
  }

  // Reuse path — if caller passes existing_ad_set_id, skip campaign+adset
  // creation and jump straight to ad creation. Used to recover from earlier
  // failed runs that created a campaign+adset shell but couldn't populate
  // ads (e.g. the cross-objective /copies error before the switch to
  // creative-id approach).
  let newCampaignId: string;
  let newAdSetId: string;
  if (parsed.existing_ad_set_id) {
    newAdSetId = parsed.existing_ad_set_id;
    // Resolve campaign_id from the existing ad set for reporting.
    const lookupRes = await metaFetch(
      `/${parsed.existing_ad_set_id}?fields=campaign_id`
    );
    if (lookupRes.status !== 200) {
      return NextResponse.json(
        {
          ok: false,
          step: "resolve_existing_campaign",
          error: `${lookupRes.status}: ${lookupRes.text.slice(0, 400)}`,
        },
        { status: 502 }
      );
    }
    const lookupData = JSON.parse(lookupRes.text) as { campaign_id?: string };
    newCampaignId = lookupData.campaign_id ?? "(unknown)";
  } else {
    // Normal path — create campaign + ad set.
    newCampaignId = await (async () => {
      const r = await createCampaign();
      if (!r.ok) throw new Error(r.errorJson);
      return r.id;
    })().catch((e) => {
      throw e;
    });
    newAdSetId = await (async () => {
      const r = await createAdSet(newCampaignId);
      if (!r.ok) throw new Error(r.errorJson);
      return r.id;
    })().catch((e) => {
      throw e;
    });
  }

  // (the existing step 4/5 inline logic below will be replaced by the
  //  helpers above — declare them after to keep diff minimal.)

  // Helper: create campaign. (Kept as inline closure for clarity.)
  async function createCampaign(): Promise<
    { ok: true; id: string } | { ok: false; errorJson: string }
  > {
    const r = await metaFetch(`/${adAccountId()}/campaigns`, {
      method: "POST",
      body: JSON.stringify({
        name: campaignName,
        objective: "OUTCOME_TRAFFIC",
        status: "ACTIVE",
        special_ad_categories: [],
        buying_type: "AUCTION",
        is_adset_budget_sharing_enabled: false,
      }),
    });
    if (r.status !== 200) {
      return { ok: false, errorJson: r.text.slice(0, 1200) };
    }
    return { ok: true, id: (JSON.parse(r.text) as { id: string }).id };
  }
  async function createAdSet(
    campaignId: string
  ): Promise<{ ok: true; id: string } | { ok: false; errorJson: string }> {
    const body: Record<string, unknown> = {
      name: adSetName,
      campaign_id: campaignId,
      status: "ACTIVE",
      lifetime_budget: String(lifetimeBudgetCents),
      bid_strategy: "COST_CAP",
      bid_amount: bidAmountCents,
      optimization_goal: "LANDING_PAGE_VIEWS",
      billing_event: "IMPRESSIONS",
      targeting: sourceData.targeting,
      start_time: startTime,
      end_time: endTime,
    };
    const r = await metaFetch(`/${adAccountId()}/adsets`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (r.status !== 200) {
      return { ok: false, errorJson: r.text.slice(0, 1200) };
    }
    return { ok: true, id: (JSON.parse(r.text) as { id: string }).id };
  }

  // Step 6: create new ads in the new ad set, referencing each source ad's
  // creative_id. We can't use POST /<ad_id>/copies because Meta blocks
  // cross-objective copies (source ads live in a Conversions/Sales
  // campaign; this new campaign is Traffic). Creatives ARE reusable across
  // objectives — we just need to fetch each source's creative_id and
  // create a fresh ad with creative: { creative_id }.
  const cloneResults: Array<
    | { source_ad_id: string; source_name?: string; new_ad_id: string; creative_id: string }
    | { source_ad_id: string; source_name?: string; error: string }
  > = [];
  for (const ad of pickedAds) {
    // First — fetch source ad's creative_id
    const detailRes = await metaFetch(`/${ad.id}?fields=creative{id},name`);
    if (detailRes.status !== 200) {
      cloneResults.push({
        source_ad_id: ad.id,
        source_name: ad.name,
        error: `fetch_creative ${detailRes.status}: ${detailRes.text.slice(0, 200)}`,
      });
      continue;
    }
    const detail = JSON.parse(detailRes.text) as {
      creative?: { id?: string };
      name?: string;
    };
    const creativeId = detail.creative?.id;
    if (!creativeId) {
      cloneResults.push({
        source_ad_id: ad.id,
        source_name: ad.name,
        error: "source ad has no creative id",
      });
      continue;
    }

    // Create a fresh ad in the new ad set referencing the same creative
    const newAdName = `${detail.name ?? ad.name ?? ad.id} — Traffic Test`;
    const createAdRes = await metaFetch(`/${adAccountId()}/ads`, {
      method: "POST",
      body: JSON.stringify({
        name: newAdName,
        adset_id: newAdSetId,
        creative: { creative_id: creativeId },
        status: "ACTIVE",
      }),
    });
    if (createAdRes.status === 200) {
      const data = JSON.parse(createAdRes.text) as { id?: string };
      cloneResults.push({
        source_ad_id: ad.id,
        source_name: ad.name,
        creative_id: creativeId,
        new_ad_id: data.id ?? "",
      });
    } else {
      cloneResults.push({
        source_ad_id: ad.id,
        source_name: ad.name,
        error: `create_ad ${createAdRes.status}: ${createAdRes.text.slice(0, 300)}`,
      });
    }
  }

  const cloneOk = cloneResults.filter((r) => "new_ad_id" in r).length;
  const cloneErr = cloneResults.filter((r) => "error" in r).length;

  return NextResponse.json({
    ok: true,
    via: auth.via,
    campaign: {
      id: newCampaignId,
      name: campaignName,
      status: "ACTIVE",
      objective: "OUTCOME_TRAFFIC",
      manage_url: `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${adAccountId().replace(
        "act_",
        ""
      )}&selected_campaign_ids=${newCampaignId}`,
    },
    ad_set: {
      id: newAdSetId,
      name: adSetName,
      status: "ACTIVE",
      optimization_goal: "LANDING_PAGE_VIEWS",
      bid_strategy: "COST_CAP",
      bid_amount_usd: parsed.bid_amount_usd,
      lifetime_budget_usd: parsed.lifetime_budget_usd,
      start_time: startTime,
      end_time: endTime,
    },
    ads: {
      attempted: pickedAds.length,
      ok: cloneOk,
      err: cloneErr,
      details: cloneResults,
    },
    next_steps: [
      `Verify in Meta Ads Manager: campaign ${newCampaignId}`,
      `Ad set ${newAdSetId} starts ~${startTime} (5 min from creation)`,
      `Spend stops at $${parsed.lifetime_budget_usd} OR ${endTime}, whichever comes first`,
      `Target: $${parsed.bid_amount_usd} per LP view via COST_CAP`,
    ],
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/funnel-lab/create-traffic-campaign",
    method: "POST",
    purpose:
      "Create a NEW Meta campaign + ad set + top-N cloned ads optimizing for LANDING_PAGE_VIEWS",
    auth: "cookie (admin) | Bearer CRON_SECRET | Bearer FUNNEL_LAB_PUSH_TOKEN",
    defaults: {
      lifetime_budget_usd: 100,
      bid_amount_usd: 0.1,
      top_n_ads: 3,
      end_days_from_now: 30,
    },
  });
}
