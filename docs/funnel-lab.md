# Funnel Lab v1

A closed-loop, multivariate landing-page testing system for paid acquisition.
Designed for Meta Andromeda (creative-led targeting) campaigns against a $5
day-one breakeven CPA target.

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

## What's deliberately not in v1

- **Email-gate funnel** — schema supports it (`funnel: "email-gate"`), no
  variants enable it yet. Add a `<LPHeroEmailGate />` component when ready.
- **Checkout-first funnel** — would need a new API route to create a Stripe
  Checkout Session without a prior Supabase auth user. Doable, not in v1.
- **Visit-level rollups** — migration is written but not applied. See section above.
- **Real-time CPA from Meta** — would need Meta Marketing API integration to
  pull spend per ad/creative. Out of scope for v1; marketer can compute
  manually by dividing Ads Manager spend by the dashboard's signup count.

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
