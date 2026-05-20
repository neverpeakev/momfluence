/**
 * Funnel Lab v2 — Optimizer cron tick.
 *
 * Triggered by Vercel Cron every 6 hours (see vercel.json).
 *
 * Flow:
 *   1. Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` — we verify.
 *   2. Read settings (mode + thresholds). If mode=paused, log a no-op tick and exit.
 *   3. Pull Stripe subscriptions in the last 14 days, group by lp_variant + creative_id.
 *   4. Pull Meta ad insights (last 7 days) for the configured ad set.
 *   5. Join: visits/spend from Meta + conversions from Stripe → ArmInput[].
 *   6. Compute Bayesian posteriors.
 *   7. Plan decisions.
 *   8. Enact (if mode=live) or just log (if mode=shadow).
 *   9. For remix_proposed decisions: call Anthropic, store proposed copy.
 *  10. Update tick row with summary + duration.
 *
 * Never throws to the cron runner — we always return 200 with structured body.
 */

import { NextResponse, type NextRequest } from "next/server";
import { VARIANTS } from "@/lib/funnel-lab/variants";
import { computePosteriors, type ArmStats } from "@/lib/optimizer/stats";
import { planDecisions, type ArmInput, type Decision } from "@/lib/optimizer/decisions";
import {
  readSettings,
  startTick,
  finishTick,
  logAction,
  logTickError,
} from "@/lib/optimizer/audit";
import {
  listAds,
  getAdInsights,
  pauseAd,
  getAdSet,
  setAdSetDailyBudget,
  isConfigured as metaIsConfigured,
} from "@/lib/optimizer/meta-client";
import { generateRemixCandidates } from "@/lib/optimizer/anthropic-client";
import Stripe from "stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const got = req.headers.get("authorization");
  return got === `Bearer ${expected.trim()}`;
}

interface StripeRollup {
  // key = "<variant>:<creative>"
  byArm: Map<string, { variant: string; creative: string; conversions: number }>;
  totalSignups: number;
}

async function fetchStripeRollup(): Promise<StripeRollup> {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) throw new Error("STRIPE_SECRET_KEY not set");
  const stripe = new Stripe(secret, { maxNetworkRetries: 1, timeout: 15000 });

  const byArm = new Map<string, { variant: string; creative: string; conversions: number }>();
  let totalSignups = 0;
  let starting_after: string | undefined;
  let pages = 0;

  // Look back at the most recent 500 subs (5 pages of 100). v2.1 will accept a cursor.
  while (pages < 5) {
    const batch = await stripe.subscriptions.list({
      limit: 100,
      starting_after,
    });
    for (const sub of batch.data) {
      const variant = sub.metadata?.lp_variant;
      if (!variant) continue;
      const creative = sub.metadata?.creative_id ?? "(none)";
      const key = `${variant}:${creative}`;
      const bucket = byArm.get(key) ?? { variant, creative, conversions: 0 };
      bucket.conversions += 1;
      byArm.set(key, bucket);
      totalSignups += 1;
    }
    if (!batch.has_more) break;
    starting_after = batch.data[batch.data.length - 1]?.id;
    pages += 1;
  }

  return { byArm, totalSignups };
}

export async function GET(req: NextRequest) {
  return handleTick(req);
}

export async function POST(req: NextRequest) {
  return handleTick(req);
}

