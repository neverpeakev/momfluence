# MomFluence v2 — CTO Review Packet

**Repo:** https://github.com/neverpeakev/momfluence
**Current HEAD:** b02cf3c (Exclude supabase/functions from Next.js typecheck)
**Live URL for review: https://momfluence.app**

## TL;DR

MomFluence is a curated affiliate platform where mom-creators pay $5/mo for access to a hand-picked catalog of pre-approved affiliate offers, share tracking links, and earn commissions on conversions. This packet covers the v2 implementation built across Sessions 1-3 (Sept-May 2026), pending CTO review before soft launch and Session 4 (signup funnel work).

**Status:** Backend pipeline (offer ingestion, click redirect, sync of approvals/actions, postback, idempotency) is complete and running on cron. Three frontend sessions are complete: catalog + per-network sub-id wiring (Session 1), application flow + admin review (Session 2), agreements signature UI + dashboard gate (Session 3). All three were exercised end-to-end via a Chrome-driven automation harness. Soft launch is pending your sign-off; signups are not currently open and Kevin is the only active member.

---

## Pivot context: v1 → v2

This platform is the v2 implementation of MomFluence. v1 was a local two-sided marketplace concept (South Bay LA moms + local advertisers, static HTML signup site, March 2026) that was abandoned after 7 paying signups (all refunded) revealed the difficulty of two-sided local marketplace scaling.

v2 is a single-sided platform: curated nationally-available affiliate offers, $5/mo membership, mom-creators promote via tracking links and earn payouts. Skips the supply-side problem because Kevin has already secured 22 approved offers across multiple affiliate networks (Impact, FlexOffers, etc.).

The historical static HTML files for v1 are at `~/momfluence-recovered/marketing/` on Kevin's local machine, preserved for reference. Not in this repo.

See `docs/pivot-history.md` for full v1→v2 documentation including messaging guidelines.

---

## Architecture overview

**Stack:** Next.js 15 (App Router) + Supabase (Postgres + Auth + Edge Functions + Storage + Vault) + Stripe (Session 4) + Vercel hosting.

**Database (Supabase, project gndzxfrqfpszqocbsktn, Pro tier, us-east-1):**
- `momfluencers` — member records (user_id, status, membership_status, profile fields)
- `offers` — affiliate offer catalog (active, approved offers from Impact/FlexOffers/CJ/etc., with payouts and rules)
- `networks` — affiliate network adapters (per-network sub-id parameter mapping)
- `tracking_links` — short tokens that redirect to offers with sub-id injected
- `clicks` — click events
- `conversions` — postback-confirmed conversions tied back to clicks
- `offer_applications` — application-required offers (e.g., Sesame Care)
- `agreements` — versioned legal agreements (body_md is runtime source of truth)
- `signatures` — UNIQUE on (momfluencer_id, agreement_id), supports v2 versioning
- `payouts` (Session 7) — earnings rollups + payout disbursement records

**Row-Level Security (RLS):** enabled on every table. All policies follow the pattern "user can read/write their own rows; admin can do anything." Policy stack uses `auth.uid()` joined to `momfluencers.user_id`. Admin bypass via `auth.users.raw_app_meta_data->>'role' = 'admin'`.

**Edge Functions (Deno, deployed):**
- `click_redirect` — handles `/r/{token}` short links, logs click, redirects with sub-id injection
- `sync_impact_actions` — Impact Radius postback receiver
- `sync_flexoffers_sales` — FlexOffers daily sync
- `_shared/supabase.ts` + `_shared/sync-helpers.ts` — shared adapters with credential redaction (defense against prior leak history)

**Vault entries (by name only, never logged):**
- `impact_account_sid`, `impact_auth_token`, `impact_program_id`
- `flexoffers_api_key`, `flexoffers_advertiser_id`
- `cj_developer_key`, `cj_advertiser_id`
- (Stripe + Meta entries land in Session 4)

