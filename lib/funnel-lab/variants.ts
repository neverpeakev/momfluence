/**
 * Funnel Lab variant registry.
 *
 * Each variant tests a distinct psychographic ANGLE on a shared lowest-common-denominator
 * foundation. Copy must stay jargon-free (assume no following, no AI experience, no prior
 * affiliate-marketing knowledge). The variant itself only swaps the hero, CTA copy, and a
 * couple of opt-in below-fold blocks — the funnel mechanics and proof sections are shared.
 *
 * Attribution chain:
 *   ad → /lp/<slug>?c=<creativeId> → /signup?lp=<slug>&c=<creativeId>
 *     → Stripe Checkout (metadata: lp_variant, creative_id)
 *     → /welcome → admin/funnel-lab aggregates by metadata
 */

export type FunnelShape = "direct" | "email-gate";

export type BelowFoldShape = "lean" | "full";

export interface FunnelVariant {
  /** URL slug — readable on purpose for the marketer skimming Ads Manager. */
  slug: string;
  /** Friendly label for the admin dashboard. */
  label: string;
  /** One-line hypothesis we're testing. Lives in the admin lab UI for traceability. */
  hypothesis: string;
  /** Psychographic angle this variant pulls. Used as a chip in /creatives. */
  angle: string;
  /** Funnel mechanic. v1 ships "direct" only; "email-gate" is wired but feature-flagged off. */
  funnel: FunnelShape;
  /** Which below-fold treatment to render. */
  belowFold: BelowFoldShape;
  /** Default creative ID associated with this variant (used in /creatives nav links). */
  primaryCreativeId: string;
  hero: {
    eyebrow: string;
    headline: string;
    /** Up to 2 short sentences. Stay LCD — no jargon. */
    subhead: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  /** Bottom-of-LP closing CTA. Re-stating the offer in the variant's voice. */
  closer: {
    headline: string;
    subhead: string;
  };
}

export const VARIANTS = [
  {
    slug: "group-chat-goldmine",
    label: "Group Chat is a Goldmine",
    hypothesis: "Moms with active group chats see their text threads as community, not audience.",
    angle: "community / group chat",
    funnel: "direct",
    belowFold: "full",
    primaryCreativeId: "c11",
    hero: {
      eyebrow: "no followers needed",
      headline: "Your group chat is a goldmine.",
      subhead: "You’re not an influencer. You’re a mom with friends who actually listen. Real brands will pay you 20–60% when those friends sign up through your link — every month, for as long as they stay.",
      ctaPrimary: "Get paid — $5/mo to start",
      ctaSecondary: "How it works →",
    },
    closer: {
      headline: "$5/month. Cancel anytime.",
      subhead: "Your fast-track first $25 unlocks day one. No following required.",
    },
  },
  {
    slug: "no-influencer-needed",
    label: "Make Money Without Being an Influencer",
    hypothesis: "Plain LCD framing for everyone — the universal pitch.",
    angle: "newbie / no-jargon",
    funnel: "direct",
    belowFold: "full",
    primaryCreativeId: "c12",
    hero: {
      eyebrow: "the simplest side income on the internet",
      headline: "Make money from your phone.\nWithout becoming an influencer.",
      subhead: "Pick a brand. Share a link. Get paid every time someone buys. No followers. No camera. No experience. $5/month to access — cancel anytime.",
      ctaPrimary: "Start earning — $5/mo",
      ctaSecondary: "Show me how →",
    },
    closer: {
      headline: "$5 in. $25 out, day one.",
      subhead: "Cancel anytime. No followers needed. No content needed. Real brand commissions.",
    },
  },
  {
    slug: "school-hours-income",
    label: "Earn Between Drop-off & Pickup",
    hypothesis: "Stay-at-home moms have predictable windows of unused time; tie the offer to that.",
    angle: "time-of-day / SAHM",
    funnel: "direct",
    belowFold: "lean",
    primaryCreativeId: "c13",
    hero: {
      eyebrow: "while the kids are at school",
      headline: "Earn between drop-off and pickup.",
      subhead: "Four minutes to set up. Five dollars a month. Pick a brand from your dashboard, share the link, and get paid every time someone buys. No commute, no boss, no schedule.",
      ctaPrimary: "Get started — $5/mo",
      ctaSecondary: "See the dashboard →",
    },
    closer: {
      headline: "Four minutes. Five dollars. Day-one $25 cashout.",
      subhead: "Set it up before the bus comes back.",
    },
  },
  {
    slug: "stealth-income",
    label: "Stealth Income (Don't Tell Anyone)",
    hypothesis: "Some moms want anonymity — they don’t want to ‘shill’ to friends.",
    angle: "anonymous / introvert",
    funnel: "direct",
    belowFold: "full",
    primaryCreativeId: "c14",
    hero: {
      eyebrow: "no awkward ‘check out my link!’ posts",
      headline: "Make money online.\nWithout telling a soul.",
      subhead: "You don’t have to message a single friend. Drop your link in a comment, in a Reddit thread, on a Pinterest pin, anywhere strangers hang out online. They click — you get paid. Forever.",
      ctaPrimary: "Get my stealth link — $5/mo",
      ctaSecondary: "Show me where to post →",
    },
    closer: {
      headline: "Your friends don’t need to know.",
      subhead: "$5 to get the link. $25 day-one cashout. Anywhere on the internet works.",
    },
  },
  {
    slug: "chatgpt-writes-it",
    label: "ChatGPT Writes It",
    hypothesis: "AI-curious moms who use ChatGPT instead of Google but don’t monetize it yet.",
    angle: "AI / empowerment",
    funnel: "direct",
    belowFold: "full",
    primaryCreativeId: "c15",
    hero: {
      eyebrow: "if you can copy & paste, you can do this",
      headline: "Let ChatGPT write the post.\nYou keep the commission.",
      subhead: "Pick a brand. We hand you the exact ChatGPT prompt. Paste it in. Six seconds later you’ve got 5 TikTok hooks or a Reddit post ready to share. The AI does the writing. You get paid.",
      ctaPrimary: "Start for $5/mo",
      ctaSecondary: "See the prompts →",
    },
    closer: {
      headline: "AI writes. You earn.",
      subhead: "Five dollars to access. Cancel anytime. New to AI? We’ll walk you through it.",
    },
  },
  {
    slug: "trusted-mom-economy",
    label: "Brands Pay for Mom Trust",
    hypothesis: "The thesis pitch — moms control household spend, brands desperately want access.",
    angle: "economy / thesis",
    funnel: "direct",
    belowFold: "full",
    primaryCreativeId: "c16",
    hero: {
      eyebrow: "moms control 85% of household spend",
      headline: "Brands pay billions to reach moms.\nFinally, you get a cut.",
      subhead: "Every 'which stroller should I get' question in a group chat is worth real money to the brand that wins. We've already negotiated the partnerships. You just share the link.",
      ctaPrimary: "Take your cut — $5/mo",
      ctaSecondary: "How much can I make? →",
    },
    closer: {
      headline: "Your recommendations move markets.",
      subhead: "Get paid for it. $5/mo. Cancel anytime.",
    },
  },
  {
    slug: "not-mlm",
    label: "Not MLM, Not a Scheme",
    hypothesis: "MLM-burned moms; pre-empt the objection so they don’t bounce on the LP.",
    angle: "skepticism bust",
    funnel: "direct",
    belowFold: "lean",
    primaryCreativeId: "c17",
    hero: {
      eyebrow: "we hate MLMs too",
      headline: "Not MLM.\nNot a course.\nJust affiliate links.",
      subhead: "Same kind of links every blogger and YouTuber uses — except we’ve already done the application, the interviews, and the negotiating. $5/mo to access. Cancel any time. No recruiting, no ‘downline,’ no weirdness.",
      ctaPrimary: "Show me — $5/mo",
      ctaSecondary: "Read the terms →",
    },
    closer: {
      headline: "No pyramids. No tiers. No recruiting.",
      subhead: "Just real affiliate links from real brands. Five bucks a month.",
    },
  },
  {
    slug: "twenty-five-day-one",
    label: "$25 Day One",
    hypothesis: "Specific-number direct-response moms; the proof-via-number psychographic.",
    angle: "specific number / proof",
    funnel: "direct",
    belowFold: "full",
    primaryCreativeId: "c18",
    hero: {
      eyebrow: "fast-track payout, day one",
      headline: "$5 in. $25 out.\nDay one.",
      subhead: "Pay $5 to join. Drop a few links anywhere online (group chat, Reddit, Pinterest, comments — anywhere). Hit $25 in commissions — cash out the same day. Most people hit it inside a week.",
      ctaPrimary: "Start for $5",
      ctaSecondary: "How fast really? →",
    },
    closer: {
      headline: "$5 → $25 day one. Math math math.",
      subhead: "Cancel any time. PayPal, Venmo, or bank transfer.",
    },
  },
  {
    slug: "real-receipts",
    label: "Real Dashboard, Real Receipts",
    hypothesis: "Skeptics who need to see numbers before they buy in.",
    angle: "proof / receipts",
    funnel: "direct",
    belowFold: "full",
    primaryCreativeId: "c19",
    hero: {
      eyebrow: "real moms. real numbers. real Venmo.",
      headline: "$72.40 last week.\nFrom 4 texts.",
      subhead: "This is a real first-month member's dashboard. 68 clicks. 12 sign-ups. $72.40 deposited Friday. From sharing four brand links to her mom group chat. That's it.",
      ctaPrimary: "See your dashboard — $5/mo",
      ctaSecondary: "Show me more receipts →",
    },
    closer: {
      headline: "Receipts speak louder than copy.",
      subhead: "Five dollars to get in. Cancel any time.",
    },
  },
  {
    slug: "faceless-creator",
    label: "Faceless Creator",
    hypothesis: "Edge persona: ‘I could probably start a faceless YouTube channel’ moms.",
    angle: "faceless brand / creator-curious",
    funnel: "direct",
    belowFold: "full",
    primaryCreativeId: "c20",
    hero: {
      eyebrow: "you don’t need a face, a following, or a niche",
      headline: "Start a faceless content brand.\nWe pay you for the clicks.",
      subhead: "Open a faceless TikTok or Pinterest. Use AI to make posts about the brands you love. Drop your tracked link in the bio. We pay you every time someone signs up — month after month, for as long as they stay.",
      ctaPrimary: "Start my faceless brand — $5/mo",
      ctaSecondary: "See how others do it →",
    },
    closer: {
      headline: "No face. No follower count. Real money.",
      subhead: "$5 to access. AI does the heavy lifting.",
    },
  },
] as const satisfies readonly FunnelVariant[];

export const VARIANT_SLUGS = VARIANTS.map((v) => v.slug);

export function findVariant(slug: string): FunnelVariant | undefined {
  return VARIANTS.find((v) => v.slug === slug);
}
