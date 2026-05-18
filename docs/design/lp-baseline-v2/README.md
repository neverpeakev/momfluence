# docs/design/lp-baseline-v2/

Visual handoff package for the LP Baseline v2 below-the-fold template (PR #41 follow-up).
Snapshot: 2026-05-18.

## TL;DR for eng
- Anchored to `components/landing/LPBaseline.tsx` + `components/landing/sections/Section*.tsx` (PR #41, commit 31a9899).
- Open `index.html` locally — it's a hi-fi, annotated, mobile-first prototype with a live Tweaks panel.
- Each `sections/Section*.jsx` here maps 1:1 to the matching `Section*.tsx` in the app.
- New sections to scaffold:
  - `SectionEarningsCalculator.tsx` (PR #43) — see `sections/Section3_5EarningsCalculator.jsx`
  - `SectionComparison.tsx` — see `sections/Section5_5Comparison.jsx`
  - Add `LP_SECTION_EVENTS.EarningsCalc` + `LP_SECTION_EVENTS.Comparison` to `lib/funnel-lab/lp-events.ts`
- §7 Pricing — **Variant C only** ships (Variant B parked 2026-05-18). Wiring in `SectionPricingABTest.tsx` + `lib/funnel-lab/pricing-variants.ts` stays intact for one-line reactivation.

## Files
- `index.html` — prototype root
- `app.jsx` — orchestrator (mirrors `LPBaseline.tsx`)
- `styles.css` — annotations + scroll-reveal + FAQ + density modes
- `tweaks-panel.jsx` — review-time controls (hero comp · voice · type · density)
- `lib/core.jsx` — shared primitives (Section, Reveal, AnnoSpec, EarningsDisclaimer, AssetSlot)
- `lib/data.js` — mirror of `brand-wall-data.ts` + channels + FAQs (do NOT edit copy here; update the React source)
- `sections/Section0Hero.jsx` — variant-specific hero (context only, lives at `app/lp/[variant]/page.tsx`)
- `sections/Section1HowItWorks.jsx` … `Section9ClosingCTA.jsx` — one file per LP section
- `asset-spec.html` — five asset classes with paths, dims, callout briefs
- `tokens.html` — Tailwind class chains + states + grid math + animation timing + FTC + funnel-lab events

## Asset slots to fill
- `/public/lp-baseline/logos/<slug>.svg` — 22 brand SVGs (slugs in `lib/landing/brand-wall-data.ts`)
- `/public/lp-baseline/dashboard/{brand-picker,link-generator,earnings,cashout}.png` — 4 annotated screenshots
- `/public/lp-baseline/channels/<slug>.svg` — 8 channel illustrations (progressive enhancement — emoji ships v1)
- `/public/lp-baseline/diagrams/affiliate-circuit.lottie.json` — §2 animated diagram
- `/public/lp-baseline/founders/{kevin,kelly}.jpg` — Phase 1 photos
- `/public/lp-baseline/moms/mom-{1..5}.jpg` — Phase 2 (T+14d)

## Voice lock v6
Every copy string in `sections/` mirrors PR #41 verbatim. Do not rewrite. Surface any wording concern to design before editing.