**Manual network adapter** (`lib/adapters/manual.ts`) handles per-network sub-id parameter injection — sub-ids encode the momfluencer_id + offer_id for postback attribution. Each network has its own param name and format; manual adapter normalizes.

---

## Source-control parity statement

Today's commit `797fd31` ("Fix margin_cents generated-column bug in sync functions") brought the repo into parity with already-deployed Edge Function code that had been ahead of the repo. As of `b02cf3c`, repo and deployed state match for all Edge Functions.

---

## Hardened endpoint gate stacks

| Endpoint | Gates (in order) |
|---|---|
| `POST /api/links/create` | auth → momfluencer record exists → offer is active and approved → existing tracking_link check |
| `POST /api/applications/create` | auth → momfluencer record exists → membership_status active OR admin → offer requires application → no existing pending/approved application |
| `POST /api/agreements/sign` | auth → momfluencer record exists → signature row created with UNIQUE(momfluencer_id, agreement_id) |
| `POST /api/admin/applications/decide` | auth → admin role → application exists → status transition valid |
| `POST /api/admin/approve` | auth → admin role → momfluencer exists → status transition valid |

---

## Known live issue — momfluence.app 500 (RESOLVED May 7, 2026)

The momfluence.app 500 issue is RESOLVED. The DNS cutover that was originally scoped for Session 4 was performed today by Kevin. The momfluence.app domain now points to the momfluence-platform Vercel project (the v2 platform code). The legacy `momfluence` Vercel project no longer serves any active domain and can be archived.

Original diagnostic for historical reference: the legacy `momfluence` Vercel project's Framework Preset had been changed to "Other" sometime after April 27, 2026, causing all subsequent GitHub-triggered builds to fail. The Apr 27 deployment that was serving momfluence.app started returning runtime 500s, likely due to env var rotation. Cutover to momfluence-platform resolved this.

Current state:
- Production: https://momfluence.app (canonical, served by momfluence-platform Vercel project)
- Stripe Checkout: https://checkout.momfluence.app (DNS verified May 7, 2026, in 3-hour stability check)
- Fallback: https://momfluence-platform.vercel.app still resolves

---

## Known gaps + flagged tech debt

Ordered roughly by user-facing impact:

