# MomFluence v2 Session 4 — Meta Tracking Implementation Plan

## Decision: which v1 pixel to inherit

- **Selected pixel ID: `1407633647209853`**
- Reasoning:
  - This pixel fired ALL of v1's value-bearing events: Purchase (twice — once in the PayPal subscription path at `checkout.html:392`, once in the one-time-payment path at `checkout.html:472`), Subscribe (`checkout.html:385`), InitiateCheckout (`checkout.html:300`, `for-influencers.html:519`), ViewContent (`pricing.html:50`, `index.current.html:51`, `contact.html:50`, `checkout.html:294`), Lead (`for-influencers.html:533`).
  - It was wired into all of the long-form content pages: `index.current.html`, `pricing.html`, `for-influencers.html`, `how-it-works.html`, `about.html`, `contact.html`, `checkout.html`. These are the pages that drove paid traffic + conversions.
  - The 7 historical Purchase conversions (the v1 paying signups Kevin later refunded) were attributed against this pixel — Meta's audience-modeling has built up against it.
- **Unselected pixel ID: `764587569626622`** — will not be wired into v2.
  - This pixel fired only PageView and only on the SPA shell pages (`index.html`, `signup.html`, `dashboard.html`, `login.html`, `admin.html`, `api_health.html`).
  - No Purchase, Subscribe, or any value events ever fired against it. No audience signal worth preserving.

## Strategic positioning for Meta — treat as $5 one-time product, NOT subscription

We are NOT telling Meta this is a subscription with $60 annualized LTV. Reasoning:
- v1 had 7 conversions on 49 clicks (14.3% CVR) — small sample but suggests low-CPC audiences exist
- At $5 unit economics, day-1 break-even requires CPC ≤ $0.71 (and day-1 profit requires CPC ≤ $0.50)
- If we tell Meta `predicted_ltv = $60`, Meta will bid up to $60 CPA targeting "premium" audiences. That destroys the day-1 economics that made v1 work.
- Instead: tell Meta "$5 product purchase, content_type: product." Let Meta optimize for low-CPC volume against the audience pattern that converted in v1.
- The trade-off: Meta won't model long-term subscription value. We accept that. We'd rather have Meta find day-1 profitable clicks than chase long-term LTV that we don't yet have data to back up.

If/when v2 has enough subscription history (say, 6+ months of cohort retention data showing real LTV), we can revisit telling Meta about subscription value. Until then, Meta optimizes against $5.

## Browser pixel implementation (client-side)

- Wired into `app/layout.tsx` via Next.js `<Script>` component with `strategy="afterInteractive"`.
- Standard `fbq('init', '1407633647209853')` on every page.
- PageView event auto-fires on init.
- Custom events to fire from client:
  - `SignupStarted` when user clicks "Join $5/mo" CTA on landing (funnel diagnostic; no value signal)
  - `CheckoutStarted` when Stripe Checkout session is created (funnel diagnostic; fires before redirect)
  - `Purchase` fires on `/welcome` page after Stripe success_url redirect with value: 5.00, currency: USD, content_type: product
  - **DO NOT** fire `Subscribe`. **DO NOT** fire `CompleteRegistration` as a value-bearing event (use it with no value if needed for funnel viz only).
  - **DO NOT** include `predicted_ltv` in any event.

The app already loads a Meta Pixel via `app/layout.tsx` — env-driven by `NEXT_PUBLIC_META_PIXEL`. Session 4 sets that env var to `1407633647209853` and adds the custom event triggers from the relevant client components.

## Conversions API implementation (server-side, REDUNDANT with browser pixel)

- Endpoint: `app/api/meta-capi/track/route.ts` (NEW file in Session 4).
- Fires on:
  - Stripe webhook `checkout.session.completed` → fires Purchase event server-side with value: 5.00, currency: USD, **NO predicted_ltv**. **ONLY fires for first-time payments** (where customer has no prior subscription on file). Subsequent `invoice.paid` renewal events do **NOT** trigger CAPI.
  - User profile completion → optional `CompleteRegistration` event with **NO value** (funnel diagnostic only).
- Required env vars to add to Vault:
  - `meta_pixel_id` = `1407633647209853` (the selected v1 pixel ID)
  - `meta_capi_access_token` (generate in Meta Events Manager → Settings → Conversions API → Generate Access Token)
  - `meta_capi_test_event_code` (optional — Meta's Test Events tab during dev)
- Hashed user data for advanced matching:
  - `email` (sha256, lowercased, trimmed) — REQUIRED per Meta's matching algorithm
  - `phone` (sha256, E.164 format) — collected during signup, hashed before send
  - `external_id` (Stripe `customer_id`, sha256) — for de-duplication with browser pixel
  - `client_user_agent` (from request user-agent header)
  - `client_ip_address` (from x-forwarded-for, NOT hashed — Meta receives raw IP)
- **Event deduplication**: each event sent via CAPI MUST have an `event_id` that matches the corresponding browser pixel event's `eventID` parameter. Otherwise Meta double-counts.
  - Use `crypto.randomUUID()` server-side and pass to client via Set-Cookie or response body so the browser fires the same ID via `fbq('track', 'Purchase', {...}, {eventID: '<that-uuid>'})`.

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

- Generate CAPI access token in Meta Events Manager (Settings → Conversions API → Generate Access Token) for pixel 1407633647209853.
- Create test_event_code for staging verification.
- Confirm pixel ID matches v1 history (sanity check in Events Manager — open the pixel, look at the historical Purchase conversions count, confirm it's the one with the 7 v1 Purchase events).
- Decide: do we want Meta to receive customer_email pre-hashed (privacy-first) or rely on Meta's own hashing (default). Recommendation: pre-hash server-side. Defense-in-depth and removes any chance of an unhashed PII payload leaving our infra.
- Add the 3 Vault entries (meta_pixel_id, meta_capi_access_token, meta_capi_test_event_code) before Session 4 starts.

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

## Payout rails: Stripe Connect Express, not PayPal

Session 7 (creator payouts) was originally scoped against PayPal Mass Pay API. That has been pivoted to Stripe Connect Express because PayPal Live Payouts was Denied for Kevin's account on May 6, 2026.

Implications for Session 4 (signup funnel) — what changes:

- **Onboarding step 2 ("payout destination")** no longer collects PayPal email or Venmo handle. Instead, redirects the new member to a Stripe Connect Express onboarding flow (~2 min hosted by Stripe; collects KYC + bank account or debit card)
- After Connect onboarding completes, Stripe redirects back to `/onboarding/profile` with a `stripe_connect_account_id` to save on the momfluencer row
- DB schema: replace `payout_method` (paypal|venmo) and `payout_destination` with a single `stripe_connect_account_id` (text, nullable until onboarding complete)
- Vault entries to add for Session 7 (NOT Session 4): `stripe_connect_client_id` (the Connect platform's published client ID, used by Express onboarding redirect URLs)

What does NOT change:
- Stripe Checkout for inbound $5/mo membership payments — same plan
- Meta pixel + CAPI implementation — same plan
- $50 minimum payout threshold, 1st-and-15th auto-disbursement schedule — same plan (just runs on Stripe Connect transfers instead of PayPal Mass Pay)

## References

- Meta CAPI docs: https://developers.facebook.com/docs/marketing-api/conversions-api
- Server Events parameters: https://developers.facebook.com/docs/marketing-api/conversions-api/parameters
- Event deduplication: https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events
