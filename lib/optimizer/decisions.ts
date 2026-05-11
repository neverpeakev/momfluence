/**
 * Decision engine.
 *
 * Given a snapshot of arm stats (visits, conversions, spend) and the current
 * settings, produces a list of Decisions: pause, scale, remix_proposed, or no_op.
 * Decisions are pure data — enactment happens in the tick handler.
 */

import type { ArmPosterior } from "./stats";

export type ActionType = "pause" | "scale" | "remix_proposed" | "no_op" | "tick_error";

export interface OptimizerSettings {
  mode: "shadow" | "live" | "paused";
  maxPausesPerTick: number;
  maxScalesPerTick: number;
  minVisitsPerArm: number;
  minConversionsPerArm: number;
  pWorstThreshold: number;
  pBestThreshold: number;
  scalePctPerDay: number;
  maxBudgetMultiplier: number;
  startingDailyBudget: number;
}

export interface Decision {
  variant: string;
  creative: string | null;
  metaAdId: string | null;
  actionType: ActionType;
  rationale: string;
  stats: {
    visits: number;
    conversions: number;
    spendUsd: number | null;
    cpaUsd: number | null;
    pBest: number;
    pWorst: number;
  };
}

export interface ArmInput {
  variant: string;
  creative: string | null;
  metaAdId: string | null;
  posterior: ArmPosterior;
  spendUsd: number;
}

/**
 * Plan decisions for a given tick.
 *
 * Order of operations:
 *   1. For every arm: check sufficient-data gates. Skip if not enough data → no_op.
 *   2. Rank arms by P(worst). Top-K below the pause threshold get pause decisions
 *      (capped by maxPausesPerTick).
 *   3. Rank arms by P(best). Top-K above the scale threshold get scale decisions
 *      (capped by maxScalesPerTick, AND skipped if any arm in their group is being
 *      paused — don't bump budget on a winner whose group is still being pruned).
 *   4. Single clear winner: if exactly one arm has P(best) > pBestThreshold AND
 *      P(worst) < 0.05 for all others below it, emit one remix_proposed action.
 *   5. Everything else: no_op (logged but not enacted).
 */
export function planDecisions(
  arms: ArmInput[],
  settings: OptimizerSettings
): Decision[] {
  if (settings.mode === "paused") {
    return arms.map((a) => ({
      ...armToTarget(a),
      actionType: "no_op",
      rationale: "Optimizer paused via admin UI",
      stats: armToStats(a),
    }));
  }

  const decisions: Decision[] = [];
  const eligible: ArmInput[] = [];
  const insufficient: ArmInput[] = [];

  for (const a of arms) {
    if (
      a.posterior.visits >= settings.minVisitsPerArm &&
      a.posterior.conversions >= settings.minConversionsPerArm
    ) {
      eligible.push(a);
    } else {
      insufficient.push(a);
    }
  }

  // 1. Insufficient-data arms get no-op (with explanatory rationale)
  for (const a of insufficient) {
    decisions.push({
      ...armToTarget(a),
      actionType: "no_op",
      rationale: `Insufficient data — visits=${a.posterior.visits} (need ≥${settings.minVisitsPerArm}), conv=${a.posterior.conversions} (need ≥${settings.minConversionsPerArm})`,
      stats: armToStats(a),
    });
  }

  // 2. PAUSE candidates: arms with high P(worst), sorted desc
  const pauseCandidates = eligible
    .filter((a) => a.posterior.pWorst >= settings.pWorstThreshold)
    .sort((a, b) => b.posterior.pWorst - a.posterior.pWorst);

  const toPause = new Set<string>();
  for (const a of pauseCandidates.slice(0, settings.maxPausesPerTick)) {
    toPause.add(armKey(a));
    decisions.push({
      ...armToTarget(a),
      actionType: "pause",
      rationale: `P(worst)=${a.posterior.pWorst.toFixed(3)} ≥ threshold ${settings.pWorstThreshold} after ${a.posterior.visits} visits / ${a.posterior.conversions} conv. Spending $${a.spendUsd.toFixed(2)} on an underperformer.`,
      stats: armToStats(a),
    });
  }

  // 3. SCALE candidates: arms with high P(best), excluding any we're pausing
  const scaleCandidates = eligible
    .filter((a) => !toPause.has(armKey(a)) && a.posterior.pBest >= settings.pBestThreshold)
    .sort((a, b) => b.posterior.pBest - a.posterior.pBest);

  for (const a of scaleCandidates.slice(0, settings.maxScalesPerTick)) {
    const targetBudget = Math.min(
      settings.startingDailyBudget * (1 + settings.scalePctPerDay),
      settings.startingDailyBudget * settings.maxBudgetMultiplier
    );
    decisions.push({
      ...armToTarget(a),
      actionType: "scale",
      rationale: `P(best)=${a.posterior.pBest.toFixed(3)} ≥ threshold ${settings.pBestThreshold} after ${a.posterior.visits} visits / ${a.posterior.conversions} conv. Bump daily budget +${(settings.scalePctPerDay * 100).toFixed(0)}% to $${targetBudget.toFixed(2)} (cap ${settings.maxBudgetMultiplier}× starting).`,
      stats: armToStats(a),
    });
  }

  // 4. REMIX proposal: single clear winner — only when we have one decisive
  // leader AND we're not also pausing/scaling them (avoid a busy tick).
  if (scaleCandidates.length === 1 && pauseCandidates.length <= 1) {
    const winner = scaleCandidates[0];
    decisions.push({
      ...armToTarget(winner),
      actionType: "remix_proposed",
      rationale: `Clear leader (P(best)=${winner.posterior.pBest.toFixed(3)}). Queueing 3 LLM-generated remix candidates for admin review.`,
      stats: armToStats(winner),
    });
  }

  // 5. Everything else eligible but no action → no_op
  const acted = new Set<string>();
  for (const d of decisions) acted.add(`${d.variant}:${d.creative ?? ""}`);
  for (const a of eligible) {
    const key = `${a.variant}:${a.creative ?? ""}`;
    if (acted.has(key)) continue;
    decisions.push({
      ...armToTarget(a),
      actionType: "no_op",
      rationale: `No action: P(best)=${a.posterior.pBest.toFixed(3)}, P(worst)=${a.posterior.pWorst.toFixed(3)} — within "wait and see" band.`,
      stats: armToStats(a),
    });
  }

  return decisions;
}

function armKey(a: ArmInput): string {
  return `${a.variant}:${a.creative ?? ""}`;
}

function armToTarget(a: ArmInput): Pick<Decision, "variant" | "creative" | "metaAdId"> {
  return {
    variant: a.variant,
    creative: a.creative,
    metaAdId: a.metaAdId,
  };
}

function armToStats(a: ArmInput): Decision["stats"] {
  const cpa =
    a.posterior.conversions > 0 ? a.spendUsd / a.posterior.conversions : null;
  return {
    visits: a.posterior.visits,
    conversions: a.posterior.conversions,
    spendUsd: a.spendUsd,
    cpaUsd: cpa,
    pBest: a.posterior.pBest,
    pWorst: a.posterior.pWorst,
  };
}
