/**
 * Bayesian beta-binomial multi-armed bandit math.
 *
 * Each arm (variant × creative combo) is modelled as Beta(α, β) over its
 * conversion rate, with α = 1 + conversions and β = 1 + (visits - conversions).
 * Beta(1,1) is the uniform prior — no opinion before data.
 *
 * For decisions we sample N draws from each arm's posterior and compute:
 *   - P(this arm is best)  = fraction of draws where this arm > all others
 *   - P(this arm is worst) = fraction of draws where this arm < all others
 *
 * Why Bayesian, not chi-square / Fisher's exact?
 *  - Gives direct probability statements ("there's a 96% chance this is the worst")
 *    instead of p-values, which marketers (and CTOs) read more cleanly
 *  - Works correctly at small sample sizes — no "we haven't reached significance yet"
 *    paralysis
 *  - Naturally combines with min-sample gates for safety
 */

export interface ArmStats {
  /** Unique identifier — typically "<variant>:<creative>". */
  key: string;
  visits: number;
  conversions: number;
}

export interface ArmPosterior extends ArmStats {
  /** Posterior probability this arm has the highest CR among all arms. */
  pBest: number;
  /** Posterior probability this arm has the lowest CR among all arms. */
  pWorst: number;
  /** Point estimate (mean of posterior) — α / (α + β). */
  meanCr: number;
}

/**
 * Gamma function via Lanczos approximation. Used only inside sampleBeta when
 * the BSON-rejection path needs it; the path we actually use (Marsaglia) is
 * gamma-free, so this is here as a fallback if we ever switch strategies.
 *
 * Currently unused — kept around so the file stays self-contained.
 */

/**
 * Sample a Gamma(shape, 1) draw via Marsaglia & Tsang's method (2000).
 * Valid for shape >= 1. For shape < 1 we boost to shape+1 and rescale.
 */
function sampleGamma(shape: number, rand: () => number): number {
  if (shape < 1) {
    const u = rand();
    return sampleGamma(shape + 1, rand) * Math.pow(u, 1 / shape);
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x: number, v: number;
    do {
      x = randNormal(rand);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rand();
    if (u < 1 - 0.0331 * Math.pow(x, 4)) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

/** Box-Muller normal sample. */
function randNormal(rand: () => number): number {
  let u1 = 0;
  let u2 = 0;
  while (u1 === 0) u1 = rand();
  while (u2 === 0) u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Sample from Beta(α, β) using two gamma draws. */
function sampleBeta(alpha: number, beta: number, rand: () => number): number {
  const x = sampleGamma(alpha, rand);
  const y = sampleGamma(beta, rand);
  return x / (x + y);
}

/**
 * Compute posterior P(best) and P(worst) for every arm via Monte Carlo.
 * draws=10_000 gives ±0.5% precision on probability estimates — plenty.
 */
export function computePosteriors(arms: ArmStats[], draws = 10_000): ArmPosterior[] {
  if (arms.length === 0) return [];
  if (arms.length === 1) {
    const a = arms[0];
    return [
      {
        ...a,
        pBest: 1,
        pWorst: 1,
        meanCr: (a.conversions + 1) / (a.visits + 2),
      },
    ];
  }

  // Seeded PRNG (xorshift32) so identical inputs produce identical outputs —
  // matters for testability and for reproducing decisions in the audit log.
  // Seed derived from total visits + conversions across arms.
  let seed = 0x12345678;
  for (const a of arms) seed = (seed ^ (a.visits * 2654435761) ^ (a.conversions * 40503)) >>> 0;
  if (seed === 0) seed = 1;
  const rand = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed >>>= 0;
    return seed / 0x100000000;
  };

  const winCounts = new Array(arms.length).fill(0);
  const lossCounts = new Array(arms.length).fill(0);

  for (let d = 0; d < draws; d++) {
    let bestIdx = 0;
    let worstIdx = 0;
    let bestCr = -Infinity;
    let worstCr = Infinity;
    for (let i = 0; i < arms.length; i++) {
      const a = arms[i];
      const cr = sampleBeta(a.conversions + 1, a.visits - a.conversions + 1, rand);
      if (cr > bestCr) {
        bestCr = cr;
        bestIdx = i;
      }
      if (cr < worstCr) {
        worstCr = cr;
        worstIdx = i;
      }
    }
    winCounts[bestIdx] += 1;
    lossCounts[worstIdx] += 1;
  }

  return arms.map((a, i) => ({
    ...a,
    pBest: winCounts[i] / draws,
    pWorst: lossCounts[i] / draws,
    meanCr: (a.conversions + 1) / (a.visits + 2),
  }));
}

/**
 * Helper — does this arm have enough data for a decision?
 * Both thresholds must pass. Set thresholds from optimizer_settings.
 */
export function hasSufficientData(
  arm: ArmStats,
  minVisits: number,
  minConversions: number
): boolean {
  return arm.visits >= minVisits && arm.conversions >= minConversions;
}
