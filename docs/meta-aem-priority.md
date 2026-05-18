# Meta Aggregated Event Measurement (AEM) — Recommended priority

**Last reviewed:** 2026-05-18 (after PR 3 — Meta event uplift shipped)
**Where it lives:** Events Manager → Datasets → MomFluence.App v2 → Settings → Aggregated Event Measurement
**Manual step:** updating this priority is **not** automatic. After every meaningful change to the events we fire, an admin must log in and confirm/re-order in Events Manager.

---

## Why this matters

Apple's iOS 14+ App Tracking Transparency limits how much conversion data Meta can attribute back to ads for users who don't opt in (which is most of them). To work around the limit, Meta only sends back data for the **highest-priority event the user triggered** during a conversion window. If your priority order is wrong, you measure the wrong thing.

For Momfluence the rule of thumb is: **priority should descend by funnel commitment**. The most-committed event (Purchase) gets the top slot; the least-committed (PageView) gets the bottom.

CAPI-only events bypass AEM entirely — they're full-fidelity server-side. The priority below applies to **browser pixel events**.

---

## Recommended priority (post-PR-3)

```
1. Purchase                  ← highest value, what we're optimizing campaigns for
2. InitiateCheckout          ← strongest pre-Purchase intent (clicks "Go to checkout")
3. AddToCart                 ← signup-form-engaged signal (PR 3, NEW)
4. CompleteRegistration      ← created an account
5. SignupStarted             ← custom event for top-of-funnel signup intent
6. ViewContent               ← landed on an LP and engaged (PR 3, NEW)
7. PageView                  ← lowest commitment (counted automatically by Pixel)
```

**Custom events** (LP_Section_View_HowItWorks, LP_FAQ_Opened, etc.) are NOT eligible for AEM slots. They're useful for our own analytics + audience-building but Meta's iOS-attributed conversion table only reports back on Standard events.

---

## How to update

1. Open https://eventsmanager.facebook.com/events_manager2/list/dataset/1468831514190648/aem
2. Sign in as an admin of the MomFluence Business Manager.
3. Drag events to match the order above. Save.
4. Wait ~24 hours for the new priority to propagate through Meta's pipeline.

---

## When to revisit

- **Adding a new Standard event to the codebase** — re-rank the new event's natural funnel position and update the order here.
- **Removing an event from production** — remove it from the priority and re-rank what's below it.
- **Major business model change** — if we ever monetize on a non-Purchase event (e.g. lead generation for one-off offers), the top slot may shift to Lead. Today it's Purchase.

---

## Background

- [Meta docs — Aggregated Event Measurement priority](https://www.facebook.com/business/help/3041534257305338)
- We use the v2 primary pixel (id `1468831514190648`). v1 legacy pixels (`1407633647209853`, `764587569626622`) still init in `app/layout.tsx` for audience signal preservation but no value events fire on them.
- Stape CAPIG forwards all browser events to Meta CAPI as a parallel server-side copy — that path is not subject to AEM (CAPI events get full fidelity by default).
- Direct CAPI from Stripe webhook (PR #36) also bypasses AEM for Purchase events specifically.
