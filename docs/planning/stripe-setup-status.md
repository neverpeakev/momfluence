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

### 1. Stripe Connect Express enablement

- Dashboard path: https://dashboard.stripe.com/settings/connect
- Need to confirm:
  - Connect platform is enabled
  - Express account type is enabled (not Standard or Custom)
  - Branding (logo, business name, support email) is set on the Connect onboarding flow
  - `stripe_connect_client_id` (the platform's published client ID for OAuth/onboarding redirect URLs) is captured for Vault
- This is the rail Session 7 will use for creator payouts (replacing the denied PayPal Live Payouts plan).

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
| Connect Express enabled | ⏳ Kevin to verify in dashboard |
| Customer Portal configured | ⏳ Kevin to verify in dashboard |
| Payment methods enabled | ⏳ Kevin to verify in dashboard |
| Webhook endpoint configured | ⏳ Session 4 |
| Vault entries seeded | ⏳ Kevin to add 6 entries |
