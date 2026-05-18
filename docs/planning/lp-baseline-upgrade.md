# LP Baseline Upgrade — Funnel Lab Template v2

**Status:** Planning. Not started.
**Drafted:** 2026-05-18 (the morning after PR #36 + #39 shipped bulletproof CAPI tracking).
**Owner:** Kevin (engineering), Claude Design Agent (design).

---

## Executive summary

We're upgrading every `/lp/<variant>` to inherit a comprehensive, dub.co-inspired below-the-fold template — explaining affiliate marketing 101, showcasing the dashboard with real screenshots, positioning the $5/mo membership with Skool-style framing, and instrumenting every section with Meta event signals.

**Crucial constraint:** every current AND future Funnel Lab variant must inherit this baseline automatically. The variant's job stays the same — test the hero hook. The baseline below the fold is the *floor* every variant gets for free.

**Two pricing test variants in v1:**
- **Variant B — Risk-reversed:** "$5/mo, credited back after your first $25 earned."
- **Variant C — Skool-inspired exclusive:** "$5/mo unlocks exclusive top-paying brands — the kind that don't accept random applicants."

No control variant of the current "$5/mo, cancel anytime" — we're betting that either B or C beats it, and the data we collect tells us by how much.

**Reference:** [dub.co/partners](https://dub.co/partners) — emulate its structure, animations, section logic, polish, and pacing, but tailored entirely to a mom-targeted affiliate broker brand (warm voice, mobile-first, real-mom positioning vs. SaaS).

---

## Current state

### What lives in `app/lp/[variant]/page.tsx` today (183 lines)

```
Hero (variant-specific)
  ↓
<BrandRibbon />
  ↓
"Real numbers" section + <DashboardPreview />
  ↓
"How it works" — 3 hardcoded steps
  ↓
Conditional below-fold:
  if v.belowFold === "full" → "No following? No problem" + sharing-channels list
  if v.belowFold === "lean" → skipped
  ↓
Membership requirement callout ("Heads up: $5/mo required")
  ↓
Closing CTA (variant-specific)
```

### What's already on `app/page.tsx` (homepage, 376 lines) that needs porting

- `<TextDemo />` — animated iMessage demo showing a friend recommendation flow
- More expansive "How it actually plays out" with 3 numbered steps + visuals
- "Then your dashboard does the bragging" section with `<DashboardPreview />`
- 3-card row (Browse curated brands / Generate your link / Get paid fast)
- Extensive FAQ accordion ("Wait — isn't this just a refer-a-friend link?", etc.)

### Voice lock (do not violate)

Per `docs/product-thesis.md` and the v6 voice tune (commit `866658ef`):
- "regular moms," "big bucks," "find out more," "get yours" / "get your cut"
- NO "gate-kept," NO "rev share," NO "everyday moms," NO "passive income"

---

## Target state — the new LP architecture

### Visual flow (after upgrade)

```
┌────────────────────────────────────────────────────────────────────────┐
│  ABOVE FOLD (variant-specific — UNCHANGED)                             │
│    Hero: eyebrow / headline / subhead / primary + secondary CTA        │
│    <BrandRibbon />                                                     │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│  BELOW FOLD (UNIFORM — every variant gets this)                        │
│    <LPBaseline />  — new shared component                              │
│      §1   How it works (3-step, dub-style animated diagram)            │
│      §2   Affiliate Marketing 101 (educational module)                 │
│      §3   The myriad ways to share your link (channels + examples)     │
│      §4   Inside the dashboard (real screenshots, animated tour)       │
│      §5   The brand wall (logos + payout examples per brand)           │
│      §6   Social proof (founder voice now; real moms when available)   │
│      §7   Pricing — A/B variant (B: risk-reversed OR C: exclusive)     │
│      §8   FAQ (expanded, mom-specific objections)                      │
│      §9   Closing CTA (variant-specific via prop)                      │
└────────────────────────────────────────────────────────────────────────┘
```

### Component hierarchy

```
app/lp/[variant]/page.tsx
  ├─ <LPVisitTracker />                          (existing — keep)
  ├─ <LPHero />                                  (NEW — extracted from inline)
  │    props: { eyebrow, headline, subhead, ctaPrimary, ctaSecondary, signupHref }
  ├─ <BrandRibbon />                             (existing — keep)
  └─ <LPBaseline />                              (NEW — the floor)
       props: { variantSlug, signupHref, closer }
       ├─ <SectionHowItWorks />
       ├─ <SectionAffiliateMarketing101 />
       ├─ <SectionMyriadWaysToShare />
       ├─ <SectionDashboardTour />
       ├─ <SectionBrandWall />
       ├─ <SectionSocialProof />
       ├─ <SectionPricingABTest />               (reads cookie or assigns)
       ├─ <SectionFAQ />
       └─ <SectionClosingCTA closer={closer} signupHref={signupHref} />
```

### File structure (new)

```
components/landing/
  LPBaseline.tsx                  ← orchestrator
  sections/
    SectionHowItWorks.tsx
    SectionAffiliateMarketing101.tsx
    SectionMyriadWaysToShare.tsx
    SectionDashboardTour.tsx
    SectionBrandWall.tsx
    SectionSocialProof.tsx
    SectionPricingABTest.tsx
    SectionFAQ.tsx
    SectionClosingCTA.tsx

lib/funnel-lab/
  pricing-variants.ts             ← B vs C config
  lp-events.ts                    ← named events fired by sections

components/landing/
  LPSectionTracker.tsx            ← IntersectionObserver wrapper that fires
                                    Section_View_{name} when 50% visible
```

---

## Section-by-section spec

The design agent owns the visual + copy direction of each section. Engineering owns the React glue + event tracking. This spec defines the **purpose + must-have content + event triggers** for each — design fills in copy/visuals.

### §1 — How it works (3-step + animated text demo)

**Purpose:** Lower the cognitive load. 3 steps, one screen-glance.
**Must-have content:**
- Step 1: "Pick a brand" — visual of brand picker
- Step 2: "Share your link" — visual of friend text (reuse `<TextDemo />` animation)
- Step 3: "Get paid" — visual of dashboard balance increasing
**Visual reference:** dub.co/partners hero diagram — the animated "links going from creator → click → conversion → payout" sequence.
**Events:** `LP_Section_View_HowItWorks` fires when 50% of section in viewport.

### §2 — Affiliate Marketing 101 (the education module)

**Purpose:** Convert the *truly uninitiated* mom. Explain affiliate marketing in plain English, with mom-specific examples.
**Must-have content:**
- One-paragraph: "What is affiliate marketing?" — define it as "completing a financial circuit that was already there" (per the framing in `docs/planning/momfluence-mcp.md` direction)
- Side-by-side visual: "Without MomFluence" (mom recommends, brand keeps 100%) vs "With MomFluence" (mom recommends, brand shares with mom)
- Real example with real numbers: "Mom shares Hulu link → friend signs up for $7.99/mo → Mom earns $2.40/mo for as long as the friend stays subscribed"
- "It's not new. It's how thousands of full-time bloggers, podcasters, and YouTubers have earned for 20 years. We just made it work for moms with phones and group chats."
**Visual reference:** dub.co's animated "how the link works" diagram.
**Events:** `LP_Section_View_Education` + `LP_Click_Education_Expand` if there's a "Learn more" toggle.

### §3 — The myriad ways to share your link

**Purpose:** Defeat the "I'm not an influencer" objection. Show the *non-Instagram* surfaces.
**Must-have content:**
Inventory of 8 channels, each with:
- Channel name + icon
- Why it works for moms specifically
- A real example (mocked screenshot of the channel with a tracked link in it)

The 8 channels (mandatory):
1. **Group chats / iMessage** — "the highest-converting place on Earth"
2. **School Facebook groups** — "moms helping moms is the original engagement signal"
3. **Reddit threads** — "answer a question, drop a helpful link, get paid for 2 years"
4. **Pinterest pins** — "evergreen — one pin can pay for 18 months"
5. **TikTok comments (faceless)** — "no camera, no following, just be helpful"
6. **Nextdoor recs** — "neighborhood-level trust"
7. **Email signature** — "every email you send already does this for free"
8. **YouTube comments + faceless Shorts** — "evergreen + zero face"
**Visual:** A "channel wall" grid — 8 cards, each with the channel icon + mom-style mocked example.
**Events:** `LP_Section_View_ShareChannels` + `LP_Click_ShareChannel_{Slug}` on each card hover/expand.

### §4 — Inside the dashboard (real screenshots, animated tour)

**Purpose:** Demystify "what am I paying $5/mo for?" Show the actual product.
**Must-have content:**
- 4-5 real screenshots from the production momfluencer dashboard (NOT mockups). Capture:
  - The brand picker (50+ partnerships with logos)
  - The link generator (one-click tracked URL)
  - The earnings dashboard (clicks, conversions, $$ this week)
  - The cashout screen (Venmo / PayPal / bank options)
  - The "first $25 fast-track" callout
- Each screenshot annotated with arrows + small explainer text
- Animated transition between screenshots (or scroll-locked tour, like Linear's product page)
**Visual reference:** dub.co/partners "see your data" section + Linear's product tour.
**Events:** `LP_Section_View_DashboardTour` + `LP_DashboardScreenshot_Viewed_{N}` for each screenshot shown.

### §5 — The brand wall

**Purpose:** Lower brand skepticism with logo recognition.
**Must-have content:**
- 30-50 real brand logos (use brands from the existing partnerships table — Target, Hulu, Sephora, HBO Max, Walmart, Old Navy, Nordstrom, Disney+, etc.)
- 5-8 standout brands get a *payout example* card: "Hulu — earn $X per signup, $Y/mo recurring"
- Grouped by category: Streaming / Beauty / Family / Home / etc.
- "Plus N more partners — full list inside" link
**Visual reference:** dub.co/customers logo wall + Stripe's customer logos grid.
**Events:** `LP_Section_View_BrandWall` + `LP_Brand_PayoutExample_Clicked_{Brand}` if cards are expandable.

### §6 — Social proof

**Purpose:** Trust signal. Phase 1 is founder-led; phase 2 swaps in real moms.

**Phase 1 (this week — ships first):**
- Founder photo (you, Kevin) + 1-sentence story: "I built MomFluence after watching my wife recommend brands for free for 15 years."
- 1-2 quotes from Kelly as the first member (she's a real mom, she's actually using it — that's not fake)
- "We're building this in public. Here are our numbers right now: N members, $X paid out so far." (transparency play)

**Phase 2 (in 2-3 weeks, after 5-10 paid-founding moms onboarded):**
- 5+ real mom testimonials: photo, first name, city, $ earned in first 30 days, one-line quote
- Video clips of 2-3 moms talking through their experience (30 sec each)
- Real screenshots of THEIR dashboards (with permission)

**Visual:** Section reserved with empty slots that phase 2 fills in. Built so phase 2 doesn't require a code change — testimonials read from a Supabase `testimonials` table or a config file.
**Events:** `LP_Section_View_SocialProof` + `LP_VideoTestimonial_Played_{Name}` when ready.

### §7 — Pricing A/B test (the centerpiece)

**Purpose:** Test whether risk-reversal (B) or exclusivity-framing (C) converts better.

**The split:**
- Random cookie-based assignment on first LP visit (`mf_pricing_variant` = `B` or `C`)
- 50/50 split, persistent for the user across sessions
- Tagged in Stripe Checkout metadata as `pricing_variant: B|C`
- Funnel Lab admin gets a new axis: variant × creative × **pricing**

**Variant B — Risk-reversed:**
> **Eyebrow:** "$5/month — and we credit it back."
>
> **Headline:** "Your first $25 earned — we send you a $5 credit. The membership pays for itself in week one for most moms."
>
> **Body:** "Pay $5 today. Earn your first $25 in commissions. We credit $5 right back to your dashboard balance. Net cost: $0 if you actually use it. Cancel anytime."
>
> **CTA:** "Get started — $5 back guarantee"

**Variant C — Skool-inspired exclusive:**
> **Eyebrow:** "$5/month for the door, not the deal"
>
> **Headline:** "The brands inside don't accept random applicants. The $5 is what opens the door."
>
> **Body:** "Most affiliate programs make you apply, wait, and prove you have a following. We've already done that work for you with 50+ premium brands — Target, Hulu, Sephora, Walmart, HBO Max. The $5/mo is your access key to the room. Cancel anytime — you'll just lose access to the brands, not your past earnings."
>
> **CTA:** "Get the keys — $5/mo"

**Both variants share:**
- The same proof points (50+ brands, real dashboard, real payouts)
- The same risk-reversal options (cancel anytime, no contract)
- The same final CTA shape

**Events:** `LP_PricingVariant_Assigned` (B|C) on first visit + `LP_PricingCTA_Clicked` (B|C) on button click.

### §8 — FAQ (expanded)

**Purpose:** Handle the 10 most common mom objections inline so they don't need to bounce to /how-it-works.
**Must-have FAQs (drawn from current homepage + dub-style):**
1. "Wait — isn't this just a refer-a-friend link?" (current homepage version, keep)
2. "Do I need followers / a blog / a TikTok?"
3. "How much can I actually expect to earn in month 1?"
4. "Is this MLM or pyramid scheme?"
5. "What if I don't have a 'group chat audience'?"
6. "Why does it cost $5/mo? Why isn't it free?"
7. "How fast do I get paid?"
8. "What if I cancel — do I lose my earnings?"
9. "Do the brands know I'm sharing their links? Is this allowed?"
10. "Can I do this anonymously / faceless?"
**Visual:** Same accordion style as current homepage. Open one at a time, smooth chevron animation.
**Events:** `LP_FAQ_Opened_{N}` per question.

### §9 — Closing CTA (variant-specific)

**Purpose:** Final action prompt with variant-specific voice. Stays as it is today (each variant's closer object provides headline/subhead).
**Events:** `LP_ClosingCTA_Clicked`.

---

## Pricing A/B test design (engineering spec)

### Variant assignment

```ts
// lib/funnel-lab/pricing-variants.ts

export type PricingVariant = "B" | "C";

const COOKIE_NAME = "mf_pricing_variant";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

export function assignPricingVariant(req: NextRequest): PricingVariant {
  // 1. If cookie exists, use it (sticky across visits)
  const existing = req.cookies.get(COOKIE_NAME)?.value;
  if (existing === "B" || existing === "C") return existing;

  // 2. Otherwise, 50/50 random assignment
  const variant: PricingVariant = Math.random() < 0.5 ? "B" : "C";
  return variant;
}
```

`<SectionPricingABTest />` is a Server Component that reads/sets this cookie, then renders the appropriate child (`<PricingVariantB />` or `<PricingVariantC />`).

### Carrying the variant into Stripe

The signup flow already reads `lp` and `c` URL params. Add `pricing_variant`:

```
/lp/heads-up-moms?c=b7-friend-texts
  → user assigned B (cookie)
  → clicks signup CTA
  → /signup?lp=heads-up-moms&c=b7-friend-texts&pricing_variant=B
  → /api/checkout/create receives pricing_variant in body
  → Stripe Checkout Session metadata: { lp_variant, creative_id, pricing_variant }
  → Subscription inherits metadata
  → Funnel Lab admin reads it for the rollup
```

### Funnel Lab admin update

`app/(app)/admin/funnel-lab/page.tsx` gets one new column / one new breakdown axis: **Pricing**. The rollup now shows variant × creative × pricing — letting us see, e.g., "heads-up-moms × b7-friend-texts × Variant C has 3 conversions, 12% CR" vs "× Variant B has 1 conversion, 4% CR."

---

## Meta event tracking spec

### Section-view events (informational, fire from `<LPSectionTracker />`)

```
LP_Section_View_HowItWorks
LP_Section_View_Education
LP_Section_View_ShareChannels
LP_Section_View_DashboardTour
LP_Section_View_BrandWall
LP_Section_View_SocialProof
LP_Section_View_Pricing  (+ value: A | B | C)
LP_Section_View_FAQ
LP_Section_View_ClosingCTA
```

These are CUSTOM events (fbq trackSingleCustom on v2). Custom events don't count as standard conversions but they give Meta micro-signals about funnel depth.

### Existing standard events (already firing)

```
PageView                — fires on every LP load (browser + CAPIG)
SignupStarted           — fires on /signup form load
CompleteRegistration    — fires after Stripe Checkout redirect
Purchase                — fires on /welcome (browser + CAPIG + direct CAPI from PR #36)
```

### NEW recommended standard events (for Meta optimization)

```
ViewContent             — fire on every LP load (helps Meta learn LP-engaged users)
                          custom_data: { content_name: "lp_<slug>", content_category: "lp" }

AddToCart               — fire when signup form is opened (one step before InitiateCheckout)
                          NEW signal that tells Meta: "this user is interested but hasn't committed yet"

InitiateCheckout        — fire when user hits the Stripe Checkout redirect
                          custom_data: { value: 5.00, currency: "USD" }

AddPaymentInfo          — Stripe Checkout fires its own pixel event for this; nothing for us to add
```

### Why this matters for Meta's optimization

Meta's algorithm uses these events as **rungs on the learning ladder**:
- More users in `ViewContent` → Meta learns LP engagement patterns
- More users in `AddToCart` → Meta learns intent signals
- More users in `InitiateCheckout` → Meta learns commit signals
- More users in `Purchase` → Meta learns conversion patterns

With our current 5 visits / 1 conversion, Meta has almost zero signal. Firing the intermediate rungs (ViewContent, AddToCart, InitiateCheckout) gives Meta WAY more data points per visit — even when the user doesn't convert — so the algorithm can find similar users faster.

### AEM (Aggregated Event Measurement) priority

iOS 14+ Meta only sends back data for the *first* event in your priority list. Currently we're not optimizing this. Recommended ordering for the v2 pixel:

```
1. Purchase                  ← highest value, what we're optimizing for
2. InitiateCheckout          ← strong intent signal
3. AddToCart                 ← warm lead
4. SignupStarted             ← top of funnel
5. CompleteRegistration      ← redundant with Purchase but keep
6. ViewContent               ← page-level engagement
7. PageView                  ← lowest value
8. (custom events not in AEM)
```

Update this in Events Manager → Settings → Aggregated Event Measurement. Browser-only concern; CAPI events bypass AEM entirely.

---

## Design Agent Brief

**This is the section you paste into a Claude Design Agent session.**

---

### 🎯 Project: MomFluence LP Baseline v2

**Goal:** Design a comprehensive, dub.co-inspired below-the-fold template that every MomFluence landing page (`/lp/<variant>`) will inherit. Tested with 50/50 A/B pricing split. Mobile-first.

**Reference site to emulate:** https://dub.co/partners
- Match the animation logic, section pacing, polish, and information density
- DO NOT match the SaaS-corporate voice — we're warmer, mom-targeted, plainspoken
- DO match the structural rhythm: hook → educate → showcase → prove → price → answer → close

**Brand environment:** Already loaded in your environment. Use existing colors (navy + coral), Playfair Display + DM Sans, and the v6 voice lock.

**Voice lock (do not violate):**
- "regular moms," "big bucks," "find out more," "get yours" / "get your cut"
- NO "gate-kept," NO "rev share," NO "everyday moms," NO "passive income"

### Required sections (in order)

| # | Section | Purpose | Key visual |
|---|---|---|---|
| 1 | How it works | 3-step glance | Animated text-message-to-payout sequence (reuse `<TextDemo />` style) |
| 2 | Affiliate Marketing 101 | Define the concept for the uninitiated | Side-by-side: "without" vs "with" MomFluence diagram |
| 3 | The myriad ways to share | Defeat "I'm not an influencer" | 8-channel grid (group chat, school FB, Reddit, Pinterest, TikTok faceless, Nextdoor, email sig, YouTube comments) |
| 4 | Inside the dashboard | Demystify the $5/mo product | 4-5 real production screenshots, scroll-locked tour |
| 5 | The brand wall | Logo recognition trust | 30-50 real brand logos + 5-8 payout example cards |
| 6 | Social proof | Trust seal | **Phase 1:** founder photo + Kelly quote. **Phase 2 (later):** real moms with photos + $ earned |
| 7 | Pricing (A/B variant B OR C) | The conversion ask | One of two variants — see "Pricing variants" below |
| 8 | FAQ | Handle objections inline | Accordion, 10 questions (list provided) |
| 9 | Closing CTA | Final action prompt | Variant-specific voice (carries through from hero) |

### Two pricing variants to design

You design BOTH; engineering randomizes 50/50 to live traffic.

**Variant B — Risk-reversed**
- Headline: "Your first $25 earned — we send you a $5 credit. The membership pays for itself in week one for most moms."
- Body: "Pay $5 today. Earn your first $25 in commissions. We credit $5 right back to your dashboard balance. Net cost: $0 if you actually use it."
- CTA: "Get started — $5 back guarantee"
- Visual cue: a small "$5 back" badge or animated coin returning to a wallet icon
- Color emphasis: coral

**Variant C — Skool-inspired exclusive**
- Headline: "The brands inside don't accept random applicants. The $5 is what opens the door."
- Body: "Most affiliate programs make you apply, wait, and prove you have a following. We've already done that work for you with 50+ premium brands. The $5/mo is your access key to the room."
- CTA: "Get the keys — $5/mo"
- Visual cue: a key icon, a "members-only" feel — subtle gatekeeping symbolism
- Color emphasis: navy

### Asset deliverables (what you produce)

1. **High-fidelity Figma frames** for each section, mobile-first (375px) + desktop (1024px) for every section
2. **Real dashboard screenshots** — captured from the live `app.momfluence.app` (or production `momfluence.app/dashboard`) momfluencer view. Annotated with arrows + small explainer text.
3. **8 channel-illustration mocks** for Section 3 — each mocked example showing what a mom's actual link share looks like in that channel (e.g., a fake-but-realistic group chat conversation, a Reddit comment with a tracked link, a Pinterest pin)
4. **30-50 brand logos** sourced and laid out for the brand wall
5. **Animated SVG / Lottie spec** for the "without vs with MomFluence" diagram in Section 2
6. **Design tokens / Tailwind class spec sheet** so engineering can implement faithfully without guessing spacing

### What you DO NOT do

- ❌ Write React/TSX code — engineering handles the implementation
- ❌ Touch the existing `<LPHero />` (above-the-fold stays per-variant)
- ❌ Add new colors / fonts outside the brand environment
- ❌ Use stock photography of moms — Phase 1 uses founder + Kelly only; Phase 2 swaps in real testimonials
- ❌ Use "passive income," "everyday moms," "gate-kept," or "rev share"

### Voice & copy guidance per section

Refer to `docs/product-thesis.md` and `lib/social/post-generator.ts` SYSTEM_PROMPT for voice locks. Every section's copy should feel like it could come from the same voice as the FB/IG posts being published daily by the content cron.

### Timeline

- **Days 1-3:** Section 1-4 designs (the educational core)
- **Days 4-5:** Section 5-9 designs + pricing variants B/C
- **Day 6:** Asset assembly + dashboard screenshot capture
- **Day 7:** Engineering handoff (ZIP of assets + Figma link + token spec)

Engineering then has ~5 days to implement, instrument with events, and ship behind a feature flag.

---

## Engineering plan

### PR sequence

**PR 1 — Skeleton (no design needed)**
Branch: `claude/lp-baseline-skeleton`
- Create `components/landing/LPBaseline.tsx` with empty section stubs
- Create all 9 section component files with TODO placeholders
- Create `components/landing/LPSectionTracker.tsx` (IntersectionObserver event wrapper)
- Create `lib/funnel-lab/pricing-variants.ts` (B/C assignment logic)
- Create `lib/funnel-lab/lp-events.ts` (event name constants + fbq wrapper)
- Update `app/lp/[variant]/page.tsx` to render `<LPBaseline />` BELOW the existing structure (so existing content keeps working)
- Add feature flag `NEXT_PUBLIC_LP_BASELINE_V2 = "off" | "shadow" | "live"`
- Tests: typecheck passes, all 10 variants still render

**PR 2 — Section content (after design handoff)**
Branch: `claude/lp-baseline-content`
- Implement each section component with the design agent's specs + copy
- Wire up events to `<LPSectionTracker />`
- Pull real dashboard screenshots into `/public/lp-baseline/`
- Implement variant B and C pricing components
- Add `pricing_variant` to `/api/checkout/create` body + Stripe metadata
- Update Funnel Lab admin (`/admin/funnel-lab/page.tsx`) to show pricing axis
- Tests: visit each LP variant manually with cookie set to B and C, screenshot diff each section

**PR 3 — Standard event uplift (parallel to PR 2)**
Branch: `claude/lp-meta-event-uplift`
- Add `ViewContent` fbq call on every LP load
- Add `AddToCart` fbq call on signup form open
- Add `InitiateCheckout` fbq call on Stripe Checkout redirect
- All three events use shared event_id pattern (already established in PR #36)
- Update AEM priority in Events Manager (manual step — documented in `docs/meta-aem-priority.md`)

**PR 4 — Phase 2 social proof swap-in (later, ~3 weeks out)**
- Create `testimonials` Supabase table
- Update `<SectionSocialProof />` to read from DB
- Add admin UI to upload mom testimonials (photo, name, city, $earned, quote, optional video URL)
- Captures 5-10 real moms' content once they're onboarded

### Feature flag rollout

```
NEXT_PUBLIC_LP_BASELINE_V2 = "off"     → existing LPs unchanged (default while building)
NEXT_PUBLIC_LP_BASELINE_V2 = "shadow"  → render LPBaseline but no traffic routed; preview-only
NEXT_PUBLIC_LP_BASELINE_V2 = "live"    → all traffic gets the new baseline
```

Staged rollout: ship in "off" state. Manually QA each variant on preview. Flip to "live" when ready.

---

## Validation checklist

Before flipping the flag to `"live"`:

- [ ] Every one of the 10 current variants renders without console errors
- [ ] Pricing variant B and C both render correctly (toggle cookie to verify)
- [ ] All 9 LPSectionTracker events fire when scrolling (verify in Pixel Helper / Network tab)
- [ ] `ViewContent`, `AddToCart`, `InitiateCheckout` standard events fire at the right moments
- [ ] `pricing_variant` lands in Stripe Checkout Session metadata for both B and C
- [ ] `pricing_variant` shows up in admin Funnel Lab rollup
- [ ] Mobile (375px) layout looks correct for every section
- [ ] Tablet (768px) and Desktop (1024px) layouts look correct
- [ ] Real dashboard screenshots load (no broken images)
- [ ] FAQ accordion opens/closes smoothly, no layout shift
- [ ] Animated diagrams play without jank on a 4G connection
- [ ] Lighthouse perf score ≥ 90 on mobile
- [ ] `npm run build` succeeds

After flipping to `"live"`:

- [ ] First 24h: monitor Vercel for errors
- [ ] First 24h: confirm new section events appearing in Meta Events Manager → Custom Events
- [ ] First 72h: check Funnel Lab admin — pricing B vs C signups balanced?
- [ ] Day 7: pull conversion rate by pricing variant. If statistical significance reached, recommend winner.

---

## Open questions / decisions parked

1. **Phase 2 testimonial timing.** Do we set a hard date for "real moms onboarded" or let it ride opportunistically? *Recommend:* hard date 2 weeks post-launch with paid acquisition of 5-10 founding moms.
2. **Animated diagram tool.** Lottie? Framer Motion? React Spring? Pure CSS? *Recommend:* Framer Motion for control + bundle size.
3. **Brand logo sourcing.** Are we cleared to use the brand logos at the scale needed (30-50)? Most affiliate programs grant logo usage for partners. *Recommend:* legal-skim each brand's terms before launching, but standard affiliate logo usage is broadly OK.
4. **Real dashboard screenshot freshness.** Screenshots may go stale as dashboard UI evolves. *Recommend:* set up an automated screenshot capture (Playwright) that re-runs weekly and updates `/public/lp-baseline/`.

---

## Why this is worth the 2-week investment

We currently have:
- 5 organic LP visits → 0 organic conversions in 8 days
- Meta is starved for signal (the algorithm has nothing to learn from)
- Trust seal is genuinely thin — the LPs read like a quick-pitch landing page

After this upgrade we'll have:
- Every variant inheriting a proper conversion-optimized below-the-fold
- A controlled A/B test on the highest-leverage variable (pricing positioning)
- 9 new sub-events fueling Meta's algorithm with rich behavioral signal
- A scalable template that every future Funnel Lab variant inherits for free
- A real product story moms can read, trust, and act on
