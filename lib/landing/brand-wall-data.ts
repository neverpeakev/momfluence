/**
 * Brand wall content for the LP baseline §5.
 *
 * Sourced from the live `offers` table in Supabase (status='active') as of
 * 2026-05-18. When new offers are added or paused, refresh this file by
 * running:
 *
 *   SELECT brand, vertical, payout_type, upstream_payout_cents
 *   FROM offers WHERE status='active' ORDER BY brand;
 *
 * Future refactor: read this at build time via a generateStaticProps-style
 * call so the brand wall stays automatically in sync.
 *
 * Brand logo usage: standard affiliate-partner usage is approved per
 * docs/planning/lp-baseline-upgrade.md "Decisions locked." When the design
 * agent sources logo SVGs they go into /public/lp-baseline/logos/ keyed
 * by brand slug; we render the SVG if present, else the styled brand-name
 * card fallback below.
 */

export interface BrandWallBrand {
  brand: string;
  vertical: string;
  /** "cpa" (one-time payout per signup), "cpl" (per lead), "rev_share" (recurring %) */
  payoutType: "cpa" | "cpl" | "rev_share";
  /** In dollars; null if rev_share (variable). */
  payoutDollars: number | null;
  /** True if this brand gets a payout-example callout card. */
  highlight?: boolean;
}

/**
 * Verticals ordered for the brand wall display.
 */
export const VERTICALS = [
  { slug: "streaming", label: "Streaming" },
  { slug: "beauty", label: "Beauty" },
  { slug: "savings-apps", label: "Savings apps" },
  { slug: "pet-food", label: "Pet food" },
  { slug: "creator-tools", label: "Creator tools" },
  { slug: "family-safety", label: "Family safety" },
  { slug: "health", label: "Health" },
  { slug: "home", label: "Home" },
  { slug: "apps", label: "Apps" },
  { slug: "food-and-drink", label: "Food & drink" },
] as const;

export const BRANDS: ReadonlyArray<BrandWallBrand> = [
  // Streaming
  { brand: "Hulu", vertical: "streaming", payoutType: "cpa", payoutDollars: 1.6 },
  { brand: "Paramount+", vertical: "streaming", payoutType: "cpa", payoutDollars: 7.2, highlight: true },

  // Beauty
  { brand: "Geologie", vertical: "beauty", payoutType: "cpa", payoutDollars: 10 },

  // Savings apps
  { brand: "Klarna", vertical: "savings-apps", payoutType: "cpa", payoutDollars: 35, highlight: true },
  { brand: "Gizmogo", vertical: "savings-apps", payoutType: "cpa", payoutDollars: 5 },
  { brand: "Rita.ai", vertical: "savings-apps", payoutType: "rev_share", payoutDollars: null },

  // Pet food
  { brand: "Open Farm", vertical: "pet-food", payoutType: "cpa", payoutDollars: 60, highlight: true },
  { brand: "Meow Mobile", vertical: "pet-food", payoutType: "cpa", payoutDollars: 25 },

  // Creator tools
  { brand: "Shopify", vertical: "creator-tools", payoutType: "cpa", payoutDollars: 50, highlight: true },
  { brand: "Base44", vertical: "creator-tools", payoutType: "cpa", payoutDollars: 50, highlight: true },
  { brand: "TikTok", vertical: "creator-tools", payoutType: "cpa", payoutDollars: 10 },
  { brand: "CapCut", vertical: "creator-tools", payoutType: "rev_share", payoutDollars: null },
  { brand: "Riverside", vertical: "creator-tools", payoutType: "rev_share", payoutDollars: null },
  { brand: "InVideo", vertical: "creator-tools", payoutType: "rev_share", payoutDollars: null },
  { brand: "Namecheap", vertical: "creator-tools", payoutType: "cpa", payoutDollars: 10 },
  { brand: "Hostinger", vertical: "creator-tools", payoutType: "rev_share", payoutDollars: null },
  { brand: "SSLs.com", vertical: "creator-tools", payoutType: "rev_share", payoutDollars: null },

  // Family safety
  { brand: "SentryPC", vertical: "family-safety", payoutType: "cpa", payoutDollars: 32 },

  // Health
  { brand: "Sesame Care", vertical: "health", payoutType: "cpl", payoutDollars: 80, highlight: true },

  // Home
  { brand: "GTPLAYER", vertical: "home", payoutType: "rev_share", payoutDollars: null },

  // Apps
  { brand: "Nexters", vertical: "apps", payoutType: "cpl", payoutDollars: 2 },

  // Food & drink
  { brand: "Wine Express", vertical: "food-and-drink", payoutType: "cpa", payoutDollars: 10 },
];

/**
 * Highlighted brands — these get an expandable payout-example card.
 */
export const HIGHLIGHTED_BRANDS = BRANDS.filter((b) => b.highlight);

/**
 * Pretty-print the payout for a brand. Returns null for rev_share since the
 * actual $ varies — better to show "Recurring %" than a misleading flat number.
 */
export function payoutLabel(b: BrandWallBrand): string {
  if (b.payoutType === "rev_share") return "Recurring %";
  if (b.payoutDollars == null) return "—";
  if (b.payoutType === "cpl") return `$${b.payoutDollars.toFixed(0)} per lead`;
  return `$${b.payoutDollars.toFixed(b.payoutDollars % 1 === 0 ? 0 : 2)} per signup`;
}
