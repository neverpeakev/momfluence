/**
 * POST /api/funnel-lab/meta-spawn-experiment
 *
 * Spins up a new ad set inside the existing campaign with the requested
 * config, then clones all currently-active ads from a source ad set into
 * the new one. Optionally pauses the source set so the new one captures
 * the full budget.
 *
 * Built specifically because Meta locks `custom_event_type` (the
 * conversion pixel event) on an ad set the moment it's published — so
 * to switch from optimizing for PURCHASE to optimizing for
 * COMPLETE_REGISTRATION we MUST create a new ad set; we can't update
 * the existing one. (Error 3260011 "Can't Make Edits to Published Ad Set".)
 *
 * Body schema (every field required unless marked optional):
 *   {
 *     name:               string  // display name, e.g. "Cold Moms — Broad — CompleteRegistration"
 *     campaign_id?:       string  // defaults to source_ad_set_id's parent
 *     daily_budget_usd:   number
 *     bid_amount_usd:     number  // cost cap per result
 *     bid_strategy:       "COST_CAP" | "LOWEST_COST_WITHOUT_CAP" | ...
 *     optimization_goal:  "OFFSITE_CONVERSIONS" | "LANDING_PAGE_VIEWS" | ...
 *     billing_event:      "IMPRESSIONS" | "LINK_CLICKS" | "THRUPLAY"
 *     promoted_object?:   { pixel_id, custom_event_type }  // required for conversion-event goals
 *     targeting:          Meta targeting object
 *     source_ad_set_id?:  string  // defaults to env META_AD_SET_ID
 *     clone_ads_with_status?: "ACTIVE" | "PAUSED" | "ANY"  // default ACTIVE
 *     paste_ad_status?:   "ACTIVE" | "PAUSED" | "INHERITED_FROM_SOURCE_AD"  // default PAUSED
 *     ad_name_suffix?:    string  // optional rename suffix on each cloned ad
 *     pause_source_ad_set?: boolean  // default false
 *     start_time_iso?:    string  // optional ad set start_time; defaults to "5 min from now"
 *   }
 *
 * Auth: same as the other funnel-lab/* routes.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSsrClient } from "@/lib/supabase/server";
import { z } from "zod";
import {
  isConfigured,
  adAccountId,
  META_API_VERSION,
} from "@/lib/optimizer/meta-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300; // cloning many ads sequentially can take a minute+

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
      const { data: me } = await sb.from("momfluencers").select("is_admin").eq("id", user.id).maybeSingle();
      if (me?.is_admin) return { ok: true, via: "cookie" };
      return { ok: false, status: 403, error: "signed in but not admin" };
    }
  } catch { /* fall through */ }

  const t = bearerFrom(req);
  if (t) {
    if (process.env.FUNNEL_LAB_PUSH_TOKEN && t === process.env.FUNNEL_LAB_PUSH_TOKEN) return { ok: true, via: "push-secret" };
    if (process.env.CRON_SECRET && t === process.env.CRON_SECRET) return { ok: true, via: "cron-secret" };
    return { ok: false, status: 401, error: "invalid bearer token" };
  }
  return { ok: false, status: 401, error: "missing auth" };
}

