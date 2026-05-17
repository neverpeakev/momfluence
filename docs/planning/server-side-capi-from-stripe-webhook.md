# Scope: Server-side CAPI direct from Stripe webhook

**Status:** Planned. Not started.
**Drafted:** 2026-05-16 after Kelly's test conversion validated the funnel end-to-end.
**Owner:** Next session (Kevin / Claude).

---

## Why

Today our Meta Purchase event pipeline is:

```
/welcome page → fbq('trackSingle', v2, 'Purchase', {value, currency})
   ├─ Browser POST → www.facebook.com/tr/?id=...&ev=Purchase   (always)
   └─ Browser POST → capig.momfluence.app/events/{hash}        (parallel, Stape forwards to Meta CAPI)
```

Two weak points:

1. **EMQ stuck at 6.1/10** ("Update recommended" warning in Events Manager Overview).
   The browser-side event carries only `_fbp` + page URL — no hashed email, no phone, no
   external_id. Match quality plateaus there. Real EMQ wins come from server-side CAPI events
   enriched with `em` (hashed email), `ph` (hashed phone), `external_id` (customer id),
   `client_ip_address`, `client_user_agent`.

2. **Single point of failure on Stape uptime.** If Stape's edge ever 503s for real users
   (Cloudflare bot-detection or actual outage), we lose the dedupe path and the algo trains
   on browser-only signal. We confirmed Stape was healthy 2026-05-16, but adding a redundant
   first-party CAPI path means we don't *depend* on Stape for value events.

The win: add a third path that fires server-side from our own Stripe webhook handler — same
Meta CAPI endpoint Stape forwards to, deduped via `event_id`. Browser pixel + Stape CAPIG +
our direct CAPI all land in Meta with the same event_id; Meta dedupes; we keep the highest-EMQ
copy.

## What

Add a server-side CAPI call to the Stripe webhook handler when a `customer.subscription.created`
(or `checkout.session.completed`) event arrives. Hash user data and POST to Meta's Conversions
API directly using `META_MARKETING_API_TOKEN` (already in Vercel env).

### Files in scope

- `app/api/stripe/webhook/route.ts` — find the existing handler that creates the `momfluencers`
  row. After successful subscription creation, fire a Purchase event to Meta CAPI.
- `lib/meta-capi.ts` (NEW) — small helper that POSTs to
  `https://graph.facebook.com/v20.0/{pixel_id}/events` with the right schema. Pixel ID is
  `1468831514190648` (v2 primary; same one `lib/meta-pixel.ts` uses).
- `lib/meta-pixel.ts` — modify `fireMetaPurchase()` so the browser side accepts an `event_id`
  param (currently it doesn't pass one). The webhook generates a deterministic event_id (e.g.
  `purchase_{stripe_subscription_id}`) and the browser fires with the same id from `/welcome`.
  Meta dedupes on `event_id` within 24h.

### Event schema

```ts
POST https://graph.facebook.com/v20.0/1468831514190648/events?access_token=...
{
  "data": [{
    "event_name": "Purchase",
    "event_time": <unix_seconds_from_stripe_event>,
    "event_id": "purchase_sub_xxxxxxx",        // same id the browser pixel fires with
    "event_source_url": "https://momfluence.app/welcome",
    "action_source": "website",
    "user_data": {
      "em": sha256(lowercase_trim(email)),
      "external_id": sha256(stripe_customer_id),
      "client_ip_address": <from stripe event or request>,
      "client_user_agent": <from stripe event metadata if available>,
      "fbp": <stored on /signup, persisted with sub metadata>,    // see Phase 2 below
      "fbc": <same>
    },
    "custom_data": {
      "currency": "USD",
      "value": 5.00,
      "content_type": "product",
      "content_name": "MomFluence Membership",
      "content_category": "Subscription"
    }
  }]
}
```

Use `sha256` from `node:crypto`. Lowercase + trim email before hashing per Meta's spec.

### Browser-side change

