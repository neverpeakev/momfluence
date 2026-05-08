# MomFluence v2 Session 4 — Meta Tracking Implementation Plan

## Pixel architecture: new v2 primary + two legacy v1 pixels for audience signal

**v2 primary pixel (created May 7, 2026):**
- Pixel ID: `1468831514190648`
- Dataset name in Events Manager: "MomFluence.App v2"
- Business Manager: `747377658306568` (MomFluence App)
- Meta Ads Account: `3553164818168199`
- Connected to Facebook Page `1086292991223812` and Instagram `@momfluence.app`
- Owner email: kneal@ucla.edu
- This pixel fires PageView + all custom events (Purchase, SignupStarted, CheckoutStarted) and is the ONLY pixel connected to CAPI

**v1 legacy pixels (kept on-site for audience continuity, NO CAPI):**
- `1407633647209853` — v1 content-pages pixel; in v1 fired Purchase, Subscribe, InitiateCheckout, ViewContent, Lead. In v2: fires PageView only for retargeting/audience signal preservation.
- `764587569626622` — v1 SPA-shells pixel; in v1 fired PageView only. In v2: continues to fire PageView only.

**Why this architecture:**
- v2 ad campaigns optimize against the clean new pixel — no v1 reporting noise
- New ad account `3553164818168199` is dedicated to v2 — clean attribution, billing, reporting
- Legacy pixels preserve audience signal at zero risk (PageView is non-attributable)
- v1 audience can be retargeted in the future via the legacy pixels' custom audiences

**Pixel firing implementation in `app/layout.tsx` (Session 4 work):**

Use Next.js `<Script strategy="afterInteractive">` component. The fbq calls inside:

```js
fbq('init', '1468831514190648');         // v2 primary
fbq('init', '1407633647209853');         // v1 legacy (audience signal only)
fbq('init', '764587569626622');          // v1 legacy (audience signal only)
fbq('track', 'PageView');                // fires for all initialized pixels
```

**Custom event firing (use trackSingle to target only v2 pixel):**

```js
// Purchase event — fires ONLY on v2 primary pixel
fbq('trackSingle', '1468831514190648', 'Purchase', {
  value: 5.00,
  currency: 'USD',
  content_type: 'product',
  content_name: 'MomFluence Membership',
  content_category: 'Subscription',
});

// Funnel diagnostics, also v2-only, no value signal
fbq('trackSingle', '1468831514190648', 'SignupStarted');
fbq('trackSingle', '1468831514190648', 'CheckoutStarted');
```

**Why `trackSingle` instead of `track`:** `track` fires across ALL initialized pixels. Using it for value events would cause Purchase to fire on the v1 legacy pixels too, polluting their historical attribution. `trackSingle` targets only the specified pixel.

**Vault entry needed for Session 4:**
- `meta_pixel_id` = `1468831514190648` (or set as `NEXT_PUBLIC_META_PIXEL` env var — public-safe value, not a secret)

## Strategic positioning for Meta — treat as $5 one-time product, NOT subscription

We are NOT telling Meta this is a subscription with $60 annualized LTV. Reasoning:
- v1 had 7 conversions on 49 clicks (14.3% CVR) — small sample but suggests low-CPC audiences exist
- At $5 unit economics, day-1 break-even requires CPC ≤ $0.71 (and day-1 profit requires CPC ≤ $0.50)
- If we tell Meta `predicted_ltv = $60`, Meta will bid up to $60 CPA targeting "premium" audiences. That destroys the day-1 economics that made v1 work.
- Instead: tell Meta "$5 product purchase, content_type: product." Let Meta optimize for low-CPC volume against the audience pattern that converted in v1.
- The trade-off: Meta won't model long-term subscription value. We accept that. We'd rather have Meta find day-1 profitable clicks than chase long-term LTV that we don't yet have data to back up.

If/when v2 has enough subscription history (say, 6+ months of cohort retention data showing real LTV), we can revisit telling Meta about subscription value. Until then, Meta optimizes against $5.

## CAPI implementation: Stape CAPIG (browser-pixel proxy, NOT a backend endpoint)

Architecture (May 7, 2026): Stape CAPIG is a hosted gateway that sits IN FRONT OF the browser pixel. The browser pixel fires events into Stape's URL (or a custom subdomain), and Stape automatically forwards them server-to-server to Meta CAPI using its own stored Meta access token.

This is fundamentally different from a "DIY CAPI endpoint" architecture — we do not write CAPI server code at all.

**Stape configuration (live as of May 7, 2026):**
- CAPIG URL: `https://capig.stape.vip`
- CAPIG identifier: `zlvuhcxy`
- Pixel attached: `1468831514190648`
- Plan: Pay-as-you-go ($10/mo)
- Server location: North America (US)
- Admin email: kneal@ucla.edu

