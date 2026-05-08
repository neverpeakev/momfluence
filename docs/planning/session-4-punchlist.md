# Session 4 — Punchlist (Marketing pages + Signup funnel)

Generated from May 7, 2026 site audit. Granular task list to bring momfluence.app to paid-traffic-ready state.

## Phase 1: Marketing pages (block paid traffic)

- [ ] Create `app/for-influencers/page.tsx` — long-form landing page targeting moms (the primary CTA destination from homepage). Reference v1 content at `~/momfluence-recovered/marketing/for-influencers.html` for structural inspiration; rewrite copy for v2 (drop "local," adopt "curated, hand-picked, pre-vetted").
- [ ] Create `app/privacy/page.tsx` — Privacy Policy. Required by Meta Ads policy. Use a standard template tailored to MomFluence's data collection (email, payment, IP, click events). Forward-reference per Stripe Customer Portal config.
- [ ] Create `app/terms/page.tsx` — Terms of Service. Required by Meta Ads policy. Standard SaaS template with member rights, payment terms, content guidelines, dispute resolution.
- [ ] Create `app/pricing/page.tsx` — single $5/mo plan with feature comparison vs joining each affiliate program individually. Anchor the value proposition.
- [ ] Create `app/how-it-works/page.tsx` — funnel diagnostic + trust builder. Three steps: browse → share → earn.
- [ ] Add a global `<Footer />` component with links to: Privacy, Terms, Pricing, How it works, Contact (mailto:hello@momfluence.app), social (FB page, Instagram).
- [ ] Add a global `<Header />` component with: logo, primary nav (How it works, Pricing, FAQ), Sign in button, primary CTA "Join $5/mo".
- [ ] Update `app/page.tsx` "Get paid NET-30" card: replace "PayPal, Venmo, ACH" with "Direct deposit via Stripe" (matches Stripe Connect Express).

## Phase 2: Tracking installation (block paid traffic ROI measurement)

- [ ] Install Meta pixel script in `app/layout.tsx` using Next.js `<Script strategy="afterInteractive">`. Initialize all 3 pixels (1468831514190648 + 1407633647209853 + 764587569626622). Fire `track('PageView')`.
- [ ] Add `NEXT_PUBLIC_META_PIXEL = 1468831514190648` to Vercel env vars (production + preview + development scopes).
- [ ] Verify all 3 pixels fire on PageView via Meta Pixel Helper (Chrome extension) on staging deploy before going live.
- [ ] Verify Stape CAPIG is receiving events — check Stape dashboard event count goes non-zero after pixel install.

## Phase 3: Signup funnel (block actual conversion)

- [ ] Auth migration: replace magic link in `/login` with email + password.
- [ ] Build `app/api/checkout/create/route.ts` — creates Stripe Checkout Session for `STRIPE_PRICE_ID_MEMBERSHIP` (price_1TUVt2ANPjxV4rVaQ4hgCXvr). Use `success_url: 'https://momfluence.app/welcome?session_id={CHECKOUT_SESSION_ID}'`, `cancel_url: 'https://momfluence.app/?cancelled=true'`.
- [ ] Build `app/api/stripe/webhook/route.ts` — handle `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`. Capture webhook signing secret to Vault.
- [ ] Build `app/welcome/page.tsx` — post-checkout success page. Fire Purchase event via `fbq('trackSingle', '1468831514190648', 'Purchase', { value: 5.00, currency: 'USD', content_type: 'product', ... })`. ONLY fire on first-time payment; check Stripe customer hasn't paid before.
- [ ] Add CTA buttons across the marketing pages that all hit POST /api/checkout/create.

## Phase 4: Polish (improve conversion rate)

- [ ] Apple Pay verification file: drop `apple-developer-merchantid-domain-association` Stripe gives in `public/.well-known/`. Required for Apple Pay registration to verify.
- [ ] Mobile responsive QA: test homepage, /for-influencers, /pricing on iPhone 13/14/15 viewport sizes (390x844, 393x852).
- [ ] OG image / Twitter card meta tags on all marketing pages — for sharing previews.
- [ ] Sitemap.xml + robots.txt for SEO basics.
- [ ] Optional: 1-2 visual elements (hero image, brand logos as social proof for "hand-picked brands" claim).

## Acceptance criteria for paid traffic launch

Before sending a single $1 of Meta Ads budget:
- [ ] All marketing pages return 200, no 404s in the funnel
- [ ] All 3 Meta pixels fire on PageView (verify with Meta Pixel Helper)
- [ ] Stape CAPIG event count is non-zero
- [ ] One full signup test: landing → /for-influencers → click "Join $5/mo" → Stripe Checkout (test mode first, then live) → /welcome → Purchase event fires browser-side AND server-side via Stape
- [ ] Privacy and Terms pages exist and link from footer
- [ ] Mobile responsive on iPhone-class viewport
- [ ] Footer + header present on every page
