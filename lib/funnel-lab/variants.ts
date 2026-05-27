/**
 * Funnel Lab variant registry.
 *
 * Each variant tests a distinct content_format / POV on a shared canonical
 * message. The MESSAGE is locked (see docs/product-thesis.md):
 *   1. Brands are paying regular moms now to recommend their products and services
 *   2. No million followers needed, no celebrity status
 *   3. Find out more at momfluence.app
 *
 * The variant only swaps the hero copy, the CTA copy, and a couple of opt-in
 * below-fold blocks — the funnel mechanics and proof sections are shared.
 *
 * v5 voice locked: "regular moms," "big bucks," "Find out more," "get yours"
 * or "get your cut" CTA. NO "gate-kept," NO "rev share," NO "everyday moms."
 *
 * Attribution chain:
 *   ad → /lp/<slug>?c=<creativeId> → /signup?lp=<slug>&c=<creativeId>
 *     → Stripe Checkout (metadata: lp_variant, creative_id)
 *     → /welcome → admin/funnel-lab aggregates by metadata
 */

export type FunnelShape = "direct" | "email-gate";

export type BelowFoldShape = "lean" | "full";

export type ContentFormat =
  | "anecdote"
  | "direct"
  | "math"
  | "brand-callout"
  | "objection-reframe";

