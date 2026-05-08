# MomFluence v2 — Stripe Setup Status

**Captured:** 2026-05-07
**Mode:** livemode (production)
**Verified via:** Stripe MCP (`claude.ai Stripe`)

## Account verification

- **Account ID:** `acct_1KvEkEANPjxV4rVa`
- **Display name:** Neverpeakmarketing
- **Email match:** kevin@neverpeakmarketing.com ✓
- **Confirmed:** This is the correct Never Peak / MomFluence account, not one of Kevin's other Stripe accounts.

## Pre-existing state (before this session)

Clean slate on the live account:

- Products: 0
- Prices: 0
- Subscriptions: 0 (any status)
- Available balance: $0.00 USD
- Pending balance: $0.00 USD

Consistent with v1 having processed payments through PayPal (not Stripe). v2 is the first time Stripe will be used for inbound payments.

## Created in this session

### Product

- **ID:** `prod_UTSoRC6ZHFObLw`
- **Name:** MomFluence Membership
- **Description:** Monthly access to the MomFluence curated affiliate catalog. Includes pre-approved offers across multiple networks, tracking links, performance dashboard, and creator payouts.
- **Type:** service
- **Active:** true
- **Livemode:** true

### Price

- **ID:** `price_1TUVt2ANPjxV4rVaQ4hgCXvr`
- **Product:** `prod_UTSoRC6ZHFObLw`
- **Unit amount:** 500 cents ($5.00)
- **Currency:** USD
- **Recurring:** monthly (interval=month, interval_count=1)
- **Billing scheme:** per_unit
- **Tax behavior:** unspecified (Kevin: review whether to set this to `inclusive` or `exclusive` once tax registration decisions are made)
- **Active:** true
- **Livemode:** true

This is the price ID Session 4's Stripe Checkout flow will reference. Add to Vault as `stripe_membership_price_id` before Session 4 launch.

## Items NOT verifiable via MCP (Kevin must check in dashboard)

The connected Stripe MCP tool surface does not expose Connect, Customer Portal, or payment method settings. Verify the following manually before Session 4:

### 1. Stripe Connect Express enablement — ⛔ DEFERRED indefinitely (May 8, 2026)

Kevin opted out of Stripe Connect Express activation for v2 launch. Manual payout model with deferred setup + instant-payout token perk adopted instead (see `docs/planning/session-4-punchlist.md` Phase 5). Connect activation can be revisited if/when launch volume justifies automated payouts.

Original plan preserved for audit trail:
- Dashboard path: https://dashboard.stripe.com/settings/connect
- Was to enable: Connect platform, Express account type, branding, capture `stripe_connect_client_id` for Vault
- Was the rail for Session 7 creator payouts (replacing the denied PayPal Live Payouts plan).

### 2. Customer Portal configuration

- Dashboard path: https://dashboard.stripe.com/settings/billing/portal
- Need to confirm:
  - Portal is activated for live mode
  - Allowed actions: update payment method, cancel subscription, view invoices
  - Cancel-subscription behavior: cancel at period end (recommended) vs. immediately
  - Branding matches Connect branding
  - Return URL is set to a v2 platform URL (placeholder fine for now; Session 4 will overwrite with `https://momfluence.app/settings/billing` once DNS cuts over)

### 3. Payment method coverage

- Dashboard path: https://dashboard.stripe.com/settings/payment_methods
- Per Session 4 requirements, enable in live mode:
  - Card (Visa/MC/Amex) — default, should already be on
  - Apple Pay — domain verification required (Session 4 will add the `.well-known/apple-developer-merchantid-domain-association` file when DNS cuts over)
  - Google Pay — typically auto-enabled when Card is on
  - Link — Stripe's saved-payment-method product; one-click enable
  - PayPal — requires Stripe→PayPal merchant connect (a few clicks, no API needed)
  - Klarna — region-restricted; enable for US only

### 4. Webhook endpoints

Not yet configured. Session 4 will create:

