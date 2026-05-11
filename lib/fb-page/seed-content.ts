/**
 * Day-1 organic content for the Momfluence Facebook Page.
 *
 * Consumed by:
 *   - `scripts/seed-fb-page.ts` (one-shot script that POSTs to Graph API)
 *   - `app/render/post/[slug]/page.tsx` (Chromium-renderable image template)
 *
 * Strategy: 15 posts. First 3 publish immediately; the rest are scheduled
 * across 12 days at alternating 10am / 8pm ET — the bedtime and after-drop-off
 * peak engagement windows for mom audiences. Mix is ~60% brand-building / 25%
 * relatable mom-life / 15% direct CTA — avoids the "salesy spammy page"
 * pattern that suppresses Meta's organic reach for new pages.
 *
 * Image template is intentionally simple: full-bleed colored background,
 * centered Playfair Display headline, optional DM Sans body, optional small
 * accent chip, subtle footer. Same visual language across all 15 posts so
 * the page grid looks intentional, not chaotic.
 */

export interface PostImageConfig {
  /** Full-bleed background style. */
  bg: "coral" | "navy" | "cream" | "warm-gradient" | "navy-coral-gradient" | "white-coral-ring";
  /** Big Playfair Display headline (newlines render as line breaks). */
  display: string;
  /** Optional kicker shown above the display, small-caps uppercase. */
  eyebrow?: string;
  /** Optional body text below the display, DM Sans. */
  body?: string;
  /** Optional accent chip in a corner — e.g. "$5", "$24", "0". */
  accentBadge?: string;
  /** Small footer at bottom (usually "momfluence.app"). */
  footer?: string;
  /** Override display-text color. Defaults: coral/navy/gradient → white; cream/white-coral-ring → navy. */
  displayColor?: "white" | "navy" | "coral";
}

export interface SeedPost {
  /** URL-safe slug. Used as the post's render route + as a logical id in script logs. */
  slug: string;
  /** The Facebook post caption (no character limit on FB Page posts but keep readable). */
  caption: string;
  /** Image config — drives /render/post/[slug] template. */
  image: PostImageConfig;
  /** When to publish. "immediate" or { dayOffset, hour } where hour is 0-23 ET. */
  schedule: "immediate" | { dayOffset: number; hourEastern: number };
}

export const PAGE_ABOUT = {
  shortDescription:
    "Real brand affiliate programs for moms. Pre-vetted partnerships paying recurring commissions — no follower count required.",
  longDescription: `MomFluence is the affiliate platform built for moms who don't want to become creators.

We negotiate the partnerships, you place the link. Real brands. Real commissions — most pay you a percentage of every order, every month, for as long as the customer stays.

No follower count required. No video required. No public-facing "personal brand." A text in the right group chat counts.

We're new. We're transparent. $5/month membership unlocks the platform; your first $25 in commissions unlocks a same-day fast-track payout.`,
  website: "https://momfluence.app",
  mission:
    "Build a way for moms to earn from what they already do — recommend things they actually like.",
  companyOverview:
    "MomFluence — affiliate platform for moms. Real brand partnerships paying recurring commissions, no follower count required, anonymous by default.",
} as const;

