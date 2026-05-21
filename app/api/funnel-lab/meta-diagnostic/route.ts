/**
 * GET /api/funnel-lab/meta-diagnostic
 *
 * One-shot dump of every signal Meta exposes about why our ads might
 * (or might not) be delivering. Used when ads are paused/throttled
 * and we need to figure out the cause without clicking through 7 tabs
 * in Ads Manager.
 *
 * Pulls (in parallel where possible):
 *   - Ad account: status, balance, currency, disable_reason, funding,
 *     business_owner, spend_cap, amount_spent, account-level recommendations
 *   - Campaign: status, objective, special_ad_categories, configured_status,
 *     issues_info (Meta's "why isn't this serving" hints), recommendations
 *   - Ad set: status, effective_status, learning_stage_info, daily_budget,
 *     bid_strategy, bid_amount, optimization_goal, promoted_object,
 *     attribution_spec, targeting, issues_info, recommendations
 *   - Every ad in the set: status, effective_status, issues_info,
 *     recommendations, creative.id
 *   - Insights last 7d + last 24h at ad set level + per ad
 *
 * Returns a single JSON blob, plus computed "likely throttle reason"
 * hints so the caller doesn't need to read every Meta field.
 *
 * Auth: same as the other funnel-lab/* routes — admin cookie OR
 * Bearer CRON_SECRET OR Bearer FUNNEL_LAB_PUSH_TOKEN.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSsrClient } from "@/lib/supabase/server";
import {
  isConfigured,
  adAccountId,
  META_API_VERSION,
} from "@/lib/optimizer/meta-client";

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

async function metaGet<T>(path: string, qs?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (qs) for (const [k, v] of Object.entries(qs)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Meta GET ${path} → ${res.status}: ${text.slice(0, 800)}`);
  }
  return JSON.parse(text) as T;
}

interface IssueInfo {
  level?: string;
  error_code?: number;
  error_summary?: string;
  error_message?: string;
  error_user_title?: string;
  error_user_msg?: string;
}

interface MetaAccount {
  id: string;
  name?: string;
  account_status?: number;
  disable_reason?: number;
  currency?: string;
  spend_cap?: string;
  amount_spent?: string;
  balance?: string;
  business?: { id?: string; name?: string };
  funding_source_details?: { display_string?: string; type?: number };
  // capabilities, etc — keep response narrow
}

interface MetaAdSet {
  id: string;
  name?: string;
  status?: string;
  effective_status?: string;
  configured_status?: string;
  campaign_id?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  bid_strategy?: string;
  bid_amount?: string;
  optimization_goal?: string;
  billing_event?: string;
  attribution_spec?: unknown[];
  promoted_object?: { pixel_id?: string; custom_event_type?: string };
  targeting?: unknown;
  learning_stage_info?: { status?: string; attribution_windows?: string[] };
  issues_info?: IssueInfo[];
  recommendations?: Array<{ blame_field?: string; code?: number; confidence?: string; message?: string; importance?: string; title?: string }>;
}

interface MetaCampaign {
  id: string;
  name?: string;
  status?: string;
  effective_status?: string;
  objective?: string;
  special_ad_categories?: string[];
  issues_info?: IssueInfo[];
}

interface MetaAd {
  id: string;
  name?: string;
  status?: string;
  effective_status?: string;
  creative?: { id?: string };
  issues_info?: IssueInfo[];
  recommendations?: unknown[];
}

interface InsightRow {
  ad_id?: string;
  ad_name?: string;
  impressions?: string;
  clicks?: string;
  spend?: string;
  cpm?: string;
  ctr?: string;
  date_start?: string;
  date_stop?: string;
}

export async function GET(req: NextRequest) {
  const auth = await authorize(req);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const cfg = isConfigured();
  if (!cfg.ok) {
    return NextResponse.json({ ok: false, error: `Meta env missing: ${cfg.missing.join(", ")}` }, { status: 503 });
  }

  const accountId = adAccountId();
  const setId = adSetId();

  // Pull everything in parallel — each call is independent.
  const [
    accountRaw,
    adSetRaw,
    adsRaw,
    insights7dRaw,
    insights24hRaw,
  ] = await Promise.allSettled([
    metaGet<MetaAccount>(`/${accountId}`, {
      fields: "id,name,account_status,disable_reason,currency,spend_cap,amount_spent,balance,business,funding_source_details",
    }),
    metaGet<MetaAdSet>(`/${setId}`, {
      fields:
        "id,name,status,effective_status,configured_status,campaign_id,daily_budget,lifetime_budget," +
        "bid_strategy,bid_amount,optimization_goal,billing_event,attribution_spec,promoted_object," +
        "targeting,learning_stage_info,issues_info,recommendations",
    }),
    metaGet<{ data: MetaAd[] }>(`/${setId}/ads`, {
      fields: "id,name,status,effective_status,creative{id,name},issues_info,recommendations",
      limit: "100",
    }),
    metaGet<{ data: InsightRow[] }>(`/${setId}/insights`, {
      level: "ad",
      fields: "ad_id,ad_name,impressions,clicks,spend,cpm,ctr,date_start,date_stop",
      date_preset: "last_7d",
      limit: "200",
    }),
    metaGet<{ data: InsightRow[] }>(`/${setId}/insights`, {
      level: "ad",
      fields: "ad_id,ad_name,impressions,clicks,spend,cpm,ctr,date_start,date_stop",
      date_preset: "yesterday",
      limit: "200",
    }),
  ]);

  // Campaign — depends on adSet result
  let campaignRaw: PromiseSettledResult<MetaCampaign> | null = null;
  if (adSetRaw.status === "fulfilled" && adSetRaw.value.campaign_id) {
    try {
      const c = await metaGet<MetaCampaign>(`/${adSetRaw.value.campaign_id}`, {
        fields: "id,name,status,effective_status,objective,special_ad_categories,issues_info",
      });
      campaignRaw = { status: "fulfilled", value: c };
    } catch (e) {
      campaignRaw = { status: "rejected", reason: e instanceof Error ? e.message : String(e) };
    }
  }

  // Compute "likely throttle reasons" — a few rule-based hints so the
  // caller (probably me) doesn't have to manually scan every field.
  const reasons: string[] = [];
  if (accountRaw.status === "fulfilled") {
    const a = accountRaw.value;
    // account_status 1=ACTIVE 2=DISABLED 3=UNSETTLED 7=PENDING_RISK_REVIEW
    // 8=PENDING_SETTLEMENT 9=IN_GRACE_PERIOD 100=PENDING_CLOSURE 101=CLOSED 201=ANY_ACTIVE
    if (a.account_status !== 1) {
      reasons.push(`account_status=${a.account_status} (1=ACTIVE; anything else = not actively spending)`);
    }
    if (a.spend_cap && a.spend_cap !== "0") {
      const cap = parseInt(a.spend_cap, 10);
      const spent = parseInt(a.amount_spent ?? "0", 10);
      const remainingPct = ((cap - spent) / cap) * 100;
      if (remainingPct < 20) {
        reasons.push(`account-level spend_cap nearly exhausted: spent ${spent / 100} / cap ${cap / 100} (${remainingPct.toFixed(1)}% remaining)`);
      }
    }
    if (a.balance && parseInt(a.balance, 10) < 500) {
      // balance is in account-currency cents on most accounts
      reasons.push(`account balance is low: ${a.balance} cents (~$${(parseInt(a.balance, 10) / 100).toFixed(2)}). Top up the funding source.`);
    }
  } else {
    reasons.push(`account fetch failed: ${accountRaw.reason}`);
  }

  if (adSetRaw.status === "fulfilled") {
    const s = adSetRaw.value;
    if (s.effective_status && s.effective_status !== "ACTIVE") {
      reasons.push(`ad set effective_status=${s.effective_status} — not actively delivering`);
    }
    if (s.bid_strategy === "COST_CAP" && s.bid_amount) {
      const cap = parseInt(s.bid_amount, 10) / 100;
      reasons.push(`COST_CAP bid_amount = $${cap.toFixed(2)} (tight cap throttles delivery, especially during learning phase)`);
    }
    if (s.learning_stage_info?.status && s.learning_stage_info.status !== "SUCCESS") {
      reasons.push(`learning_stage status=${s.learning_stage_info.status} (LEARNING_LIMITED + LEARNING = Meta hasn't found enough conversions to optimize; needs ~50 conversions / 7 days)`);
    }
    if (s.issues_info && s.issues_info.length > 0) {
      for (const i of s.issues_info) {
        reasons.push(`ad set issue: ${i.error_user_title ?? i.error_summary ?? "?"} — ${i.error_user_msg ?? i.error_message ?? "?"}`);
      }
    }
  } else {
    reasons.push(`ad set fetch failed: ${adSetRaw.reason}`);
  }

  if (campaignRaw && campaignRaw.status === "fulfilled") {
    const c = campaignRaw.value;
    if (c.effective_status && c.effective_status !== "ACTIVE") {
      reasons.push(`campaign effective_status=${c.effective_status}`);
    }
    if (c.issues_info && c.issues_info.length > 0) {
      for (const i of c.issues_info) {
        reasons.push(`campaign issue: ${i.error_user_title ?? "?"} — ${i.error_user_msg ?? "?"}`);
      }
    }
  }

  if (adsRaw.status === "fulfilled") {
    const ads = adsRaw.value.data ?? [];
    const active = ads.filter((a) => a.effective_status === "ACTIVE").length;
    const paused = ads.filter((a) => a.effective_status === "PAUSED").length;
    const withIssues = ads.filter((a) => a.issues_info && a.issues_info.length > 0);
    if (active === 0) {
      reasons.push(`zero ads have effective_status=ACTIVE (paused=${paused}, total=${ads.length}). Nothing can serve.`);
    }
    for (const a of withIssues) {
      for (const i of a.issues_info ?? []) {
        reasons.push(`ad "${a.name}" issue: ${i.error_user_title ?? "?"} — ${i.error_user_msg ?? "?"}`);
      }
    }
  }

  // Insights totals
  const totals = (rows: InsightRow[] = []) => {
    const impressions = rows.reduce((s, r) => s + Number(r.impressions ?? 0), 0);
    const clicks = rows.reduce((s, r) => s + Number(r.clicks ?? 0), 0);
    const spend = rows.reduce((s, r) => s + Number(r.spend ?? 0), 0);
    return { impressions, clicks, spend };
  };
  const totals7d = insights7dRaw.status === "fulfilled" ? totals(insights7dRaw.value.data) : null;
  const totals24h = insights24hRaw.status === "fulfilled" ? totals(insights24hRaw.value.data) : null;

  if (totals7d && totals7d.impressions === 0 && totals7d.spend === 0 && reasons.length === 0) {
    reasons.push(
      `no impressions or spend in last 7d but no Meta-side errors surfaced. Common silent causes: (a) learning phase still ramping after recent edits (any change resets it), (b) audience pixel-fingerprint not built up, (c) creative quality scoring low, (d) too-narrow audience post-Advantage+, (e) account in light "low-spend new account" cohort`,
    );
  }

  return NextResponse.json({
    ok: true,
    via: auth.via,
    api_version: META_API_VERSION,
    timestamp: new Date().toISOString(),
    likely_throttle_reasons: reasons,
    account: accountRaw.status === "fulfilled" ? accountRaw.value : { error: accountRaw.reason },
    campaign: campaignRaw?.status === "fulfilled" ? campaignRaw.value : campaignRaw ? { error: campaignRaw.reason } : null,
    ad_set: adSetRaw.status === "fulfilled" ? adSetRaw.value : { error: adSetRaw.reason },
    ads: adsRaw.status === "fulfilled" ? adsRaw.value.data : [{ error: adsRaw.reason }],
    insights_7d: {
      totals: totals7d,
      rows: insights7dRaw.status === "fulfilled" ? insights7dRaw.value.data : null,
      error: insights7dRaw.status === "rejected" ? insights7dRaw.reason : null,
    },
    insights_24h: {
      totals: totals24h,
      rows: insights24hRaw.status === "fulfilled" ? insights24hRaw.value.data : null,
      error: insights24hRaw.status === "rejected" ? insights24hRaw.reason : null,
    },
  });
}