**What Stape CAPIG handles automatically (no code on our side):**
- Server-to-server forwarding of browser pixel events to Meta CAPI
- Meta access token storage (held by Stape, never in our codebase)
- Event_id generation and deduplication between browser and server
- User data hashing (email, phone, external_id)
- IP and user-agent forwarding to Meta
- Retry logic on Meta API failures
- Match quality optimization

**What WE handle in code (Session 4):**
- Standard Meta browser pixel firing in `app/layout.tsx` (the fbq calls shown in the Pixel architecture section above)
- That's it. No backend code needed for CAPI.

Stape activates automatically once the v2 pixel fires from our domain — Stape's gateway captures every event and starts mirroring to Meta CAPI. No "connect Stape" step in our code.

**Optional optimization (DNS-only, defer to Session 4 launch prep):**

Stape supports first-party data routing via a custom subdomain. This improves Meta match quality scores from ~6/10 to ~8-9/10 by routing pixel events through OUR domain (`capig.momfluence.app`) instead of `capig.stape.vip`.

Setup steps when we're ready (defer until after Stripe Custom Domain DNS settles to avoid simultaneous DNS changes):
1. In Stape Dashboard → Data Routing tab → click "Optimize"
2. Stape provides a CNAME target value
3. At Vercel/domain registrar, add CNAME: `capig.momfluence.app` → `<Stape's CNAME target>`
4. Verify in Stape Dashboard
5. Stape provides updated pixel script that uses `capig.momfluence.app` instead of default; deploy via env var update

**Vault entries for CAPI: NONE.** Stape holds all credentials. The only Meta-related env var we need in our system is `meta_pixel_id` = `1468831514190648` (already covered above; public-safe).

**Source verification:** Stape's official docs confirm this architecture. Direct quote from stape.io/blog/how-to-set-up-meta-conversions-api-gateway: "Every time the Meta Pixel is fired from the browser, the events will be sent to Meta Pixel and Conversions API through a secure connection." From stape.io/blog/conversions-api-gateway-common-mistakes-frequently-asked-questions: "You do not need to set up event deduplication for CAPIG. Event deduplication is set up automatically."

## Cross-domain UX: Stripe Custom Domain

As of May 7, 2026, Stripe Custom Domains is enabled at $10/mo. Stripe Checkout renders at `checkout.momfluence.app` instead of `checkout.stripe.com`.

**DNS status:** Records added and verified by Stripe May 7, 2026. Currently in Stripe's 3-hour stability check window. Stripe will email when active.

**Why this matters for Meta pixel tracking:**
- Browser pixel events fire continuously across same-parent-domain navigation (`momfluence.app` → `checkout.momfluence.app` → `momfluence.app/welcome`)
- No cross-domain attribution loss between the "CheckoutStarted" event (fires on momfluence.app) and the "Purchase" event (fires on momfluence.app/welcome after Stripe redirect)
- Cookie domain for fbq is automatically `.momfluence.app` since pixel script runs on the parent domain
- Stape CAPIG continues to handle dedup automatically — no code changes needed for the custom domain

**UX benefits:**
- Visitor never visually leaves momfluence.app (same parent domain throughout funnel)
- Stronger trust signals at checkout (no "you're now on Stripe.com" friction)
- Branded customer portal links and email receipts
- Better conversion rate (industry benchmarks: 5-15% improvement from same-domain checkout)

**Implementation in Session 4 (no special config needed):**

Standard Stripe Checkout session creation works as-is — Stripe automatically routes to `checkout.momfluence.app` once the custom domain is live (account-level setting):

```ts
// app/api/checkout/create/route.ts (Session 4)
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{ price: process.env.STRIPE_PRICE_ID_MEMBERSHIP, quantity: 1 }],
  success_url: 'https://momfluence.app/welcome?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://momfluence.app/?cancelled=true',
});
```

## v1 reference: how Purchase fired in checkout.html

For continuity reference (v1 `checkout.html`, lines 380–478):

```js
// PayPal subscription path (onApprove):
fbq('track', 'Subscribe', {
  content_name: product.name,
  content_category: product.pixelCategory,
  value: parseFloat(product.price),
  currency: 'USD',
  predicted_ltv: 60.00
});
fbq('track', 'Purchase', {
  content_name: product.name,
  content_category: product.pixelCategory,
  value: parseFloat(product.price),
  currency: 'USD',
  content_type: 'product'
});

// PayPal one-time payment path (onApprove):
fbq('track', 'Purchase', {
  content_name: product.name,
  content_category: product.pixelCategory,
  value: parseFloat(product.price),
  currency: 'USD',
  content_type: 'product'
});
```