- **Membership signup funnel doesn't exist yet.** /paywall is a placeholder. Session 4 builds Stripe Checkout-based signup with email + password auth migration from the current magic link system.
- **Vercel rewrite for /r/{token} not wired** at the platform level. The Edge Function exists; the rewrite needs configuration during Session 4 DNS cutover.
- **Membership/status gate is duplicated inline in 3 places.** `app/(app)/catalog/page.tsx`, `app/(app)/catalog/[offerSlug]/apply/page.tsx`, and `app/(app)/agreements/[slug]/page.tsx` each replicate the same status + membership_status + admin-bypass redirect logic. Lifting to `app/(app)/layout.tsx` is the obvious cleanup, but every consumer of the layout (dashboard, links, payouts, profile, agreements, admin) would inherit the gate, and a few of those pages are valid for non-active-membership users (e.g. /profile to update payment method). Worth a deliberate scope decision.
- **/api/links/create membership gate gap.** The catalog page UI prevents non-active-membership users from clicking "Get link", but the API endpoint itself doesn't check membership_status. Defense-in-depth gap; one-line fix mirroring the applications/create pattern.
- **`legal/*.md` files are dead at runtime.** Session 3 dropped the filesystem read in favor of `agreements.body_md` from the DB. The four .md files in `/legal/` remain in the repo as historical reference. Future-session cleanup: either delete them, or repurpose into a `scripts/import-legal.ts` that pushes from disk to DB on deploy (single source of truth becomes "edit a file, run script" rather than "edit DB row directly").
- **v1 marketing copy still in `legal/sub-affiliate-agreement.md` line 13** (references "vetted local mom-creators") — defer to a future Agreement v2 release session because changing the body requires version bump + force re-sign of all existing signatures (currently 4: Kevin's only).
- **Admin un-withdraw / un-reject flow not built.** The `UNIQUE (momfluencer_id, offer_id)` constraint on `offer_applications` prevents re-applying after withdraw or reject. There's no admin UI to reset a row back to pending (only SQL). Currently only Sesame Care is application-required, so volume is zero, but it's a known sharp edge.
- **No agreement versioning UX.** Schema supports v2 (UNIQUE on (momfluencer_id, agreement_id), not (momfluencer_id, slug)), so a new version creates a new agreement row that requires a fresh signature. UI for "you need to re-sign" doesn't exist. Future session.
- **No email notifications anywhere.** Magic-link login is the only outbound email. Application decisions, signature confirmations, payout notifications — all in-app only.
- **Synthetic agreement signatures: 3 of 4 existing signatures are seeded directly from SQL during testing** rather than via the real signature UI. Only Kevin's sub-affiliate agreement signature was created through the production UI flow.
- **7 refunded paying members** from v1 (March 2026 static HTML signup); refunds processed through PayPal directly. No legacy data to migrate to v2.
- **Two prior credential leaks during build** (FlexOffers in URL path; Impact creds in similar context). Both rotated. pg_net history purged. `makeRedactor` defense added in sync functions to prevent recurrence.
- **Three Meta Pixels in v2 architecture.** Two legacy v1 pixels (1407633647209853 and 764587569626622) remain on-site for audience signal preservation only — they fire PageView only and don't receive CAPI events. A new v2 primary pixel (1468831514190648, in a fresh Meta Ads Account 3553164818168199 under MomFluence Business Manager 747377658306568) fires all value events and is the only pixel connected to Conversions API. CAPI is implemented via Stape's hosted CAPIG gateway ($10/mo) — Stape proxies browser pixel events to Meta CAPI server-to-server, so we don't have a CAPI endpoint in our codebase. This architecture keeps v2 reporting clean while preserving v1 audience signal for potential future retargeting. See `docs/planning/session-4-meta-tracking.md`.
- **Marketing pages and signup funnel are not built yet.** Homepage exists at momfluence.app but the primary CTA "New here? Apply →" links to /for-influencers which 404s. Privacy, Terms, Pricing, FAQ, How-it-works pages all 404. v2 Meta pixel not yet installed in app/layout.tsx. Footer/header chrome missing. All scoped into Session 4 (signup funnel) and tracked in `docs/planning/session-4-punchlist.md`.

---

## Session 4 launch requirements (non-negotiable)

- **Meta tracking implementation**: new v2 primary pixel `1468831514190648` (NOT legacy v1 pixels) wires browser pixel via standard `fbq()` calls in `app/layout.tsx`. Server-side CAPI is handled automatically by Stape's hosted CAPIG ($10/mo, https://capig.stape.vip) — Stape proxies browser pixel events to Meta CAPI server-to-server with automatic event_id deduplication and credential management. No backend CAPI code needed in our system. Two legacy v1 pixels (1407633647209853, 764587569626622) remain on-site for PageView-only audience signal. v2 pixel lives in Meta Ads Account `3553164818168199` under Business Manager `747377658306568`. See `docs/planning/session-4-meta-tracking.md`.
- **Stripe Checkout** in production mode at `checkout.momfluence.app` (Stripe Custom Domain enabled May 7, 2026 at $10/mo, DNS verified, in 3-hour stability check window). Apple Pay, Google Pay, PayPal-as-payment-method, Link, Klarna enabled. Price ID `price_1TUVt2ANPjxV4rVaQ4hgCXvr` ($5/mo recurring USD).
- **Server-side Stripe webhook** for subscription lifecycle (`created`, `payment_failed`, `deleted`, `paid`) at `momfluence.app/api/stripe/webhook`.
- ~~DNS cutover from legacy momfluence Vercel project to momfluence-platform Vercel project~~ **COMPLETED May 7, 2026** — momfluence.app now points to momfluence-platform Vercel project.
- **Auth migration** from magic link to email + password.
- **Creator payouts: deferred manual model + instant-payout perk for launch.** Stripe Connect Express activation deferred indefinitely (Kevin opted out of platform terms acceptance for v2 launch). Launch model: manual payouts processed by Kevin via PayPal/Venmo per member preference (Catt CC'd on notifications). Payout setup is deferred-collected (only when member clicks Withdraw). W-9 deferred-collected (only when cumulative earnings hit $600 IRS threshold). Each member gets a one-time lifetime instant-payout token in their first 90 days at $25 threshold, capped at $25 during first 30 days for chargeback protection. Standard threshold after: $50, max 2x per month. Schema is payout-method-agnostic so any future automated provider (Stripe Connect, PayPal Mass Pay, Tipalti) can swap in without UX migration. Full implementation details in `docs/planning/session-4-punchlist.md` Phase 5.

---

## Smoke test artifacts

All three were authored against specific starting states, run end-to-end via Chrome MCP automation, and verified at the database level after each section:

- Session 1 (catalog + sub-id wiring): exercised `/catalog`, `/catalog/[offerSlug]`, manual network sub-id injection, click redirect resolution
- Session 2 (application flow + admin review): exercised `/apply`, application creation, admin decision UI, status transitions
- Session 3 (agreements signature + dashboard gate): exercised agreement signature UI, signature persistence, dashboard gate behavior for unsigned vs signed members

Smoke test traces are not currently in the repo (stored in `/tmp/` during runs, ephemeral). Future improvement: persist smoke test outputs to `docs/smoke-tests/` for reproducibility.

---

## Recommended review priorities

In rough order:

1. **RLS policy consistency.** Walk every table's policies; flag any divergence from the "user owns by user_id, admin bypass via raw_app_meta_data" pattern.
2. **Edge Function auth + redaction.** `_shared/supabase.ts` + `_shared/sync-helpers.ts` — verify credential redaction is bulletproof, no edge cases where raw secrets could leak to logs.
3. **Manual adapter sub-id encoding.** `lib/adapters/manual.ts` — confirm sub-id format is unambiguous across all networks and survives encoding/decoding cycles.
4. **Gate stacks.** Trace each endpoint listed above; flag any reordering issues or redundant checks.
5. **Sync idempotency.** Postback handlers — confirm replays don't double-credit conversions.
6. **Database schema migrations.** `supabase/migrations/` — check for any destructive operations or unscoped UPDATEs.

---

## Open questions for CTO

- Should we lift the duplicated membership/status gate logic into `app/(app)/layout.tsx`, accepting that we'll need to whitelist a few non-gated routes (profile, billing portal)?
- Should `/api/links/create` add an explicit membership_status check (defense-in-depth), or is the UI gate sufficient?
- Funnel scoping: is the proposed Session 4-7 split (signup → onboarding → lifecycle → payouts) sensible, or should some merge or split?
- The IP hash salt is currently hardcoded in `app/t/[token]/route.ts`. Should that move to Vault?
- Is a staging environment worth setting up before launch (separate Vercel + Supabase project), or is dev-against-localhost + careful production deploys acceptable for this stage?
- Lessons from the ZS Rarefinder project that should apply here?

---

## Files to pull up first (in this order)

1. `lib/supabase/middleware.ts` — auth + session handling, the front line
2. `app/(app)/layout.tsx` — membership/status gate parent (currently inline-duplicated, see tech debt note)
3. `supabase/functions/click_redirect/index.ts` — the live ingestion path
4. `lib/adapters/manual.ts` — sub-id injection, the hand-rolled glue
5. `supabase/functions/sync_impact_actions/index.ts` — postback handler with redaction
6. `app/api/agreements/sign/route.ts` — Session 3 endpoint with signature persistence
7. `supabase/migrations/` — schema history

---

## How this packet was produced

This packet was assembled across multiple Claude Code + parent Claude sessions over May 6-7, 2026, by progressive refinement and direct verification against the live repo at each stage. The pivot from PayPal to Stripe Connect (Session 7) was made today (May 6) after PayPal Live Payouts was denied for Kevin's Business account.