- `POST /api/stripe/webhook` on momfluence-platform.vercel.app
- Events to subscribe to:
  - `checkout.session.completed` (fires Meta CAPI Purchase event for first-time buyers; provisions membership)
  - `customer.subscription.created`
  - `customer.subscription.deleted`
  - `customer.subscription.updated`
  - `invoice.paid` (renewal — does NOT trigger Meta CAPI per session-4-meta-tracking.md)
  - `invoice.payment_failed`
- Webhook signing secret will land in Vault as `stripe_webhook_secret`.

### 5. Tax settings

- Dashboard path: https://dashboard.stripe.com/settings/tax
- Decision pending: enable Stripe Tax automatic collection, or skip for v2 launch?
- $5/mo unit price × low expected volume → tax burden likely below registration thresholds in most US states for the first months. Defer Stripe Tax decision until cohort sizes warrant. If deferred, set price `tax_behavior` to `inclusive` so the listed price is what the customer pays.

## Vault entries to add before Session 4

- `stripe_publishable_key` (live `pk_live_...`)
- `stripe_secret_key` (live `sk_live_...`)
- `stripe_webhook_secret` (created when webhook endpoint is configured)
- `stripe_membership_price_id` = `price_1TUVt2ANPjxV4rVaQ4hgCXvr`
- `stripe_membership_product_id` = `prod_UTSoRC6ZHFObLw` (less critical; Price ID is what Checkout references)
- `stripe_connect_client_id` (Session 7 prerequisite, but capture now while in dashboard)

## Outstanding Kevin tasks before Session 4

1. Enable Connect Express in dashboard; capture `stripe_connect_client_id`
2. Activate Customer Portal in live mode; configure cancel-at-period-end behavior
3. Enable payment methods (Card already on; add Apple Pay, Google Pay, Link, PayPal, Klarna)
4. Decide on Stripe Tax (defer recommended for v2 launch)
5. Add the 6 Vault entries listed above
6. Sanity-check the new product in dashboard: https://dashboard.stripe.com/products/prod_UTSoRC6ZHFObLw

## Summary

| Item | Status |
|---|---|
| Account identity verified | ✓ Neverpeakmarketing (correct account) |
| Live $5/mo Product created | ✓ `prod_UTSoRC6ZHFObLw` |
| Live $5/mo Price created | ✓ `price_1TUVt2ANPjxV4rVaQ4hgCXvr` |
| Connect Express enabled | ⛔ DEFERRED indefinitely (Kevin opted out for v2 launch — manual payout model adopted instead) |
| Customer Portal configured | ✓ bpc_1TUsmZANPjxV4rVar9d9HTcM (May 8, 2026) |
| Payment methods enabled | ✓ pmc_1RdyMnANPjxV4rVatIeIt1Vg (Card, Apple Pay, Cash App Pay, Link, Bancontact, EPS, Google Pay, Klarna, Affirm) |
| Apple Pay domains registered | ✓ momfluence.app (pmd_1TUfvmANPjxV4rVaLpM3pJRl) + checkout.momfluence.app (pmd_1TUfvyANPjxV4rVaAe9urcqA) |
| Custom Domain stability check | ✓ Active (checkout.momfluence.app) |
| Webhook endpoint configured | ⏳ Session 4 |
| Vault entries seeded | ⏳ Kevin to add 6 entries |

## Custom Domain (added May 7, 2026)

Stripe Custom Domains feature ($10/mo) enabled. Checkout renders at `checkout.momfluence.app` instead of `checkout.stripe.com`.

**Status:** ✅ ACTIVE as of May 7, 2026 evening. Stability check completed. `checkout.momfluence.app` is now Active for Checkout, Payment Links, AND Customer Portal endpoints (validated via dashboard).

**Implications:**
- All Checkout sessions automatically use `checkout.momfluence.app` (account-level setting, no per-session config)
- Customer Portal links use the same custom domain
- Email receipts use the custom domain
- Cleaner Meta pixel tracking (no cross-domain attribution loss between momfluence.app → checkout.momfluence.app → momfluence.app/welcome)

**Outstanding (deferred, not blocking Session 4):**
- ~~Once stability check passes, verify checkout.momfluence.app actually resolves and serves Stripe Checkout~~ **DONE — Active May 7, 2026 evening, validated via dashboard for Checkout + Payment Links + Customer Portal endpoints.**
- Consider setting up a separate subdomain for Stripe Connect Express onboarding flow (Session 7) — likely `connect.momfluence.app` if Stripe supports a 2nd custom domain or via Stripe-hosted with custom branding only