v2 should preserve the same content_name, content_category, value, currency, content_type event-property shape so Meta's audience modeling carries forward without a "schema gap." For the Stripe v2 flow, value is 5.00 and currency is USD.

### v2 changes from v1 event shape (DELIBERATE departure from v1)

1. **DROP `predicted_ltv` entirely.** v1 fired `predicted_ltv: 60.00` (LTV-1-year math). v2 sends NO predicted_ltv. Meta will model based on value: 5 alone.
2. **DROP the Subscribe event.** v1 fired both Subscribe AND Purchase on subscription signups. v2 fires ONLY Purchase. Subscribe signals to Meta that this is recurring revenue, which triggers LTV modeling we don't want.
3. **DO NOT fire Purchase on subscription renewals.** When Stripe webhook fires `invoice.paid` for month 2, month 3, etc., do NOT call the Meta CAPI endpoint. Fire Purchase ONLY on the first `checkout.session.completed` for a given customer.
4. **KEEP value: 5.00, currency: USD, content_type: product, content_name, content_category** — same shape as v1 but now framed as a one-shot product purchase.

## Audit / test plan for Session 4 verification

- Open Meta Events Manager → Test Events tab.
- Add the test_event_code via cookie or query param.
- Trigger one full signup flow: landing → Join → Stripe test checkout → success_url redirect.
- Verify in Test Events:
  - PageView fires from browser
  - SignupStarted fires from browser
  - Purchase fires BOTH from browser AND from CAPI with matching event_id
  - User data (email, IP, UA) shows up in advanced matching
  - "Match quality" score is at least 6/10 (good)
- Verify no double-counting in actual Meta Events Manager (not test mode) — both browser and CAPI events should appear with same event_id and Meta dedupes them.

## What v1 did NOT have (build from scratch in v2)

