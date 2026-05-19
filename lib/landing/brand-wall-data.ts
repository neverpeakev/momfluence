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
  /** kebab-case identifier — matches /public/lp-baseline/logos/<slug>.svg + BRAND_MARKS key. */
  slug: string;
  vertical: string;
  /** "cpa" (one-time payout per signup), "cpl" (per lead), "rev_share" (recurring %) */
  payoutType: "cpa" | "cpl" | "rev_share";
  /** In dollars; null if rev_share (variable). */
  payoutDollars: number | null;
  /** True if this brand gets a payout-example callout card. */
  highlight?: boolean;
  /** True if /public/lp-baseline/logos/<slug>.svg exists. When true the
   *  BrandMarkChip mask-renders the SVG in the chip's foreground color
   *  instead of showing the BRAND_MARKS letter fallback. */
  hasLogo?: boolean;
}

/**
 * Letter-mark fallback (brand-colored chip with initials) used until a real
 * SVG logo lands in /public/lp-baseline/logos/<slug>.svg. Keys match
 * BrandWallBrand.slug. Colors are eyeballed from each brand's public marks
 * — close-enough for "feels like the real brand" at chip size, replaced by
 * the SVG file the moment one is added.
 */
export interface BrandMark {
  bg: string;
  fg: string;
  mark: string;
}

export const BRAND_MARKS: Record<string, BrandMark> = {
  hulu: { bg: "#1ce783", fg: "#0b3b1f", mark: "h" },
  paramount: { bg: "#0064ff", fg: "#fff", mark: "P+" },
  geologie: { bg: "#1a1a1a", fg: "#ffd6a8", mark: "G" },
  klarna: { bg: "#ffa8cd", fg: "#17120e", mark: "K" },
  gizmogo: { bg: "#0a7d3a", fg: "#fff", mark: "Gz" },
  rita: { bg: "#5b3df5", fg: "#fff", mark: "R" },
  openfarm: { bg: "#3e6b3a", fg: "#fff", mark: "OF" },
  meowmobile: { bg: "#ff8e3c", fg: "#1c2541", mark: "M" },
  shopify: { bg: "#7ab55c", fg: "#fff", mark: "S" },
  base44: { bg: "#141a30", fg: "#ff8d6f", mark: "B" },
  tiktok: { bg: "#000", fg: "#25f4ee", mark: "tt" },
  capcut: { bg: "#000", fg: "#fff", mark: "Cc" },
  riverside: { bg: "#9145ff", fg: "#fff", mark: "Rv" },
  invideo: { bg: "#2563eb", fg: "#fff", mark: "iV" },
  namecheap: { bg: "#de3723", fg: "#fff", mark: "Nc" },
  hostinger: { bg: "#673de6", fg: "#fff", mark: "H" },
  ssls: { bg: "#0088cc", fg: "#fff", mark: "SS" },
  sentrypc: { bg: "#1f2a44", fg: "#ffd166", mark: "Sp" },
  sesame: { bg: "#ffe2a8", fg: "#7c3a0d", mark: "Sc" },
  gtplayer: { bg: "#dc2626", fg: "#fff", mark: "GT" },
  nexters: { bg: "#0ea5e9", fg: "#fff", mark: "Nx" },
  wineexpress: { bg: "#5c1d12", fg: "#fff8e7", mark: "We" },
};

/** Safe lookup: returns a slate fallback if the slug isn't in BRAND_MARKS. */
export function brandMark(slug: string, brand: string): BrandMark {
  return BRAND_MARKS[slug] ?? { bg: "#141a30", fg: "#fff", mark: brand.charAt(0) };
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
  { brand: "Hulu", slug: "hulu", vertical: "streaming", payoutType: "cpa", payoutDollars: 1.6, hasLogo: true },
  { brand: "Paramount+", slug: "paramount", vertical: "streaming", payoutType: "cpa", payoutDollars: 7.2, highlight: true, hasLogo: true },

  // Beauty
  { brand: "Geologie", slug: "geologie", vertical: "beauty", payoutType: "cpa", payoutDollars: 10 },

  // Savings apps
  { brand: "Klarna", slug: "klarna", vertical: "savings-apps", payoutType: "cpa", payoutDollars: 35, highlight: true, hasLogo: true },
  { brand: "Gizmogo", slug: "gizmogo", vertical: "savings-apps", payoutType: "cpa", payoutDollars: 5 },
  { brand: "Rita.ai", slug: "rita", vertical: "savings-apps", payoutType: "rev_share", payoutDollars: null },

  // Pet food
  { brand: "Open Farm", slug: "openfarm", vertical: "pet-food", payoutType: "cpa", payoutDollars: 60, highlight: true },
  { brand: "Meow Mobile", slug: "meowmobile", vertical: "pet-food", payoutType: "cpa", payoutDollars: 25 },

  // Creator tools
  { brand: "Shopify", slug: "shopify", vertical: "creator-tools", payoutType: "cpa", payoutDollars: 50, highlight: true, hasLogo: true },
  { brand: "Base44", slug: "base44", vertical: "creator-tools", payoutType: "cpa", payoutDollars: 50, highlight: true },
  { brand: "TikTok", slug: "tiktok", vertical: "creator-tools", payoutType: "cpa", payoutDollars: 10, hasLogo: true },
  { brand: "CapCut", slug: "capcut", vertical: "creator-tools", payoutType: "rev_share", payoutDollars: null },
  { brand: "Riverside", slug: "riverside", vertical: "creator-tools", payoutType: "rev_share", payoutDollars: null },
  { brand: "InVideo", slug: "invideo", vertical: "creator-tools", payoutType: "rev_share", payoutDollars: null },
  { brand: "Namecheap", slug: "namecheap", vertical: "creator-tools", payoutType: "cpa", payoutDollars: 10, hasLogo: true },
  { brand: "Hostinger", slug: "hostinger", vertical: "creator-tools", payoutType: "rev_share", payoutDollars: null, hasLogo: true },
  { brand: "SSLs.com", slug: "ssls", vertical: "creator-tools", payoutType: "rev_share", payoutDollars: null },

  // Family safety
  { brand: "SentryPC", slug: "sentrypc", vertical: "family-safety", payoutType: "cpa", payoutDollars: 32 },

  // Health
  { brand: "Sesame Care", slug: "sesame", vertical: "health", payoutType: "cpl", payoutDollars: 80, highlight: true },

  // Home
  { brand: "GTPLAYER", slug: "gtplayer", vertical: "home", payoutType: "rev_share", payoutDollars: null },

  // Apps
  { brand: "Nexters", slug: "nexters", vertical: "apps", payoutType: "cpl", payoutDollars: 2 },

  // Food & drink
  { brand: "Wine Express", slug: "wineexpress", vertical: "food-and-drink", payoutType: "cpa", payoutDollars: 10 },
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
