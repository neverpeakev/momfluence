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
- [ ] Build `app/api/stripe/webhook/route.ts` — handle `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`. On `checkout.session.completed`, create momfluencer row with status='active', membership_status='active', payout_status='not_setup', signup_at=now(). Capture webhook signing secret to Vault.
- [ ] Build `app/welcome/page.tsx` — post-checkout success page. Fire Purchase event via `fbq('trackSingle', '1468831514190648', 'Purchase', { value: 5.00, currency: 'USD', content_type: 'product', ... })`. ONLY fire on first-time payment.
- [ ] Build `app/onboarding/profile/page.tsx` — simple profile completion (display name required, bio optional, avatar optional). Submit → redirect to /dashboard. NO payout collection here.
- [ ] Add CTA buttons across the marketing pages that all hit POST /api/checkout/create.

## Phase 4: Polish (improve conversion rate)

- [ ] Apple Pay verification file: drop `apple-developer-merchantid-domain-association` Stripe gives in `public/.well-known/`. Required for Apple Pay registration to verify.
- [ ] Mobile responsive QA: test homepage, /for-influencers, /pricing on iPhone 13/14/15 viewport sizes (390x844, 393x852).
- [ ] OG image / Twitter card meta tags on all marketing pages — for sharing previews.
- [ ] Sitemap.xml + robots.txt for SEO basics.
- [ ] Optional: 1-2 visual elements (hero image, brand logos as social proof for "hand-picked brands" claim).

## Phase 5: Manual payout infrastructure (deferred setup + instant-payout perk)

### Schema additions

- [ ] DB migration: add columns to `momfluencers` table:
  - `signup_at` timestamp not null (used for 30-day cap window + 90-day instant-token expiry)
  - `payout_status` enum('not_setup', 'setup_complete', 'w9_required', 'w9_complete') default 'not_setup'
  - `payout_method` enum('paypal', 'venmo', 'bank', 'other') nullable
  - `payout_paypal_email` text nullable
  - `payout_venmo_handle` text nullable
  - `payout_venmo_phone` text nullable
  - `payout_notes` text nullable (for "skip for now" with optional comment)
  - `cumulative_earnings_cents` integer default 0 (running total for 1099 threshold tracking)
  - `instant_payout_used_at` timestamp nullable (NULL = token still available; not-null = used)
- [ ] DB migration: create `payout_requests` table:
  - id uuid PK
  - momfluencer_id FK
  - amount_cents integer
  - request_type enum('standard', 'instant') default 'standard'
  - status enum('pending', 'approved', 'paid', 'rejected') default 'pending'
  - requested_at timestamp default now()
  - paid_at timestamp nullable
  - paid_via_method text nullable (audit trail of how Kevin actually paid: 'paypal' | 'venmo' | 'other')
  - paid_via_reference text nullable (PayPal txn ID, Venmo confirmation, etc.)
  - admin_notes text nullable
  - rejection_reason text nullable
- [ ] DB migration: create `w9_records` table:
  - id uuid PK
  - momfluencer_id FK UNIQUE
  - legal_name text not null
  - address_line1 text not null
  - address_line2 text nullable
  - city, state, zip not null
  - tin_type enum('ssn', 'ein') not null
  - tin_last4 text not null (only store last 4 — full TIN in encrypted Vault if needed for actual filing)
  - signed_at timestamp not null
  - signature_data text not null (base64-encoded canvas signature)
- [ ] All new tables get RLS policies following the standard pattern (member can read/write own rows; admin bypass via `auth.users.raw_app_meta_data->>'role' = 'admin'`).

### UX builds

- [ ] Build `app/dashboard/payout-setup/page.tsx` — multi-section form, payout-method-agnostic:
  - Section 1: Method choice (PayPal | Venmo | Bank coming soon | Skip for now)
  - Section 2 (conditional on choice): collect minimum fields per method
    - PayPal: email
    - Venmo: handle + phone
    - Bank: "Bank ACH coming soon" stub, save as method='bank' with no details (acts like 'skip' for gating purposes)
    - Skip: optional reason note
  - Save updates momfluencer.payout_status='setup_complete' (or stays 'not_setup' if skip)