## Customer Portal configuration ✅ DONE May 8, 2026

**Configuration ID for Session 6 reference:** `bpc_1TUsmZANPjxV4rVar9d9HTcM`

**Default return URL:** `https://momfluence.app/dashboard`
**Portal hosted at:** `checkout.momfluence.app/p/...` (Custom Domain Active per May 7, 2026 confirmation)

Settings configured per the spec below (mirrored exactly from the requirements). This is now the account default — `/api/stripe/portal-session` in Session 6 will use it automatically when no `configuration` param is passed.

---

**Original spec (preserved for audit trail; MCP was blocked, dashboard completion happened May 8, 2026):**

The Stripe MCP's `stripe_api_execute` tool surface does not include the `/v1/billing_portal/configurations` endpoints (read or write). These admin/configuration endpoints are scoped out of the MCP, so Kevin completed configuration manually via the Stripe Dashboard.

**Dashboard path:** https://dashboard.stripe.com/settings/billing/portal

**Required settings (mirror these exactly when configuring in dashboard):**

- **Business profile:**
  - Headline: `Manage your MomFluence membership`
  - Privacy policy URL: `https://momfluence.app/privacy` (page doesn't exist yet — Stripe accepts forward-references)
  - Terms of service URL: `https://momfluence.app/terms` (page doesn't exist yet — same)
  - If Stripe rejects unreachable URLs at save time, omit both URL fields and add a note for Session 6 prep to revisit.
- **Customer information** (`customer_update`): allow updates to **email**, **address**, **phone**, **tax_id**
- **Invoice history**: ENABLED
- **Payment methods**: ENABLED (customers can update their default payment method)
- **Subscription cancellation** (`subscription_cancel`):
  - ENABLED
  - Mode: **Cancel at period end** (`at_period_end`) — member retains access until end of paid period
  - Proration behavior: **None**
  - Capture cancellation reason: ENABLED
  - Reason options: `too_expensive`, `missing_features`, `switched_service`, `unused`, `customer_service`, `too_complex`, `low_quality`, `other`
- **Subscription pause** (`subscription_pause`): DISABLED — no pause feature for v2 launch
- **Subscription update / plan switching** (`subscription_update`): DISABLED — we only have one plan
- **Default return URL**: `https://momfluence.app/dashboard`
- **Set as account default**: YES (this config will be used by `/api/stripe/portal-session` in Session 6)

After configuring in dashboard, capture the configuration ID (`bpc_xxx`) here for Session 6 reference.

## Payment methods at Checkout (May 7, 2026 — blocked at MCP, must be done via Dashboard)

**MCP automation attempted, blocked.** The Stripe MCP's `stripe_api_execute` tool surface does not include the `/v1/payment_method_configurations` or `/v1/apple_pay/domains` endpoints. Kevin must enable payment methods manually via the Stripe Dashboard.

**Dashboard path:** https://dashboard.stripe.com/settings/payment_methods

**Target state — enable in live mode:**

| Method | Action | Notes / Dashboard sub-path |
|---|---|---|
| Card | Verify on (default) | Should already be enabled — confirm only |
| Apple Pay | Enable + register domain | https://dashboard.stripe.com/settings/payment_methods/apple_pay → register `momfluence.app` AND `checkout.momfluence.app`. Each requires uploading the `.well-known/apple-developer-merchantid-domain-association` file Stripe provides. May need to wait for Custom Domain stability check to complete before `checkout.momfluence.app` can be registered. |
| Google Pay | Verify on | Typically auto-enabled when Card is on; no separate action needed |
| Link | Enable | One-click toggle in Dashboard payment methods page |
| Klarna | Enable | One-click toggle; region-restricted to US — confirm enabled for US only |
| PayPal | Enable + connect | Requires Stripe→PayPal merchant account connect via OAuth (a few clicks). Note: this is PayPal-as-Checkout-payment-method, NOT for outbound creator payouts (those are blocked by PayPal's denial of Live Payouts and have been pivoted to Stripe Connect Express for Session 7). |

After enabling, return to this doc and update the table with confirmed states.

### ✅ COMPLETED via dashboard May 7, 2026 (evening)

**Payment Method Configuration:** `pmc_1RdyMnANPjxV4rVatIeIt1Vg` (the "Your account" config). This is the active config for Checkout / Payment Intents on this account.

Two other Payment Method Configurations exist on the account but are SCOPED to other integrations and should be ignored for v2 Checkout work:
- `pmc_1NvO4vANPjxV4rVaKhyVwDK5` — FreshBooks integration config
- `pmc_1TUeO8ANPjxV4rVahMo3XZQx` — Meta Conversions App config

**Methods enabled in `pmc_1RdyMnANPjxV4rVatIeIt1Vg`:** Cards, Apple Pay, Cash App Pay, Link, Bancontact, EPS, Google Pay, Klarna, Affirm.

Notes vs. original target:
- **Cash App Pay, Bancontact, EPS, Affirm** are bonus methods Kevin enabled beyond the original Session 4 target list (Card, Apple Pay, Google Pay, Link, Klarna, PayPal). Bancontact + EPS are EU-region methods — useful if any EU traffic comes in, no harm if it doesn't. Cash App Pay + Affirm broaden BNPL coverage.
- **PayPal-as-Checkout-payment-method** is NOT in this list — confirm whether it was intentionally skipped or needs follow-up. Defer decision; not blocking for Session 4 launch.

**Apple Pay domain registrations (both Enabled):**
- `momfluence.app` — Domain ID `pmd_1TUfvmANPjxV4rVaLpM3pJRl`
- `checkout.momfluence.app` — Domain ID `pmd_1TUfvyANPjxV4rVaAe9urcqA`

This unblocks Apple Pay on both the marketing-page CTAs (momfluence.app) and the Stripe Checkout flow (checkout.momfluence.app). The `.well-known/apple-developer-merchantid-domain-association` file Stripe generated is hosted automatically by Stripe for Custom-Domain-served pages — no manual `public/.well-known/` upload needed for the Checkout subdomain. Confirm whether the apex (momfluence.app) needs the file dropped in `public/.well-known/` for Vercel to serve, or if Stripe handles that too. (Test on staging deploy of Session 4.)

## Outstanding Kevin tasks (post-MCP automation, May 7, 2026)

These items were attempted via MCP but blocked because the Stripe MCP scope excludes admin/configuration endpoints. Status as of May 7, 2026 evening:

1. ~~**Payment methods activation**~~ ✅ **DONE** — `pmc_1RdyMnANPjxV4rVatIeIt1Vg` with Card, Apple Pay, Cash App Pay, Link, Bancontact, EPS, Google Pay, Klarna, Affirm.
2. ~~**Apple Pay domain registration**~~ ✅ **DONE** — both `momfluence.app` (`pmd_1TUfvmANPjxV4rVaLpM3pJRl`) and `checkout.momfluence.app` (`pmd_1TUfvyANPjxV4rVaAe9urcqA`) Enabled.
3. ~~**Customer Portal configuration**~~ ✅ **DONE May 8, 2026** — `bpc_1TUsmZANPjxV4rVar9d9HTcM`, set as account default, hosted at `checkout.momfluence.app/p/...`.
4. ⛔ ~~**Connect Express enablement**~~ **DEFERRED indefinitely** — Kevin opted out of Stripe Connect Express activation for v2 launch. Manual payout model with deferred setup + instant-payout token perk adopted instead. Connect activation can be revisited if/when launch volume justifies automated payouts. See `docs/planning/session-4-punchlist.md` Phase 5 for the manual payout model.

**Vercel canonical domain swap** — separately blocked because the Vercel CLI is not installed locally:
- Dashboard: Project → Settings → Domains
- Action: uncheck "Redirect to this domain" on `momfluence.app`; check it on `www.momfluence.app` with target `momfluence.app`
- After: `momfluence.app` → 200 OK, `www.momfluence.app` → 308 to apex
- Optional: install Vercel CLI (`npm i -g vercel`) to unlock future automation