In `lib/meta-pixel.ts`, change:

```ts
export function fireMetaPurchase(value: number, currency = "USD"): void { ... }
```

to accept an event_id:

```ts
export function fireMetaPurchase(value: number, currency = "USD", eventId?: string): void {
  fireMetaEvent("Purchase", {
    value, currency,
    content_type: "product",
    content_name: "MomFluence Membership",
    content_category: "Subscription"
  }, eventId);
}
```

And in `fireMetaEvent`, pass eventID to fbq via the 5th arg:
```ts
window.fbq("trackSingle", V2_PIXEL_ID, eventName, data || {}, { eventID: eventId });
```

`/welcome` (`WelcomeInner.tsx`) reads `session_id` from the URL. To deterministically share the
event_id between browser and server, we need the Stripe **subscription id** at /welcome.
Either:

- (a) `success_url` in `app/api/checkout/create/route.ts` already passes `session_id={CHECKOUT_SESSION_ID}`.
  Inside the /welcome page, hit a small `/api/checkout/session/[id]` lookup that returns the
  subscription id from the Stripe session. Then derive `event_id = "purchase_" + subscription_id`.
  Slight UX cost: one extra request before fbq fires.
- (b) Easier: use the **Checkout Session id** itself as the event_id seed:
  `event_id = "purchase_" + session_id`. The server-side webhook ALSO has access to the
  session_id via the subscription's `latest_invoice` or by lookup. No /welcome round-trip.
  **Pick (b).**

## Phase 2 (optional, defer until needed)

To pass `fbp` / `fbc` cookies in the server-side CAPI event for maximum EMQ:

1. `LPVisitTracker` already writes `mf_lp` / `mf_creative` cookies. Add `mf_fbp` and `mf_fbc`
   alongside, read from `document.cookie` (the `_fbp` / `_fbc` cookies that fbevents.js sets).
2. `/api/checkout/create` reads those cookies from the request and passes them as Stripe Checkout
   `metadata.fbp` / `metadata.fbc`.
3. The webhook reads them from subscription/session metadata and forwards them in `user_data`.

Phase 1 ships without fbp/fbc — still a big EMQ win because of email + external_id.

## Acceptance criteria

- [ ] New PR with `lib/meta-capi.ts` + webhook update + browser event_id support
- [ ] Manual end-to-end test: complete a $5 signup (test card), verify in Events Manager
      Test Events tab that the same Purchase event shows TWO rows — "Browser" AND
      "Conversions API" — with matching event_id (and same `eid` parameter)
- [ ] EMQ for Purchase climbs from N/A → 7.0+ within 24h
- [ ] No double-counting: confirm Funnel Lab admin dashboard still reads 1 conversion per signup,
      not 2 (only Stripe webhook writes the row; CAPI is a side-effect)
- [ ] Webhook errors do NOT block signup completion — wrap CAPI POST in try/catch with
      `console.error` only; the row should still get written even if Meta CAPI is down

## Risk / non-goals

- Don't try to deprecate Stape CAPIG — keep all three paths (browser + Stape + direct CAPI).
  Meta dedupes; redundancy is a feature.
- Don't add CAPI for non-value events (PageView, SignupStarted) in this PR — those are fine
  via browser pixel + Stape. Scope creep risk.
- Don't change Pixel script source from `connect.facebook.net` — that was the rabbit hole
  in PRs #32 → #33.

## Pre-work before starting

1. Confirm Stripe webhook secret is set in Vercel env (`STRIPE_WEBHOOK_SECRET`).
2. Confirm `META_MARKETING_API_TOKEN` scope includes `ads_management` (needed for CAPI).
3. Read `app/api/stripe/webhook/route.ts` first — the current logic that writes
   `momfluencers` row is the integration point. Don't rewrite it; just add a hook after
   successful row write.

## Estimated effort

- Phase 1 (email + external_id only): **45-60 min** including manual test
- Phase 2 (fbp/fbc cookies): +30 min if needed later