- [ ] Build `app/dashboard/withdraw/page.tsx` — request withdrawal flow:
  - Show available balance (cumulative approved earnings - already-paid-out amount)
  - Show "instant payout token" status if applicable: "🎉 You have 1 instant payout available — request as little as $25!" (only if signup_at within last 90 days AND instant_payout_used_at IS NULL)
  - Two modes:
    - **Standard mode** (always available if balance >= $50): max amount = full balance, no special caps
    - **Instant mode** (checkbox/toggle, only available if signup_at within 90 days AND instant_payout_used_at IS NULL): minimum $25, maximum $25 if days_since_signup < 30 (otherwise full balance up to instant cap), uses the lifetime token on submission
  - Gate: if payout_status != 'setup_complete', redirect to /dashboard/payout-setup
  - Gate: if cumulative_earnings_cents >= 60000 ($600) AND payout_status != 'w9_complete', redirect to /dashboard/w9
  - Submit creates payout_requests row with status='pending' and request_type='standard' or 'instant'
  - On 'instant' submit: also set momfluencer.instant_payout_used_at = now() (one-time burn)
  - Standard mode rate-limit: max 2 'pending' or 'paid' standard requests per calendar month (block submission with friendly error)
  - Submit triggers email notification to kevin@neverpeakmarketing.com AND catt@neverpeakmarketing.com

- [ ] Build `app/dashboard/w9/page.tsx` — W-9 collection form:
  - Legal name, address, TIN type (SSN or EIN), TIN last 4 (last 4 only stored in DB; full collected via secure form, written to Vault if needed for actual filing)
  - Canvas signature widget
  - Submit creates w9_records row, sets payout_status='w9_complete'
  - Triggered when withdrawal page detects cumulative_earnings_cents >= $600 and W-9 not on file

- [ ] Build `app/admin/payouts/page.tsx` — Kevin's manual payout fulfillment view:
  - List all payout_requests with status='pending', sorted by request_type='instant' first, then requested_at asc
  - For each: show momfluencer details (name, email, signup_at, cumulative_earnings_cents), payout method + destination, amount, request type badge ('Standard' or '⚡ Instant'), "Mark Paid" button, "Reject" button
  - "Mark Paid" form: paid_via_method, paid_via_reference, admin_notes → updates row to status='paid', paid_at=now()
  - "Reject" form: rejection_reason, admin_notes → updates row to status='rejected'

### Backend wiring

- [ ] Update earnings rollup logic (in click_redirect / sync functions): increment momfluencers.cumulative_earnings_cents on each approved conversion. CRITICAL: only on conversions reaching 'approved' status, not pending. Avoid race conditions via DB transaction.

- [ ] Email notification: build `lib/email/payout-request.ts` helper. On payout_requests insert with status='pending', send notification email to kevin@neverpeakmarketing.com + catt@neverpeakmarketing.com (CC). Email contains: member display name, member legal email, payout method + destination, amount, request type (Standard / Instant), link to /admin/payouts. Use Resend (resend.com) for email delivery — quick to set up. Vault entry: `resend_api_key`.

- [ ] Dashboard nav: add "Earnings" tab between "My Links" and "Profile". Inside Earnings tab: balance display, "Withdraw" CTA (gates on payout_status), instant-payout-token banner if eligible, W-9 prompt if cumulative >= $600 and W-9 not on file, table of past payout requests with status.

## Acceptance criteria for paid traffic launch

Before sending a single $1 of Meta Ads budget:
- [ ] All marketing pages return 200, no 404s in the funnel
- [ ] All 3 Meta pixels fire on PageView (verify with Meta Pixel Helper)
- [ ] Stape CAPIG event count is non-zero
- [ ] One full signup test: landing → /for-influencers → click "Join $5/mo" → Stripe Checkout (test mode first, then live) → /welcome → Purchase event fires browser-side AND server-side via Stape
- [ ] Privacy and Terms pages exist and link from footer
- [ ] Mobile responsive on iPhone-class viewport
- [ ] Footer + header present on every page