- **No CAPI implementation existed in v1.** Grep for graph.facebook.com, /v18.0/, events?access_token, conversions-api, capi across all v1 marketing files returned **zero matches**. The v1 site fired only the browser pixel — no server-side redundancy. Session 4's CAPI work is greenfield.
- **No /thank-you.html page in the recovered marketing files** even though `checkout.html:415` redirects to it (`window.location.href = '/thank-you.html?plan=...&amount=...&sub=...'`). Either the file was deployed but lost in recovery, or the redirect 404'd silently. For v2 we'll build a proper /welcome page that fires the post-purchase events server-side via webhook plus client-side via Set-Cookie-passed event_id.
- **No event deduplication in v1** because there was nothing to deduplicate (CAPI didn't exist). v2's dual-fire requires the event_id discipline above from day one.
- **v1 told Meta this was a subscription with $60 LTV.** That's wrong for v2's day-1 profitability strategy. v2 explicitly drops Subscribe events and predicted_ltv. Acquisition cost target is now $5 per conversion (not $60), forcing Meta to optimize for low-CPC audiences matching the v1 conversion pattern.

## Outstanding Kevin tasks (before Session 4)

- ROTATE the Stape CAPIG API key in the Stape dashboard (the original key was pasted in chat for setup; rotate it for hygiene). Save the new key to a password manager. Note: this key is for managing the Stape account itself — not used in our codebase.
- Verify Stripe Custom Domain (checkout.momfluence.app) is fully active after the 3-hour stability check completes. Confirm by creating a test Checkout Session in Stripe Dashboard and checking the rendered URL is checkout.momfluence.app.
- Defer to Session 4 launch prep: set up `capig.momfluence.app` CNAME for first-party data routing (Stape Dashboard → Data Routing → Optimize). Wait until Stripe Custom Domain DNS has fully settled.
- Add 1 Vault entry / env var for Session 4:
  - `NEXT_PUBLIC_META_PIXEL` = `1468831514190648` (public-safe; treated as env var, not Vault secret)
- Add Stripe Vault entries / env vars for Session 4:
  - `STRIPE_PUBLISHABLE_KEY` (live mode, from existing keys)
  - `STRIPE_SECRET_KEY` (live mode, from existing keys)
  - `STRIPE_PRICE_ID_MEMBERSHIP` = `price_1TUVt2ANPjxV4rVaQ4hgCXvr`
  - `STRIPE_WEBHOOK_SIGNING_SECRET` (created during Session 4 webhook setup)

## Day-1 economics & target CPC math

v1 baseline: 49 clicks → 7 conversions = 14.3% conversion rate.

At $5 per conversion, target CPC ranges (assuming v1 CVR holds in v2):

| Target | CPC ceiling | Daily profit at 7 conv/day |
|---|---|---|
| Day-1 breakeven | $0.71 | $0 |
| Day-1 modest profit (1.5x ROAS) | $0.48 | $11.50 |
| Day-1 strong profit (2x ROAS) | $0.36 | $17.50 |
| Day-1 high profit (3x ROAS) | $0.24 | $23.30 |

Meta optimization phases (expected):
- Phase 1 (first $200–500 spent): higher CPCs while Meta calibrates against new pixel events
- Phase 2 (after 50+ Purchase events on the pixel): CPCs drop to optimal range
- Phase 3 (200+ events/week): lowest CPCs, most efficient targeting

Note: 14.3% CVR is computed from 49 clicks (small sample). 95% CI on this rate is roughly 6%–25%, so real v2 CVR could vary. Recompute target CPCs once v2 has ~100+ clicks.

## Payout rails: deferred manual payouts + instant-payout perk (revised May 8, 2026)

Session 7 was originally scoped against Stripe Connect Express after PayPal Mass Pay was denied on May 6, 2026. As of May 8, scope has been simplified further:

- **Launch with manual payouts.** Kevin manually pays each member via their preferred method (PayPal email, Venmo handle, etc.) until volume justifies automation. Catt CC'd on payout request notifications.
- **Payout setup is deferred** — not collected at signup. Member only sets up payout when they click "Withdraw."
- **W-9 collection is deferred** to $600 cumulative earnings (IRS 1099-NEC threshold).
- **Payout-method-agnostic UX** — collection form supports PayPal, Venmo, Bank ACH (deferred placeholder), and "Skip for now". Schema designed so swapping in any automated provider later (Stripe Connect, PayPal Mass Pay, Tipalti, etc.) requires no UX migration.
- **Instant-payout token (psychological hook):** each member gets ONE lifetime instant-payout token, available in first 90 days from signup. Lower threshold ($25 vs standard $50). Capped at $25 max payout amount during first 30 days from signup (chargeback protection). After token use OR 90 days expiry → gone forever, member on standard $50/2x-monthly track.
- **Standard payout rules:** $50 minimum, max 2 withdrawal requests per calendar month.

Implications for Session 4 (signup funnel) — what changes from prior plan:

- **Onboarding step 2 ("payout destination") is REMOVED.** Post-Stripe-Checkout flow goes: Checkout success → Profile setup (display name, bio) → Dashboard. No payout info collected.
- **Payout collection moves to Phase 5 (Manual payout infrastructure)** — see session-4-punchlist.md.
- **DB schema:** drop the prior `stripe_connect_account_id` plan. New schema in punchlist Phase 5: `signup_at`, `payout_status`, `payout_method`, `payout_paypal_email`, `payout_venmo_handle`, `payout_venmo_phone`, `cumulative_earnings_cents`, `instant_payout_used_at`.

What does NOT change:
- Stripe Checkout for inbound $5/mo membership payments — same plan
- Meta pixel + CAPI implementation — same plan
- 1099-NEC compliance — handled at $600 threshold via deferred W-9 collection

## Site readiness gaps identified May 7, 2026 (audit findings)

A site audit at https://momfluence.app at commit b02cf3c surfaced these specific Session 4 implementation requirements:

**Missing pages that MUST exist before paid traffic:**
- `/for-influencers` — currently 404s; this is the target of the primary homepage CTA "New here? Apply →"
- `/privacy` — currently 404s; Meta Ads policy blocker, also needed for Apple Pay domain verification + Stripe Customer Portal forward reference
- `/terms` — currently 404s; Meta Ads policy blocker
- `/pricing` (recommended) — currently 404s; helps conversion rate by setting expectations on $5/mo before CTA click
- `/signup` or `/apply` — currently 404s; the actual paid signup funnel

**Pixel installation confirmed missing:**
- New v2 pixel `1468831514190648` NOT installed in `app/layout.tsx` — only the legacy `764587569626622` is firing currently
- Legacy `1407633647209853` (the one with v1 Purchase history) also NOT installed
- Session 4 must install all 3 pixels per the architecture documented above in this doc

**Site-chrome gaps:**
- No header navigation on homepage
- No footer with privacy/terms/contact/legal links
- These hurt Meta Ads quality score and increase CPC

**Stale copy on homepage:**
- "Get paid NET-30" card says "PayPal, Venmo, ACH" — contradicts Stripe Connect Express pivot for Session 7. Update to neutral language like "Direct deposit" or "Bank transfer".

## References

- Meta CAPI docs: https://developers.facebook.com/docs/marketing-api/conversions-api
- Server Events parameters: https://developers.facebook.com/docs/marketing-api/conversions-api/parameters
- Event deduplication: https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events
