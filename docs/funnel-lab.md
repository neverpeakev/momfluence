# Funnel Lab v2 — Autonomous

A closed-loop, **self-improving** multivariate landing-page testing system for paid acquisition. Designed for Meta Andromeda (creative-led targeting) campaigns against a $5 day-one breakeven CPA target.

> **v2 adds:** autonomous decisioning via Bayesian beta-binomial, scheduled cron (every 6h), Meta Marketing API integration for pause/scale enactment, Claude Opus 4.7-generated remix variants, programmatic image rendering via Playwright + `@sparticuz/chromium-min`, and DB-backed runtime variants so Claude-generated remixes go live without a code deploy. **Shadow mode by default** — logs decisions but doesn't enact until you flip the switch.

## TL;DR

- **10 landing page variants** at `/lp/<slug>`, each tuned to a distinct
  psychographic angle. Slug-based URLs are human-readable on purpose so the
  marketer in Ads Manager can tell at a glance which LP a creative points at.
- **10 paired ad creatives** at `/creatives` (creatives #11–#20). Each
  creative maps 1:1 to a variant. Built as ready-to-screenshot HTML/CSS at
  native Meta resolution (1080×1080).
- **Attribution chain** survives the auth round-trip via cookies + Stripe
  Checkout metadata. Zero Supabase schema changes required for v1.
- **Admin dashboard** at `/admin/funnel-lab` reads back from Stripe and shows
  signups, active rate, cancel %, and MRR by variant + creative.
- **Optional migration** (`supabase/migrations/20260510000000_funnel_lab.sql`)
  unlocks visit-level CR/CPA tracking. **Not applied** — review and apply
  manually when ready.

## Architecture at a glance

```
Meta Ad
   │
   ▼
/lp/<slug>?c=<creativeId>            ← server-rendered, statically generated
   │  ├── LPVisitTracker writes cookies (variant, creative, first_seen)
   │  └── CTA → /signup?lp=<slug>&c=<creativeId>
   │
   ▼
/signup                              ← reads URL params + cookies, merges
   │  └── POST /api/checkout/create { attribution: {...} }
   │
   ▼
/api/checkout/create                 ← folds attribution into Stripe metadata
   │
   ▼
Stripe Checkout Session
   │  metadata.lp_variant   = "group-chat-goldmine"
   │  metadata.creative_id  = "c11"
   │  metadata.lp_first_seen = "2026-05-10T18:12:33Z"
   │
   ▼
Subscription (inherits metadata)
   │
   ▼
/admin/funnel-lab                    ← stripe.subscriptions.list({ expand: [...] })
                                       groups by metadata.lp_variant
```

## File map

```
lib/funnel-lab/
  variants.ts            — typed config; single source of truth for the 10 variants
  attribution.ts         — URL parse, cookie read/write, Stripe metadata helper

app/lp/[variant]/page.tsx           — dynamic LP renderer, generateStaticParams
components/landing/LPVisitTracker.tsx — client-side cookie writer on /lp/ touch

app/signup/page.tsx, app/signup/SignupInner.tsx — Suspense-wrapped, captures attribution
app/api/checkout/create/route.ts    — accepts { attribution } body, writes Stripe metadata

app/creatives/page.tsx              — adds 10 new variant-paired creatives (#11–#20)
app/(app)/admin/funnel-lab/page.tsx — admin rollup dashboard

supabase/migrations/20260510000000_funnel_lab.sql — optional, not applied
```

## Variant model

Each variant is a typed object with this shape (see `lib/funnel-lab/variants.ts`):

```ts
interface FunnelVariant {
  slug: string;              // URL slug, [a-z0-9-]
  label: string;             // for admin dashboard
  hypothesis: string;        // what we're testing
  angle: string;             // psychographic chip
  funnel: "direct" | "email-gate";   // v1 ships "direct" only
  belowFold: "lean" | "full";
  primaryCreativeId: string;
  hero: { eyebrow; headline; subhead; ctaPrimary; ctaSecondary };
  closer: { headline; subhead };
}
```

The 10 v1 variants:

| Slug                        | Angle                       | Primary creative |
|----------------------------|-----------------------------|------------------|
| group-chat-goldmine         | community / group chat      | c11              |
| no-influencer-needed        | newbie / no-jargon (LCD)    | c12              |
| school-hours-income         | time-of-day / SAHM          | c13              |
| stealth-income              | anonymous / introvert       | c14              |
| chatgpt-writes-it           | AI / empowerment            | c15              |
| trusted-mom-economy         | economy / thesis            | c16              |
| not-mlm                     | skepticism bust             | c17              |
| twenty-five-day-one         | specific number / proof     | c18              |
| real-receipts               | proof / receipts            | c19              |
| faceless-creator            | faceless brand / creator    | c20              |

All variants share a **lowest-common-denominator copy foundation**: no jargon,
no assumed prior knowledge of affiliate marketing or AI, no assumed following.

## Attribution chain

### 1. First touch (ad click)

URL pattern: `/lp/<slug>?c=<creativeId>&utm_source=meta&utm_campaign=funnel-lab-v1&utm_content=<creativeId>`

The page is server-rendered via `generateStaticParams`. The `<creativeId>` from
the query string is sanitized server-side and used to construct the CTA URL.

### 2. Cookie persistence

`<LPVisitTracker variant={v.slug} />` mounts client-side and writes:

- `mf_lp` — variant slug (last-touch model — flip to first-touch by gating
  on `existing.variant`)
- `mf_creative` — creative id
- `mf_first_seen` — ISO timestamp (written once, never overwritten)

Cookie TTL: 30 days, `SameSite=Lax`, path=`/`.

### 3. Signup → checkout

`/signup` reads both URL params (`?lp=&c=`) and cookies, merges them
(URL wins on conflicts), persists the merge, and posts to
`/api/checkout/create` with `{ attribution: {...} }`.

The API re-sanitizes (defense in depth), then folds the attribution into the
Stripe Checkout Session metadata:

```ts
metadata: {
  auth_user_id: user.id,
  lp_variant: "group-chat-goldmine",
  creative_id: "c11",
  lp_first_seen: "2026-05-10T18:12:33Z"
}
```

The same metadata is set on `subscription_data.metadata` so it flows through
to the long-lived subscription record (not just the session).

### 4. Rollup

`/admin/funnel-lab` calls `stripe.subscriptions.list({ expand: ["data.customer"] })`,
paginates up to 500 most-recent subs, and groups by `metadata.lp_variant`.

The dashboard shows per variant:
- Signups (total subs with that metadata)
- Active (status `active` or `trialing`)
- Cancel % (`canceled` or `incomplete_expired` ÷ signups)
- MRR (active count × $5)

A `<details>` block shows the same data sliced by `creative_id`, paste-friendly
for sharing with the marketer.

## Visit-level CR/CPA (optional, requires migration)

Without applying `supabase/migrations/20260510000000_funnel_lab.sql`, we can
only measure **signups per variant** — not the **CR** (CR = signups ÷ visits).
With it, the LP can `INSERT` a row into `funnel_visits` on every page load and
the dashboard can join.

The migration creates:
- `public.funnel_visits` (anon-insert, admin-read RLS policies)
- `public.funnel_visit_rollup` view (visits, unique_visitors per variant+creative)

When ready to enable:
1. Apply the migration via `supabase db push` or the Supabase dashboard SQL editor
2. Update `LPVisitTracker.tsx` to also POST to `/api/funnel-lab/visit` on mount
3. Add `/api/funnel-lab/visit` route that inserts via the service role key

## Testing strategy

Recommended Meta Ads Manager setup (mirrored in the coral tile at the top
of `/creatives`):

- **Objective:** Sales (or Engagement → SignupStarted custom event from v2 pixel)
- **Audience:** Women 28–55, US, **no interests** — let Andromeda pick
- **Optimization:** Conversions on Purchase event (v2 pixel via Stape CAPIG)
- **Placements:** Advantage+ (let Meta serve everywhere)
- **Budget:** $20–50/day per ad set
- **Bidding:** Cost cap at $5 (matches day-1 breakeven)

Per-creative rules of thumb:
- Kill creatives below 1.5% CTR after 1,000 impressions
- Scale creatives below $5 CPA aggressively
- Refresh winners every 14 days — same angle, new visual — to fight fatigue

## v2 — Autonomous optimizer

### Loop
```
[Vercel Cron · every 6h]
   │
   ▼
/api/optimizer/tick                       ← admin/optimizer mode = shadow | live | paused
   │  1. Read settings (mode, thresholds)
   │  2. Pull Stripe subs (last 500), group by lp_variant + creative_id
   │  3. Pull Meta Marketing API: insights per ad in the configured ad set
   │  4. Compute Bayesian beta-binomial joint posterior (10k Monte Carlo draws)
   │     - P(arm is best) and P(arm is worst) per arm
   │  5. Plan decisions:
   │     - PAUSE  if P(worst) ≥ p_worst_threshold (default 0.95)
   │     - SCALE  if P(best)  ≥ p_best_threshold  (default 0.80)
   │     - REMIX  if a single clear leader emerges → Claude Opus 4.7 generates 3 candidates
   │  6. Enact (live mode) or just log (shadow mode):
   │     - PAUSE → metaClient.pauseAd(ad_id)
   │     - SCALE → metaClient.setAdSetDailyBudget(currentBudget * (1 + scale_pct_per_day), capped at max_budget_multiplier × starting)
   │     - REMIX → call Anthropic SDK, store candidates as proposed_copy in optimizer_actions
   │  7. Write everything to optimizer_actions audit log with rationale + stats snapshot
```

### Programmatic image rendering
```
/api/render/creative/<slug>.png
   │
   ▼
launches @sparticuz/chromium-min in the Vercel function
   │
   ▼
navigates to /_render/creative/<slug>  ← 1080×1080 LP-creative template
   │
   ▼
waits for fonts + selector
   │
   ▼
returns PNG bytes with Cache-Control: max-age=86400, s-maxage=604800
```

The Meta Marketing API fetches this URL once per ad creative creation. The PNG is served from Vercel's edge cache thereafter. **No manual screenshots required** — same path used for the 10 seed creatives AND for Claude-generated remix variants.

### Autonomous remix promotion
```
Optimizer detects clear winner
   │
   ▼
Anthropic SDK → Claude Opus 4.7 → 3 remix candidates (typed via Zod)
   │
   ▼
Candidates stored as proposed_copy in optimizer_actions
   │
   ▼
Admin reviews in /admin/optimizer → clicks "Promote to live ad"
   │
   ▼
POST /api/optimizer/promote-remix
   │  1. Insert variant into funnel_variants (DB-backed; LP route serves it)
   │  2. POST to Meta /adcreatives with image_url = /api/render/creative/<new-slug>.png
   │  3. POST to Meta /ads (status=PAUSED — never auto-unpauses)
   │  4. Mark optimizer_action enacted, store new meta_ad_id
   │
   ▼
New ad lives in the same ad set, ready for admin to unpause when comfortable
```

**Why human-in-the-loop on promotion?** Spend safety. Claude's copy is excellent but inserting an ad that can spend money should require one human click. Removing this gate (cron auto-promotes) is a 5-line change once you trust the system.

### Files (v2)

```
lib/optimizer/
  stats.ts                — Bayesian beta-binomial (Marsaglia gamma sampling)
  meta-client.ts          — Marketing API wrapper (listAds, getAdInsights, pauseAd, setAdSetDailyBudget)
  anthropic-client.ts     — Claude Opus 4.7 remix generator (Zod-validated JSON)
  campaign-builder.ts     — programmatic campaign + ad set + 10 ads creation
  decisions.ts            — decision engine (planDecisions: pause/scale/remix/no_op)
  renderer.ts             — Playwright headless screenshotter
  audit.ts                — Supabase service-role audit log + settings KV

lib/funnel-lab/
  runtime-variants.ts     — DB-backed variants (seed code + funnel_variants table)

app/api/optimizer/
  tick/route.ts           — cron-authed (CRON_SECRET) main loop
  launch/route.ts         — admin-authed campaign creation
  promote-remix/route.ts  — admin-authed remix → live ad

app/api/render/
  creative/[slug]/route.ts — public Playwright endpoint (Meta fetches PNG here)

app/_render/
  creative/[slug]/page.tsx — 1080×1080 creative renderer target

app/(app)/admin/optimizer/
  page.tsx                — main optimizer dashboard (mode, thresholds, ticks, actions)
  actions.ts              — server actions (setMode, setThreshold)
  LaunchCampaignButton.tsx — campaign launcher UI
  PromoteRemixButton.tsx  — promote candidate to live ad UI

vercel.json               — crons: [{ path: "/api/optimizer/tick", schedule: "0 */6 * * *" }]
```

### Required env vars (Vercel project settings)

| Name | Purpose |
|---|---|
| `META_MARKETING_API_TOKEN` | Bearer token for Meta Marketing API (ads_management + ads_read scopes) |
| `META_AD_ACCOUNT_ID` | `act_xxxxxxxxxxxxxx` (or bare numeric — normalized client-side) |
| `META_AD_SET_ID` | The ad set the optimizer targets |
| `META_FB_PAGE_ID` | Facebook Page the ads run from (required for ad creatives) |
| `anthropic_public_api_key` | Claude API key (project-specific naming — code accepts either this or `ANTHROPIC_API_KEY`) |
| `CRON_SECRET` | Shared secret for Vercel Cron → /api/optimizer/tick auth |
| `STRIPE_SECRET_KEY` | already in use — for subscription rollup |
| `SUPABASE_SERVICE_ROLE_KEY` | server-side admin queries (audit log writes, runtime variants) |
| `NEXT_PUBLIC_SITE_URL` | for self-referential URLs (image renders, signup destinations) |
| `CHROMIUM_BINARY_URL` *(optional)* | override the chromium-min binary CDN — defaults to Sparticuz v131 |

### Decision thresholds (live-editable from `/admin/optimizer`)

| Setting | Default | Meaning |
|---|---|---|
| `min_visits_per_arm` | 100 | Below this, no decisions (every arm gets a no-op) |
| `min_conversions_per_arm` | 5 | Both thresholds must pass for decisions |
| `p_worst_threshold` | 0.95 | PAUSE when ≥95% confident an arm is the worst |
| `p_best_threshold` | 0.80 | SCALE when ≥80% confident an arm is the best |
| `max_pauses_per_tick` | 1 | Avoid cascading cliff drops |
| `max_scales_per_tick` | 1 | Same on the scale side |
| `scale_pct_per_day` | 0.30 | +30% daily budget per SCALE event |
| `max_budget_multiplier` | 3.0 | Cap at 3× starting daily budget |
| `starting_daily_budget` | 30 | Anchors the scale-cap math |
| `mode` | `shadow` | `shadow` = log only · `live` = enact via Meta API · `paused` = kill switch |

### Shadow mode

The first 7 days run in `shadow` by default. Every decision is logged to `optimizer_actions` with full rationale (visits, conversions, spend, P(best), P(worst)) but `enacted = false` and no Meta API call is made. Admin opens `/admin/optimizer` to see:
- What the optimizer would have paused
- What it would have scaled
- What remix candidates Claude generated

After 7 days, compare with your manual decisions. If the system's judgment looks sound → flip `mode` to `live` from the admin UI. Same code path, now actually enacts.

### Safety rails baked in
- Min sample size gates (no decisions below 100 visits, 5 conversions per arm)
- Max one PAUSE + one SCALE per tick (caps blast radius)
- Daily budget bump capped at 3× starting (no runaway scaling)
- Claude-generated remixes NEVER auto-launch — always require admin click
- All Meta ads created in PAUSED state — never auto-unpause
- Every Meta API call logged with response in `meta_response` JSONB
- Mode = `paused` is a hard kill switch — tick logs no-op and exits

## Adding a new funnel shape

1. Extend the `FunnelShape` type in `lib/funnel-lab/variants.ts`
2. Add a branch in `app/lp/[variant]/page.tsx` to render the new shape
3. (Optional) Add new handling in `/api/checkout/create` if the funnel changes
   the checkout flow

## What's deliberately not in v2

- **Email-gate funnel** — schema supports it (`funnel: "email-gate"`), no
  variants enable it yet. Add a `<LPHeroEmailGate />` component when ready.
- **Auto-promote remixes without admin click** — five-line change in the tick handler; keep behind a gate until v1 launch results validate Claude's judgment.
- **Direct Meta spend integration in dashboard** — `/admin/optimizer` shows the actions taken; for top-level spend you still use Ads Manager. v2.1 could pull Marketing API insights into a dedicated reporting view.
- **Bayesian Thompson-sampling allocation** — current model is "set daily budget at the ad-set level and let Andromeda allocate." A true bandit allocation across arms would require per-ad budgets, which Meta does not directly support in OUTCOME_SALES campaigns.

## Adding a new variant

Three steps, no schema changes:

1. Add a new entry to the `VARIANTS` array in `lib/funnel-lab/variants.ts`
2. Add a new creative block to `app/creatives/page.tsx` using `<VariantSpec />`
3. Done — `/lp/<your-slug>` is live, the admin dashboard picks it up
   automatically, attribution flows through

## Adding a new funnel shape

1. Extend the `FunnelShape` type in `lib/funnel-lab/variants.ts`
2. Add a branch in `app/lp/[variant]/page.tsx` to render the new shape
3. (Optional) Add new handling in `/api/checkout/create` if the funnel changes
   the checkout flow

## Privacy

- All `/lp/<slug>` pages have `robots: { index: false, follow: false }` so they
  don't show in Google search results — paid traffic only
- `/creatives` and `/admin/funnel-lab` are also noindexed
- Attribution cookies are first-party only, `SameSite=Lax`, expire in 30 days
- No PII is stored in cookies — only opaque slugs and an ISO timestamp
