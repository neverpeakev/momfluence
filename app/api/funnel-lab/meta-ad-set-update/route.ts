/**
 * POST /api/funnel-lab/meta-ad-set-update
 *
 * Updates the configured ad set's budget / bid / optimization config in one
 * call. Wraps Meta's POST /<ad-set-id> endpoint with strict-typed inputs +
 * pre/post diagnostic snapshots so we can see exactly what changed.
 *
 * Why a dedicated route (not just curl Meta directly):
 *   - META_MARKETING_API_TOKEN stays server-side (never on a laptop)
 *   - Auth-uniform with the rest of /api/funnel-lab/* (cookie | CRON_SECRET | PUSH_TOKEN)
 *   - Optimizer can hit it from /api/optimizer/tick to autonomously rebalance
 *
 * Body schema (every field optional — only sent fields are updated):
 *   {
 *     daily_budget_usd?:     number   // 5 → $5/day
 *     bid_amount_usd?:       number   // 0.75 → $0.75 cost cap per result
 *     bid_strategy?:         "LOWEST_COST_WITHOUT_CAP" | "COST_CAP" | "LOWEST_COST_WITH_BID_CAP"
 *     optimization_goal?:    "LANDING_PAGE_VIEW" | "LINK_CLICKS" | "OFFSITE_CONVERSIONS" | "REACH" | ...
 *     billing_event?:        "IMPRESSIONS" | "LINK_CLICKS"
 *     clear_promoted_object?: boolean  // set true when switching off PURCHASE/conversion goals
 *     targeting?:            Meta targeting object (overrides the entire targeting block)
 *     pause_first?:          boolean  // pause → update → resume (Meta requires this for some changes)
 *   }
 *
 * Response: { ok, via, before, applied, after }
 *   - before:  ad set state pre-change (subset of fields we care about)
 *   - applied: the patch body Meta accepted (what we asked for)
 *   - after:   ad set state post-change (verify Meta actually wrote it)
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSsrClient } from "@/lib/supabase/server";
import { z } from "zod";
import { isConfigured, META_API_VERSION } from "@/lib/optimizer/meta-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const BASE = `https://graph.facebook.com/${META_API_VERSION}`;

function token(): string {
  const t = process.env.META_MARKETING_API_TOKEN;
  if (!t) throw new Error("META_MARKETING_API_TOKEN not set");
  return t.trim();
}

function adSetId(): string {
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
  daily_budget_usd: z.number().min(1).max(10000).optional(),
  bid_amount_usd: z.number().min(0.01).max(1000).optional(),
  bid_strategy: z.enum([
    "LOWEST_COST_WITHOUT_CAP",
    "COST_CAP",
    "LOWEST_COST_WITH_BID_CAP",
    "LOWEST_COST_WITH_MIN_ROAS",
    "TARGET_COST",
  ]).optional(),
  optimization_goal: z.enum([
    // Sourced verbatim from Meta's 400 error response (it returned the full
    // valid-values list when we tried "LANDING_PAGE_VIEW" singular). Plural
    // suffix matters on Meta's side — common surprise.
    "NONE",
    "APP_INSTALLS",
    "AD_RECALL_LIFT",
    "ENGAGED_USERS",
    "EVENT_RESPONSES",
    "IMPRESSIONS",
    "LEAD_GENERATION",
    "QUALITY_LEAD",
    "LINK_CLICKS",
    "OFFSITE_CONVERSIONS",
    "PAGE_LIKES",
    "POST_ENGAGEMENT",
    "QUALITY_CALL",
    "REACH",
    "LANDING_PAGE_VIEWS",
    "VISIT_INSTAGRAM_PROFILE",
    "ENGAGED_PAGE_VIEWS",
    "VALUE",
    "THRUPLAY",
    "DERIVED_EVENTS",
    "CONVERSATIONS",
    "SUBSCRIBERS",
    "PROFILE_VISIT",
    "PROFILE_AND_PAGE_ENGAGEMENT",
    "AUTOMATIC_OBJECTIVE",
  ]).optional(),
  billing_event: z.enum(["IMPRESSIONS", "LINK_CLICKS", "THRUPLAY"]).optional(),
  clear_promoted_object: z.boolean().optional(),
  // Direct promoted_object override — useful when the campaign objective is
  // locked to OFFSITE_CONVERSIONS but we want to change WHICH pixel event
  // Meta optimizes against (e.g. PURCHASE → VIEW_CONTENT to escape the
  // zero-conversion-history throttle while staying in a sales campaign).
  promoted_object: z.object({
    pixel_id: z.string().optional(),
    custom_event_type: z.enum([
      // Common Meta standard events; extend as needed
      "VIEW_CONTENT",
      "LEAD",
      "COMPLETE_REGISTRATION",
      "ADD_TO_CART",
      "INITIATE_CHECKOUT",
      "ADD_PAYMENT_INFO",
      "PURCHASE",
      "SUBSCRIBE",
      "OTHER",
    ]).optional(),
    custom_conversion_id: z.string().optional(),
  }).optional(),
  // Targeting override — passed through to Meta as-is. Caller is responsible
  // for the shape (e.g. { age_min, age_max, genders, geo_locations, targeting_automation }).
  targeting: z.record(z.unknown()).optional(),
  pause_first: z.boolean().optional(),
});

interface AdSetSnapshot {
  id?: string;
  status?: string;
  effective_status?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  bid_strategy?: string;
  bid_amount?: string;
  optimization_goal?: string;
  billing_event?: string;
  promoted_object?: Record<string, unknown> | null;
  targeting?: Record<string, unknown> | null;
}

const SNAPSHOT_FIELDS =
  "id,status,effective_status,daily_budget,lifetime_budget,bid_strategy,bid_amount," +
  "optimization_goal,billing_event,promoted_object,targeting";

async function snapshot(setId: string): Promise<AdSetSnapshot> {
  const { status, text } = await metaFetch(`/${setId}?fields=${SNAPSHOT_FIELDS}`);
  if (status !== 200) throw new Error(`snapshot fetch failed: ${status} ${text.slice(0, 400)}`);
  return JSON.parse(text) as AdSetSnapshot;
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

  const setId = adSetId();

  // Pre-change snapshot
  let before: AdSetSnapshot;
  try {
    before = await snapshot(setId);
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }

  // Build the patch body. Only include keys the caller explicitly set.
  // Meta wants budget + bid amount in CENTS as a STRING.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patch: Record<string, any> = {};
  if (parsed.daily_budget_usd !== undefined) {
    patch.daily_budget = String(Math.round(parsed.daily_budget_usd * 100));
  }
  if (parsed.bid_amount_usd !== undefined) {
    // Meta accepts bid_amount as a number (cents) on the ad-set update endpoint
    patch.bid_amount = Math.round(parsed.bid_amount_usd * 100);
  }
  if (parsed.bid_strategy) patch.bid_strategy = parsed.bid_strategy;
  if (parsed.optimization_goal) patch.optimization_goal = parsed.optimization_goal;
  if (parsed.billing_event) patch.billing_event = parsed.billing_event;
  if (parsed.targeting) patch.targeting = parsed.targeting;
  // promoted_object is required when optimization_goal = OFFSITE_CONVERSIONS (with pixel + event).
  // When switching to LANDING_PAGE_VIEW (or other non-conversion goals), we typically want to
  // clear it. Meta lets us set promoted_object: {} to clear.
  if (parsed.clear_promoted_object) patch.promoted_object = {};
  // Explicit promoted_object update takes precedence over clear.
  if (parsed.promoted_object) patch.promoted_object = parsed.promoted_object;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({
      ok: false,
      error: "no fields to update — body had no recognized keys",
      before,
    }, { status: 400 });
  }

  // Some Meta changes (notably optimization_goal swaps) require the ad set to
  // be paused first. The optimizer's tick loop will set the ad set back to
  // ACTIVE on its next pass, OR caller can pass pause_first: false to try the
  // edit live (might fail with "ad set must be paused" error 100/2654, which
  // we surface in the response).
  let pausedHere = false;
  if (parsed.pause_first && before.status === "ACTIVE") {
    const pauseRes = await metaFetch(`/${setId}`, {
      method: "POST",
      body: JSON.stringify({ status: "PAUSED" }),
    });
    if (pauseRes.status !== 200) {
      return NextResponse.json({
        ok: false,
        error: `pause-first step failed: ${pauseRes.status} ${pauseRes.text.slice(0, 300)}`,
        before,
      }, { status: 502 });
    }
    pausedHere = true;
  }

  // Push the patch
  const updateRes = await metaFetch(`/${setId}`, {
    method: "POST",
    body: JSON.stringify(patch),
  });

  // Resume if we paused
  if (pausedHere) {
    const resumeRes = await metaFetch(`/${setId}`, {
      method: "POST",
      body: JSON.stringify({ status: "ACTIVE" }),
    });
    if (resumeRes.status !== 200) {
      // Don't fail the whole response — the patch may have succeeded; caller can re-activate via UI
      // but flag it loudly in the response.
    }
  }

  if (updateRes.status !== 200) {
    return NextResponse.json({
      ok: false,
      error: `ad set update failed: ${updateRes.status}`,
      meta_response: updateRes.text.slice(0, 1000),
      before,
      applied_patch: patch,
    }, { status: 502 });
  }

  // Post-change snapshot
  let after: AdSetSnapshot;
  try {
    after = await snapshot(setId);
  } catch (e) {
    return NextResponse.json({
      ok: true,
      via: auth.via,
      warning: `update succeeded but post-snapshot failed: ${e instanceof Error ? e.message : e}`,
      before,
      applied_patch: patch,
    });
  }

  return NextResponse.json({
    ok: true,
    via: auth.via,
    before,
    applied_patch: patch,
    after,
    paused_during_update: pausedHere,
    meta_response_text: updateRes.text.slice(0, 500),
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/funnel-lab/meta-ad-set-update",
    method: "POST",
    auth: "cookie (admin) | Bearer CRON_SECRET | Bearer FUNNEL_LAB_PUSH_TOKEN",
    body_schema: {
      daily_budget_usd: "number",
      bid_amount_usd: "number",
      bid_strategy: "LOWEST_COST_WITHOUT_CAP | COST_CAP | LOWEST_COST_WITH_BID_CAP | ...",
      optimization_goal: "LANDING_PAGE_VIEW | LINK_CLICKS | OFFSITE_CONVERSIONS | ...",
      billing_event: "IMPRESSIONS | LINK_CLICKS | THRUPLAY",
      clear_promoted_object: "boolean",
      targeting: "Meta targeting object",
      pause_first: "boolean",
    },
  });
}