async function metaFetch(path: string, init: RequestInit = {}): Promise<{ status: number; text: string }> {
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
  name: z.string().min(1).max(200),
  campaign_id: z.string().optional(),
  daily_budget_usd: z.number().min(1).max(10000),
  bid_amount_usd: z.number().min(0.01).max(1000),
  bid_strategy: z.enum([
    "LOWEST_COST_WITHOUT_CAP",
    "COST_CAP",
    "LOWEST_COST_WITH_BID_CAP",
    "LOWEST_COST_WITH_MIN_ROAS",
    "TARGET_COST",
  ]),
  optimization_goal: z.enum([
    "NONE",
    "APP_INSTALLS",
    "IMPRESSIONS",
    "LEAD_GENERATION",
    "QUALITY_LEAD",
    "LINK_CLICKS",
    "OFFSITE_CONVERSIONS",
    "PAGE_LIKES",
    "POST_ENGAGEMENT",
    "REACH",
    "LANDING_PAGE_VIEWS",
    "VALUE",
    "THRUPLAY",
    "CONVERSATIONS",
    "SUBSCRIBERS",
  ]),
  billing_event: z.enum(["IMPRESSIONS", "LINK_CLICKS", "THRUPLAY"]),
  promoted_object: z.object({
    pixel_id: z.string(),
    custom_event_type: z.string(),
  }).optional(),
  targeting: z.record(z.unknown()),
  source_ad_set_id: z.string().optional(),
  clone_ads_with_status: z.enum(["ACTIVE", "PAUSED", "ANY"]).default("ACTIVE"),
  paste_ad_status: z.enum(["ACTIVE", "PAUSED", "INHERITED_FROM_SOURCE_AD"]).default("PAUSED"),
  ad_name_suffix: z.string().max(60).optional(),
  pause_source_ad_set: z.boolean().default(false),
  start_time_iso: z.string().datetime().optional(),
});

interface MetaAdLite {
  id: string;
  name?: string;
  status?: string;
  effective_status?: string;
}

interface CloneResultOk {
  source_ad_id: string;
  source_name: string;
  new_ad_id: string;
}
interface CloneResultErr {
  source_ad_id: string;
  source_name: string;
  error: string;
}