export const SEED_POSTS: SeedPost[] = [
  // ── Wave 1: publish immediately (3 posts) ──────────────────────────────
  {
    slug: "welcome",
    caption: `Hey moms 👋 We're MomFluence — a brand-new platform built for one specific kind of person: the mom who already recommends things to her friends, and isn't trying to become an influencer to do it.

No follower count required. No videos. Just real brand partnerships that pay you for the recommendations you'd make anyway.

More coming this week. Follow along — and if you want to peek behind the curtain → momfluence.app`,
    image: {
      bg: "warm-gradient",
      eyebrow: "DAY 1 / NEW HERE",
      display: "We just launched.\nWelcome.",
      footer: "momfluence.app",
      displayColor: "navy",
    },
    schedule: "immediate",
  },
  {
    slug: "origin",
    caption: `Real talk: every mom we know has talked another mom into buying something — a stroller, a face wash, a meal kit, a streaming service.

Brands pay influencers 20-60% to do exactly this. We thought: why are moms the only ones doing it free?

So we built MomFluence.`,
    image: {
      bg: "coral",
      display: "Built for moms who\nrecommend things for free\ntheir whole lives.",
      footer: "momfluence.app",
      displayColor: "white",
    },
    schedule: "immediate",
  },
  {
    slug: "five-dollar-question",
    caption: `The membership is $5/mo. We'd be lying if we said it wasn't a real number — it's not free.

Two things to know: your fast-track $25 unlocks day-one for new members (so you can earn that back in a single recommendation), and you can pause anytime.`,
    image: {
      bg: "navy",
      accentBadge: "$5",
      display: "/month.",
      body: "Less than what Amazon paid you to recommend their site to your sister.",
      footer: "momfluence.app",
      displayColor: "white",
    },
    schedule: "immediate",
  },

  // ── Wave 2: scheduled across next 12 days, alternating 10am / 8pm ET ──
  {
    slug: "explainer",
    caption: `The whole product in 3 steps. No video editing. No public account. No pitch deck.`,
    image: {
      bg: "cream",
      eyebrow: "HOW IT WORKS",
      display: "1. Pick a brand.\n2. Place the link.\n3. Get paid when they buy.",
      footer: "momfluence.app",
      displayColor: "navy",
    },
    schedule: { dayOffset: 2, hourEastern: 10 },
  },
  {
    slug: "not-mlm",
    caption: `We get this question every day so let's settle it:

MomFluence is NOT an MLM. You don't recruit anyone. You don't buy inventory. You don't pay us anything beyond $5/mo for access. You earn directly from brands — they pay us, we pay you, on top of your base rate.

If anyone in your life has been burned by Amway, Younique, or anything similar, this is the opposite.`,
    image: {
      bg: "white-coral-ring",
      eyebrow: "CLEAR THE AIR",
      display: "This is not an MLM.",
      body: "No recruiting. No downlines. No inventory. No mandatory minimums. Brands pay us; we pay you.",
      footer: "momfluence.app",
      displayColor: "navy",
    },
    schedule: { dayOffset: 3, hourEastern: 20 },
  },
  {
    slug: "mom-life",
    caption: `The window: 8:30pm to 10:15pm. After bedtime, before exhaustion.

If you're going to make money in those 105 minutes, it has to be something you can do with one hand while the other holds a wine glass.

We built MomFluence around that constraint specifically.`,
    image: {
      bg: "navy-coral-gradient",
      eyebrow: "THE WINDOW",
      display: "8:30 pm — 10:15 pm.",
      body: "After bedtime. Before exhaustion. One hand free.",
      footer: "momfluence.app",
      displayColor: "white",
    },
    schedule: { dayOffset: 4, hourEastern: 10 },
  },
  {
    slug: "brand-wall",
    caption: `A few of the brands paying our moms. We add new ones every week. All real partnerships, all paying real percentages — not the 1-3% you see on Amazon Associates.`,
    image: {
      bg: "cream",
      eyebrow: "A FEW OF THE BRANDS",
      display: "Real brands.\nReal partnerships.",
      body: "Sephora · Target · HBO Max · Hulu · Walmart · and growing.",
      footer: "momfluence.app",
      displayColor: "navy",
    },
    schedule: { dayOffset: 5, hourEastern: 20 },
  },
  {
    slug: "the-math",
    caption: `The math that flipped us on this:

Most affiliate programs are one-time payouts. A few are RECURRING — meaning when you recommend a subscription service and someone signs up, you get a cut of that subscription forever, as long as they stay.

One good recommendation = ~$200-400/year passive. Hit 5 of those and you've built a fourth-quarter Christmas budget by accident.`,
    image: {
      bg: "coral",
      eyebrow: "THE MATH",
      display: "1 recommendation\n× 25% recurring\n× 12 months\n= 1 Christmas budget.",
      footer: "momfluence.app",
      displayColor: "white",
    },
    schedule: { dayOffset: 6, hourEastern: 10 },
  },
  {
    slug: "no-followers",
    caption: `Influencer marketing has a gatekeeping problem.

Brands assume you need 10K followers to "sell" anything. Group-chat moms know that's nonsense — your 8 closest friends will trust your face cream recommendation more than they'll trust some stranger with a ring light.

We're the platform built around the way moms actually recommend things.`,
    image: {
      bg: "white-coral-ring",
      eyebrow: "REQUIRED FOLLOWERS",
      display: "0.",
      body: "Your group chat trusts you. That's the entire qualification.",
      footer: "momfluence.app",
      displayColor: "coral",
    },
    schedule: { dayOffset: 7, hourEastern: 20 },
  },
  {
    slug: "chatgpt-angle",
    caption: `Hot take that we own as a company: AI is the great equalizer for moms.

You don't have to be a copywriter to write a recommendation post. ChatGPT, Claude, Gemini — paste in the link, tell it the angle, get back a draft in 30 seconds. Tweak it to sound like you, send it.`,
    image: {
      bg: "navy",
      eyebrow: "THE EQUALIZER",
      display: "ChatGPT writes\nthe post for you.",
      body: "You don't need to be a copywriter. You need to be the friend whose recommendation people trust.",
      footer: "momfluence.app",
      displayColor: "white",
    },
    schedule: { dayOffset: 8, hourEastern: 10 },
  },
  {
    slug: "stealth-income",
    caption: `Real one: a lot of the moms we talk to don't want to make a big announcement about earning money on the side.

Maybe it's a partnership-finance thing. Maybe it's not wanting to be "the friend who's selling something now." Either way: MomFluence is anonymous by default — no public profile, no leaderboard. Earn quietly.`,
    image: {
      bg: "navy",
      display: "Your spouse doesn't\nhave to know.",
      body: "(They'll notice when the deposit hits.)",
      footer: "momfluence.app",
      displayColor: "white",
    },
    schedule: { dayOffset: 9, hourEastern: 20 },
  },
  {
    slug: "school-hours",
    caption: `School-hour moms — we see you.

The post-drop-off-pre-pickup window is one of the most under-monetized blocks of time in America. We built MomFluence to fit IN that window, not require you to skip lunch.`,
    image: {
      bg: "warm-gradient",
      eyebrow: "8:15 AM — 2:45 PM",
      display: "School hours.\nUnder-monetized.",
      body: "6.5 hours · 5 days/week · half the year. We built this to fit IN.",
      footer: "momfluence.app",
      displayColor: "navy",
    },
    schedule: { dayOffset: 10, hourEastern: 10 },
  },
  {
    slug: "fast-track",
    caption: `One thing that's different about us: we fast-track your first $25 in commissions for same-day payout.

Most affiliate networks make you wait 30-90 days to verify, then 14 more days to clear, then a minimum payout threshold. We get it — when you're testing if something works, you want proof FAST. So you get yours on day one.`,
    image: {
      bg: "coral",
      accentBadge: "$25",
      display: "Day-one\nfast-track payout.",
      body: "Most networks make you wait 30-90 days for the first deposit. We pay your first $25 same-day.",
      footer: "momfluence.app",
      displayColor: "white",
    },
    schedule: { dayOffset: 11, hourEastern: 20 },
  },
  {
    slug: "vs-amazon",
    caption: `"Isn't this just Amazon affiliates?"

Amazon pays 1-3% per click, one time. Recommends a $50 product → you get $1.50. Once.

MomFluence brands pay 20-60% per sale, and many of them are recurring (subscriptions, memberships). Recommend a $30/mo HBO Max trial → ~$8 per month, every month they stay subscribed.`,
    image: {
      bg: "cream",
      eyebrow: "VS AMAZON ASSOCIATES",
      display: "1–3% once.\n20–60% recurring.",
      body: "Same recommendation. Different math. Ours pays for years.",
      footer: "momfluence.app",
      displayColor: "navy",
    },
    schedule: { dayOffset: 12, hourEastern: 10 },
  },
  {
    slug: "soft-cta",
    caption: `If anything we've posted has resonated with you, here's the link to look at what's inside. No commitment to look. Five minutes will tell you if it's for you.

momfluence.app`,
    image: {
      bg: "white-coral-ring",
      eyebrow: "CURIOUS?",
      display: "Take 60 seconds.\nLook around.",
      body: "No commitment to look. Five minutes will tell you if it's for you.",
      footer: "momfluence.app",
      displayColor: "coral",
    },
    schedule: { dayOffset: 14, hourEastern: 20 },
  },
];