async function handleTick(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const t0 = Date.now();
  let tickId: string | null = null;

  try {
    const settings = await readSettings();
    tickId = await startTick(settings.mode);

    if (settings.mode === "paused") {
      await finishTick(tickId, {
        durationMs: Date.now() - t0,
        variantsSeen: VARIANTS.length,
      });
      return NextResponse.json({ ok: true, mode: "paused", message: "Optimizer paused via admin." });
    }

    // Verify Meta is configured. If not, we can still run in shadow mode using only
    // Stripe data, just without spend info. Log a warning.
    const metaCfg = metaIsConfigured();
    let stripeRollup: StripeRollup;
    let metaAds: Awaited<ReturnType<typeof listAds>> = [];
    let metaInsights: Awaited<ReturnType<typeof getAdInsights>> = [];

    try {
      stripeRollup = await fetchStripeRollup();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await logTickError(tickId, `Stripe pull failed: ${msg}`);
      await finishTick(tickId, {
        durationMs: Date.now() - t0,
        dataPullOk: false,
        errorMessage: msg,
      });
      return NextResponse.json({ ok: false, error: msg }, { status: 200 });
    }

    if (metaCfg.ok) {
      try {
        [metaAds, metaInsights] = await Promise.all([listAds(), getAdInsights(7)]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await logTickError(tickId, `Meta pull failed: ${msg}`);
        // Continue — we can still log shadow decisions with conversion data only.
      }
    } else {
      await logTickError(tickId, `Meta not configured: missing ${metaCfg.missing.join(",")}`);
    }

    // Map Meta ads ↔ variants. Convention: ad name starts with the creative id.
    // Image ads (campaign-builder.ts) use `c\d+` → e.g. "c11 — group-chat-goldmine".
    // Video ads (video-ad-builder.ts, added 2026-05-20) use `v-YYYYMM-<scene>-<slug>`
    // → e.g. "v-202605-a-group-chat — group-chat-goldmine". Both prefixes are
    // accepted here so both formats attribute back to optimizer arms.
    const adByCreative = new Map<string, { id: string; name: string }>();
    for (const ad of metaAds) {
      // Try video-prefix first (more specific); fall back to image-prefix.
      const videoMatch = ad.name.match(/^(v-\d{4,6}-[a-z]-[a-z0-9-]+)\b/i);
      const imageMatch = videoMatch ? null : ad.name.match(/^(c\d+)\b/i);
      const m = videoMatch ?? imageMatch;
      if (m) adByCreative.set(m[1].toLowerCase(), { id: ad.id, name: ad.name });
    }

    const insightsByAdId = new Map(metaInsights.map((i) => [i.ad_id, i]));

    // Build arms — one per variant × its primary creative.
    const arms: ArmInput[] = VARIANTS.map((v) => {
      const adCreative = v.primaryCreativeId;
      const ad = adByCreative.get(adCreative);
      const ins = ad ? insightsByAdId.get(ad.id) : undefined;

      const visits = ins?.clicks ?? 0;
      const conversions =
        stripeRollup.byArm.get(`${v.slug}:${adCreative}`)?.conversions ?? 0;
      const spendUsd = ins?.spend ?? 0;

      const posterior = computePosteriors([{ key: v.slug, visits, conversions }])[0];

      return {
        variant: v.slug,
        creative: adCreative,
        metaAdId: ad?.id ?? null,
        posterior,
        spendUsd,
      };
    });

    // Joint posterior across all arms (single pass — more accurate than per-arm).
    const armStats: ArmStats[] = arms.map((a) => ({
      key: a.variant,
      visits: a.posterior.visits,
      conversions: a.posterior.conversions,
    }));
    const jointPosteriors = computePosteriors(armStats);
    for (let i = 0; i < arms.length; i++) {
      arms[i].posterior = jointPosteriors[i];
    }

    const decisions = planDecisions(arms, settings);

    // Enact (or just log in shadow)
    let pausesEnacted = 0;
    let scalesEnacted = 0;

    for (const d of decisions) {
      let enacted = false;
      let metaResponse: unknown = undefined;
      let proposedCopy: unknown = undefined;

      if (settings.mode === "live") {
        try {
          if (d.actionType === "pause" && d.metaAdId) {
            metaResponse = await pauseAd(d.metaAdId);
            enacted = true;
            pausesEnacted += 1;
          } else if (d.actionType === "scale") {
            const cur = await getAdSet();
            const curBudgetUsd = cur.daily_budget ? Number(cur.daily_budget) / 100 : settings.startingDailyBudget;
            const next = Math.min(
              curBudgetUsd * (1 + settings.scalePctPerDay),
              settings.startingDailyBudget * settings.maxBudgetMultiplier
            );
            metaResponse = await setAdSetDailyBudget(next);
            enacted = true;
            scalesEnacted += 1;
          }
        } catch (e) {
          metaResponse = { error: e instanceof Error ? e.message : String(e) };
          enacted = false;
        }
      }

      // Remix generation runs in BOTH shadow and live — it's not destructive,
      // and we want the candidates visible to admins regardless of mode.
      if (d.actionType === "remix_proposed") {
        const winner = VARIANTS.find((v) => v.slug === d.variant);
        if (winner) {
          try {
            const candidates = await generateRemixCandidates(winner, {
              visits: d.stats.visits,
              conversions: d.stats.conversions,
              spendUsd: d.stats.spendUsd ?? 0,
              cpaUsd: d.stats.cpaUsd ?? 0,
            });
            proposedCopy = candidates;
          } catch (e) {
            proposedCopy = { error: e instanceof Error ? e.message : String(e) };
          }
        }
      }

      await logAction(tickId, settings.mode, d, { enacted, metaResponse, proposedCopy });
    }

    await finishTick(tickId, {
      durationMs: Date.now() - t0,
      variantsSeen: VARIANTS.length,
      adsSeen: metaAds.length,
      signupsSeen: stripeRollup.totalSignups,
    });

    return NextResponse.json({
      ok: true,
      mode: settings.mode,
      durationMs: Date.now() - t0,
      decisions: decisions.length,
      pausesEnacted,
      scalesEnacted,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (tickId) {
      await logTickError(tickId, msg).catch(() => {});
      await finishTick(tickId, {
        durationMs: Date.now() - t0,
        dataPullOk: false,
        errorMessage: msg,
      }).catch(() => {});
    }
    return NextResponse.json({ ok: false, error: msg }, { status: 200 });
  }
}