export async function POST(req: NextRequest) {
  const auth = await authorize(req);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const cfg = isConfigured();
  if (!cfg.ok) {
    return NextResponse.json({ ok: false, error: `Meta env missing: ${cfg.missing.join(", ")}` }, { status: 503 });
  }

  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ") : "invalid json";
    return NextResponse.json({ ok: false, error: `bad request: ${msg}` }, { status: 400 });
  }

  const sourceAdSetId = parsed.source_ad_set_id ?? defaultSourceAdSetId();

  // Step 1: resolve campaign_id from source ad set (unless caller provided one).
  let campaignId = parsed.campaign_id;
  if (!campaignId) {
    const r = await metaFetch(`/${sourceAdSetId}?fields=campaign_id`);
    if (r.status !== 200) {
      return NextResponse.json({
        ok: false, step: "resolve_campaign", error: `${r.status}: ${r.text.slice(0, 400)}`,
      }, { status: 502 });
    }
    const data = JSON.parse(r.text) as { campaign_id?: string };
    if (!data.campaign_id) {
      return NextResponse.json({ ok: false, error: "source ad set has no campaign_id" }, { status: 500 });
    }
    campaignId = data.campaign_id;
  }

  // Step 2: create the new ad set.
  // Meta wants budget + bid in CENTS. daily_budget is a string in cents; bid_amount is a number in cents.
  const createBody: Record<string, unknown> = {
    name: parsed.name,
    campaign_id: campaignId,
    status: "PAUSED", // start paused — Kevin can verify the cloned ads look right + flip ACTIVE
    daily_budget: String(Math.round(parsed.daily_budget_usd * 100)),
    bid_strategy: parsed.bid_strategy,
    bid_amount: Math.round(parsed.bid_amount_usd * 100),
    optimization_goal: parsed.optimization_goal,
    billing_event: parsed.billing_event,
    targeting: parsed.targeting,
    start_time:
      parsed.start_time_iso ??
      new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  };
  if (parsed.promoted_object) createBody.promoted_object = parsed.promoted_object;

  const createRes = await metaFetch(`/${adAccountId()}/adsets`, {
    method: "POST",
    body: JSON.stringify(createBody),
  });
  if (createRes.status !== 200) {
    return NextResponse.json({
      ok: false,
      step: "create_ad_set",
      meta_response: createRes.text.slice(0, 1200),
      requested_body: createBody,
    }, { status: 502 });
  }
  const newAdSetId = (JSON.parse(createRes.text) as { id: string }).id;

  // Step 3: list ads in the source ad set, filter by status.
  const listRes = await metaFetch(
    `/${sourceAdSetId}/ads?fields=id,name,status,effective_status&limit=200`,
  );
  if (listRes.status !== 200) {
    return NextResponse.json({
      ok: false,
      step: "list_source_ads",
      new_ad_set_id: newAdSetId,
      meta_response: listRes.text.slice(0, 600),
    }, { status: 502 });
  }
  const allAds = (JSON.parse(listRes.text) as { data: MetaAdLite[] }).data ?? [];
  const adsToClone = allAds.filter((a) => {
    if (parsed.clone_ads_with_status === "ANY") return true;
    return a.effective_status === parsed.clone_ads_with_status;
  });

  // Step 4: clone each ad via POST /<ad_id>/copies.
  // Meta endpoint params: adset_id, status_option, rename_options.
  // We send one at a time (no batch endpoint here) because cloning is cheap
  // (sub-second per ad) and we want per-ad error reporting if any fail.
  const cloneResults: Array<CloneResultOk | CloneResultErr> = [];
  for (const ad of adsToClone) {
    const renameOptions = parsed.ad_name_suffix
      ? { rename_options: { rename_suffix: ` ${parsed.ad_name_suffix}` } }
      : {};
    const cloneRes = await metaFetch(`/${ad.id}/copies`, {
      method: "POST",
      body: JSON.stringify({
        adset_id: newAdSetId,
        status_option: parsed.paste_ad_status,
        ...renameOptions,
      }),
    });
    if (cloneRes.status === 200) {
      const data = JSON.parse(cloneRes.text) as { copied_ad_id?: string; ad_id?: string; id?: string };
      cloneResults.push({
        source_ad_id: ad.id,
        source_name: ad.name ?? "",
        new_ad_id: data.copied_ad_id ?? data.ad_id ?? data.id ?? "",
      });
    } else {
      cloneResults.push({
        source_ad_id: ad.id,
        source_name: ad.name ?? "",
        error: `${cloneRes.status}: ${cloneRes.text.slice(0, 300)}`,
      });
    }
  }

  // Step 5: optionally pause the source ad set so the new one captures budget.
  let pausedSource = false;
  if (parsed.pause_source_ad_set) {
    const pauseRes = await metaFetch(`/${sourceAdSetId}`, {
      method: "POST",
      body: JSON.stringify({ status: "PAUSED" }),
    });
    pausedSource = pauseRes.status === 200;
  }

  const cloneOk = cloneResults.filter((r): r is CloneResultOk => "new_ad_id" in r).length;
  const cloneErr = cloneResults.filter((r): r is CloneResultErr => "error" in r).length;

  return NextResponse.json({
    ok: true,
    via: auth.via,
    campaign_id: campaignId,
    source_ad_set_id: sourceAdSetId,
    new_ad_set_id: newAdSetId,
    new_ad_set_status: "PAUSED",
    cloned_ads_attempted: adsToClone.length,
    cloned_ads_ok: cloneOk,
    cloned_ads_err: cloneErr,
    clone_results: cloneResults,
    paused_source_ad_set: pausedSource,
    next_steps: [
      `Visit Meta Ads Manager → ad set ${newAdSetId} to verify the cloned ads look right`,
      `If ok, flip the new ad set status PAUSED → ACTIVE`,
      `Check /api/funnel-lab/meta-diagnostic for the post-change snapshot in 24h`,
    ],
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/funnel-lab/meta-spawn-experiment",
    method: "POST",
    purpose: "Create a new ad set inside the existing campaign + clone the current ad set's active ads into it",
    auth: "cookie (admin) | Bearer CRON_SECRET | Bearer FUNNEL_LAB_PUSH_TOKEN",
  });
}
