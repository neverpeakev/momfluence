/**
 * Pricing A/B test for the LP baseline upgrade.
 *
 * Variant B — Risk-reversed:
 *   "$5/mo, credited back after your first $25 earned"
 *
 * Variant C — Skool-inspired exclusive:
 *   "$5/mo unlocks exclusive top-paying brands"
 *
 * Assignment:
 *   - Sticky cookie (mf_pricing_variant), 90-day max-age
 *   - 50/50 random on first visit
 *   - Persistent for the user across sessions so a returning visitor
 *     always sees the same pricing pitch
 *
 * Carries into Stripe Checkout metadata as `pricing_variant: B|C` so the
 * Funnel Lab admin can break down conversions by variant × creative × pricing.
 *
 * See docs/planning/lp-baseline-upgrade.md for the full spec.
 */

export type PricingVariant = "B" | "C";

export const PRICING_VARIANT_COOKIE = "mf_pricing_variant";
export const PRICING_VARIANT_MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 days

const VALID_VARIANTS: ReadonlyArray<PricingVariant> = ["B", "C"];

/**
 * Coerce an arbitrary cookie value to a PricingVariant, or null if invalid.
 */
export function parsePricingVariant(raw: string | undefined | null): PricingVariant | null {
  if (!raw) return null;
  return (VALID_VARIANTS as ReadonlyArray<string>).includes(raw)
    ? (raw as PricingVariant)
    : null;
}

/**
 * Random 50/50 assignment. Returns "B" or "C".
 */
export function randomPricingVariant(): PricingVariant {
  return Math.random() < 0.5 ? "B" : "C";
}

/**
 * Human-readable copy for each variant. These are the *short* labels —
 * the full hero/body/CTA copy lives in the section component itself.
 *
 * Update here only if you're renaming the variant; the actual copy
 * decisions belong in <SectionPricingABTest /> per the design agent's
 * deliverables.
 */
export const PRICING_VARIANT_LABELS: Record<PricingVariant, string> = {
  B: "Risk-reversed ($5 back after first $25)",
  C: "Exclusive access ($5 unlocks the door)",
};