export interface FunnelVariant {
  /** URL slug — readable on purpose for the marketer skimming Ads Manager. */
  slug: string;
  /** Friendly label for the admin dashboard. */
  label: string;
  /** One-line hypothesis we're testing. Lives in the admin lab UI for traceability. */
  hypothesis: string;
  /** Psychographic angle this variant pulls. Used as a chip in /creatives. */
  angle: string;
  /** Which content format this variant tests. Optimizer rolls up posteriors by format. */
  contentFormat: ContentFormat;
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
    // KEPT — founder confirmed this one still works
    slug: "group-chat-goldmine",
    label: "Group Chat is a Goldmine",
    hypothesis: "Moms with active group chats see their text threads as community, not audience.",
    angle: "community / group chat",
    contentFormat: "anecdote",
    funnel: "direct",
    belowFold: "full",
    primaryCreativeId: "c11",
    hero: {
      eyebrow: "no followers needed",
      headline: "Your group chat is a goldmine.",
      subhead: "You're not an influencer. You're a mom with friends who actually listen. Real brands will pay you 20–60% when those friends sign up through your link — every month, for as long as they stay.",
      ctaPrimary: "Apply to join — $5",
      ctaSecondary: "How it works →",
    },
    closer: {
      headline: "$5 to apply. Refunded if not approved.",
      subhead: "Your fast-track first $25 unlocks day one. No following required.",
    },
  },
  {
    // v5 rewrite — was generic "no-influencer-needed"
    slug: "no-influencer-needed",
    label: "The Direct News",
    hypothesis: "Direct/newsy framing — clean question-led delivery of the canonical news.",
    angle: "direct news",
    contentFormat: "direct",
    funnel: "direct",
    belowFold: "full",
    primaryCreativeId: "c12",
    hero: {
      eyebrow: "did you know?",
      // v6: was 3 lines ("Moms are getting paid / celebrity-tier money /
      // to recommend things online now.") — too long, pushed ribbon below fold.
      headline: "Moms are getting paid like influencers now.",
      subhead: "Not polished influencers with millions of followers — actual regular moms with regular group chats. Big brands are paying real money for real recommendations. $5/mo to access.",
      ctaPrimary: "Apply to join — $5",
      ctaSecondary: "Show me how →",
    },
    closer: {
      headline: "Real moms. Real money. Real easy.",
      subhead: "$5 to apply. Refunded if not approved. Then $5/mo if approved.",
    },
  },
  {
    // v5 REPLACEMENT — old "school-hours-income" killed (time-fit-gig framing)
    slug: "heads-up-moms",
    label: "Heads Up Moms (Anchored Moment)",
    hypothesis: "Anchored past moment opener — speaks directly to a recent action she actually took.",
    angle: "anchored moment / past action",
    contentFormat: "objection-reframe",
    funnel: "direct",
    belowFold: "full",
    primaryCreativeId: "c13",
    hero: {
      eyebrow: "yes, you",
      // v6: was "That recommendation in your group chat last week?" — keep
      // the question hook (psychological pull) but tighten.
      headline: "That rec you sent last week? Worth real money.",
      subhead: "You could've gotten paid for it. You don't need to have millions of followers or be a celebrity to get paid like one. Brands are starting to pay regular moms big bucks to share their products and services online.",
      ctaPrimary: "Apply to join — $5",
      ctaSecondary: "See how it works →",
    },
    closer: {
      headline: "You've been doing this for free.",
      subhead: "Now there's a way to get paid for it. $5/mo to access. Cancel anytime.",
    },
  },
  {
    // v5 REPLACEMENT — old "stealth-income" killed (defensive/hiding framing)
    slug: "you-already-do-this",
    label: "You Already Do This",
    hypothesis: "Permission/acknowledgment frame — she's already recommending; now there's pay.",
    angle: "permission / acknowledgment",
    contentFormat: "direct",
    funnel: "direct",
    belowFold: "full",
    primaryCreativeId: "c14",
    hero: {
      eyebrow: "now with a paycheck",
      // v6: was 2 lines ("You already recommend things to your friends
      // every week.") — same beat as the sales-video hook ("you already
      // do this. now you get paid.") which Kevin called the strongest
      // copy in the whole set. Lean into it.
      headline: "You already do this for free.",
      subhead: "Now you can get paid for it. No celebrity status or million followers needed. Regular moms making real money for the same stuff they're already sharing.",
      ctaPrimary: "Apply to join — $5",
      ctaSecondary: "How much can I make? →",
    },
    closer: {
      headline: "Real moms. Real money. Real easy.",
      subhead: "$5 to apply. Refunded if not approved. Same recs, paid this time.",
    },
  },
  {
    // v5 rewrite — kept the AI angle, rewrote with locked voice
    slug: "chatgpt-writes-it",
    label: "ChatGPT Writes It",
    hypothesis: "AI-curious moms who use ChatGPT instead of Google but don't monetize it yet.",
    angle: "AI / empowerment",
    contentFormat: "direct",
    funnel: "direct",
    belowFold: "full",
    primaryCreativeId: "c15",
    hero: {
      eyebrow: "let AI do the writing",
      // v6: was 2 lines. "ChatGPT writes. You collect." mirrors the
      // closer-headline pattern ("AI writes. You get paid.") which works.
      headline: "ChatGPT writes. You collect.",
      subhead: "Pick a brand. We hand you the exact ChatGPT prompt. Six seconds later you've got a Pinterest pin, a Reddit post, or a group-chat-ready recommendation. No million followers needed, no celebrity status.",
      ctaPrimary: "Apply to join — $5",
      ctaSecondary: "See the prompts →",
    },
    closer: {
      headline: "AI writes. You get paid.",
      subhead: "$5 to apply. Refunded if not approved. New to AI? We will walk you through it.",
    },
  },
  {
    // v5 REPLACEMENT — old "trusted-mom-economy" killed (lecturing, "take your cut")
    slug: "brand-wall",
    label: "Brand Wall (Names Are the Proof)",
    hypothesis: "Known brand logos do the lifting — proof without explanation.",
    angle: "brand-callout / social proof",
    contentFormat: "brand-callout",
    funnel: "direct",
    belowFold: "lean",
    primaryCreativeId: "c16",
    hero: {
      eyebrow: "sephora · hulu · target · hbo · walmart · disney+",
      // v6: collapse 2 lines into 1.
      headline: "These brands pay regular moms now.",
      subhead: "Sephora. Hulu. Target. HBO. Walmart. Disney+. They're all paying regular moms now to share their products and services. No million followers required, no celebrity status — just real recommendations from real moms.",
      ctaPrimary: "Apply to join — $5",
      ctaSecondary: "See all 50+ brands →",
    },
    closer: {
      headline: "Real brands. Real money.",
      subhead: "50+ brand deals. $5 to apply, refunded if not approved.",
    },
  },
  {
    // v5 REPLACEMENT — old "not-mlm" killed (defensive)
    slug: "move-over-influencers",
    label: "Move Over Influencers (Edge)",
    hypothesis: "Objection-reframe with edge — positions mom as the authentic alternative.",
    angle: "edge / objection-reframe",
    contentFormat: "objection-reframe",
    funnel: "direct",
    belowFold: "full",
    primaryCreativeId: "c17",
    hero: {
      eyebrow: "the new economy",
      // v6: collapse 2 lines into 1 — punchy enough as single line.
      headline: "Move over, skinny influencers.",
      subhead: "Brands have moved on — they're paying regular moms big bucks now for the same recommendations they used to only pay celebrities for. Real moms. Real money.",
      ctaPrimary: "Apply to join — $5",
      ctaSecondary: "How it works →",
    },
    closer: {
      headline: "Real moms. Real money. Real easy.",
      subhead: "$5 to apply. Refunded if not approved. Welcome to the new economy.",
    },
  },
  {
    // v5 rewrite — kept the $5→$25 angle, rewrote in locked voice
    slug: "twenty-five-day-one",
    label: "$25 Day One",
    hypothesis: "Specific-number direct-response moms; proof-via-number psychographic.",
    angle: "specific number / proof",
    contentFormat: "math",
    funnel: "direct",
    belowFold: "full",
    primaryCreativeId: "c18",
    hero: {
      eyebrow: "day-one fast-track payout",
      // v6 rewrite — old 3-line headline ("$5 in. / $25 out. / Day one.")
      // looked clever but ate 3× the vertical space of the other variants and
      // pushed everything below it down the page. New version is single-line,
      // direct, in second-person command voice, and matches the subhead's
      // actual claim (vs the old "Day one." overpromise).
      headline: "Hit $25 — cash out same day.",
      subhead: "Brands are paying real money for real recommendations from regular moms now. Pay $5 to access. Hit $25 in payouts → cash out same day. Most moms hit it inside a week. No million followers needed.",
      ctaPrimary: "Apply to join — $5",
      ctaSecondary: "How fast really? →",
    },
    closer: {
      headline: "$5 → $25 day one.",
      subhead: "PayPal, Venmo, or bank transfer. Cancel anytime.",
    },
  },
  {
    // v5 rewrite — kept the receipts angle, BIG number bump ($72.40 → $720.40)
    slug: "real-receipts",
    label: "Real Dashboard, Real Receipts",
    hypothesis: "Skeptics who need to see numbers before they buy in.",
    angle: "math / receipts",
    contentFormat: "math",
    funnel: "direct",
    belowFold: "full",
    primaryCreativeId: "c19",
    hero: {
      eyebrow: "real mom. real dashboard. real venmo.",
      // v6: collapse 2 lines into 1. Specific number + source = strong.
      headline: "$720 last week — from 4 group-chat texts.",
      subhead: "A real first-month member's dashboard. 68 clicks. 12 sign-ups. $720.40 in her bank account by Friday. Brands are paying real money for real recommendations — no million followers required, no celebrity status.",
      ctaPrimary: "Apply to join — $5",
      ctaSecondary: "Show me more receipts →",
    },
    closer: {
      headline: "Receipts don't lie.",
      subhead: "$5 to apply. Refunded if not approved. Real moms, real money.",
    },
  },
  {
    // KEPT — founder confirmed this one still works
    slug: "faceless-creator",
    label: "Faceless Creator",
    hypothesis: "Edge persona: 'I could probably start a faceless YouTube channel' moms.",
    angle: "faceless brand / creator-curious",
    contentFormat: "objection-reframe",
    funnel: "direct",
    belowFold: "full",
    primaryCreativeId: "c20",
    hero: {
      eyebrow: "you don't need a face, a following, or a niche",
      // v6: was 2 lines. Punchier 1-line — leans on the "no face" angle.
      headline: "No face. No followers. Real money.",
      subhead: "Open a faceless TikTok or Pinterest. Use AI to make posts about the brands you love. Drop your tracked link in the bio. We pay you every time someone signs up — month after month, for as long as they stay.",
      ctaPrimary: "Apply to join — $5",
      ctaSecondary: "See how others do it →",
    },
    closer: {
      // v6: was a near-dup of the hero ("No face. No followers. Real money.").
      // Closer now lands a different beat — the "build once, earn forever" promise.
      headline: "Build it once. Earn for months.",
      subhead: "$5 to apply. Refunded if not approved. AI does the heavy lifting.",
    },
  },
] as const satisfies readonly FunnelVariant[];

export const VARIANT_SLUGS = VARIANTS.map((v) => v.slug);

export function findVariant(slug: string): FunnelVariant | undefined {
  return VARIANTS.find((v) => v.slug === slug);
}
