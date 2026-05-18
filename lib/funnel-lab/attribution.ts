/**
 * Funnel Lab attribution.
 *
 * Captures the LP variant and creative id from the URL on first touch, persists in a
 * 30-day cookie, and exposes a helper to fold the attribution into Stripe Checkout
 * metadata so we can aggregate Purchase events by variant + creative without a
 * Supabase schema change.
 *
 * Cookies (read on signup, written on /lp/ visit):
 *   mf_lp        — variant slug (e.g. "group-chat-goldmine")
 *   mf_creative  — creative id  (e.g. "c11")
 *   mf_first_seen — ISO timestamp of first /lp/ touch (for window-of-attribution debugging)
 */

export const ATTR_COOKIE = {
  variant: "mf_lp",
  creative: "mf_creative",
  firstSeen: "mf_first_seen",
} as const;

export const ATTR_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface Attribution {
  variant?: string;
  creative?: string;
  firstSeen?: string;
  /**
   * LP baseline pricing A/B variant ("B" risk-reversed or "C" exclusive).
   * Carried into Stripe metadata so /admin/funnel-lab can break conversions
   * down by variant × creative × pricing. See:
   *   docs/planning/lp-baseline-upgrade.md §7
   *   components/landing/sections/SectionPricingABTest.tsx
   */
  pricingVariant?: "B" | "C";
}

/**
 * Coerce raw search-param input into a sanitized attribution object.
 * Slugs and creative ids must match [a-z0-9-]{1,40} to be accepted —
 * defense-in-depth against weird query-string injection.
 */
interface QueryLike {
  get(key: string): string | null;
}

export function parseAttributionFromQuery(
  query: QueryLike | Record<string, string | undefined> | undefined
): Attribution {
  if (!query) return {};
  const get = (key: string): string | undefined => {
    if (typeof (query as QueryLike).get === "function") {
      return (query as QueryLike).get(key) ?? undefined;
    }
    return (query as Record<string, string | undefined>)[key];
  };

  const rawPricing = get("pricing_variant");
  const pricingVariant: "B" | "C" | undefined =
    rawPricing === "B" || rawPricing === "C" ? rawPricing : undefined;

  return {
    variant: sanitize(get("lp")),
    creative: sanitize(get("c") ?? get("creative")),
    pricingVariant,
  };
}

function sanitize(v: string | undefined): string | undefined {
  if (!v) return undefined;
  return /^[a-z0-9-]{1,40}$/.test(v) ? v : undefined;
}

/**
 * Read attribution from document.cookie (client-side helper).
 * Returns undefined fields if cookies are missing.
 */
export function readAttributionFromCookies(): Attribution {
  if (typeof document === "undefined") return {};
  const cookies = Object.fromEntries(
    document.cookie.split("; ").filter(Boolean).map((c) => {
      const [k, ...rest] = c.split("=");
      return [k, decodeURIComponent(rest.join("="))];
    })
  );
  return {
    variant: sanitize(cookies[ATTR_COOKIE.variant]),
    creative: sanitize(cookies[ATTR_COOKIE.creative]),
    firstSeen: cookies[ATTR_COOKIE.firstSeen],
  };
}

/**
 * Write attribution cookies in the browser. No-op on the server.
 * Note: the pricing-variant cookie (mf_pricing_variant) is set server-side
 * by <LPBaseline /> with a 90-day max-age and is intentionally NOT
 * managed here so the two systems remain decoupled.
 */
export function writeAttributionToCookies(a: Attribution): void {
  if (typeof document === "undefined") return;
  const set = (k: string, v: string) => {
    document.cookie = `${k}=${encodeURIComponent(v)}; path=/; max-age=${ATTR_COOKIE_MAX_AGE}; SameSite=Lax`;
  };
  if (a.variant) set(ATTR_COOKIE.variant, a.variant);
  if (a.creative) set(ATTR_COOKIE.creative, a.creative);
  if (a.firstSeen) set(ATTR_COOKIE.firstSeen, a.firstSeen);
}

/**
 * Build the Stripe Checkout `metadata` object from attribution data.
 * Stripe metadata is key:string -> value:string, max 50 keys, value max 500 chars.
 */
export function toStripeMetadata(a: Attribution): Record<string, string> {
  const out: Record<string, string> = {};
  if (a.variant) out.lp_variant = a.variant;
  if (a.creative) out.creative_id = a.creative;
  if (a.firstSeen) out.lp_first_seen = a.firstSeen;
  if (a.pricingVariant) out.pricing_variant = a.pricingVariant;
  return out;
}
