# MomFluence Platform

Momfluencer-facing dashboard for the MomFluence sub-affiliate / offer-broker network. Lives at `momfluence-platform.vercel.app` (or `app.momfluence.app` once subdomain is wired) and is iframed into the marketing site at `momfluence.app/admin`.

## What this app does

A momfluencer signs up, signs the sub-affiliate agreement, and gets a personal dashboard where she can:

1. Browse the catalog of available offers (imported from upstream networks like Everflow / Scaleo / Affise via pluggable adapters, with MomFluence's 10% margin already shaved off the displayed payout).
2. Generate her own tracking link for any offer — server appends her affiliate sub-ID to the upstream link.
3. See clicks, conversions, and pending/paid earnings in real time.
4. Read program docs (sub-affiliate agreement, payout terms, FTC disclosure rules, prohibited content list) and re-sign the agreement when a new version is published.

Conversions arrive from upstream networks via signed postbacks at `/api/postback`. The platform records the gross commission (what MomFluence earned) and the net payout (what the momfluencer earned) using the margin rule on the offer.

## Stack

- Next.js 15 App Router + React 19 + TypeScript
- Tailwind CSS (navy + coral, DM Sans + Playfair Display to match marketing brand)
- Supabase Postgres + Auth (magic link)
- Pluggable network adapter (`lib/adapters/*`): `mock` is implemented end-to-end; `everflow`, `scaleo`, `affise`, `offer18` are stubs ready to fill in when contracts close.
- Stripe Payment Link (existing, $5/mo membership) — not re-integrated; momfluencers continue to subscribe via the marketing flow.

## Local dev

```bash
cp .env.example .env.local   # fill in Supabase keys
npm install
npm run dev                  # http://localhost:3010
```

## Repo layout

```
app/
  (app)/                  authenticated dashboard routes
  api/                    server routes (track redirect, postback, link create, sign agreement)
  login/                  magic-link login
  page.tsx                public landing
lib/
  supabase/               browser + server clients
  adapters/               network adapter interface + Mock + stubs
  margin.ts               10% shave logic
legal/                    markdown docs surfaced in /agreements
supabase/migrations/      DDL + RLS + seed
scripts/                  one-off jobs (seed mock offers, import-from-sheet)
```

## Deploy

Pushed from `github.com/neverpeakev/momfluence`. Vercel project `momfluence-platform` (id `prj_FpnpeQiY122gZaviqT1XlqtZJeom`) builds from `main`.

## Marketing site (separate)

`momfluence.app` is a static HTML site (Tailwind CDN) deployed as Vercel project `momfluence` (id `prj_Avedk4szzgYJVQ7lFWc8pliFgyja`). Its forms POST to a Google Apps Script that writes to a Google Sheet (`APPS_SCRIPT_LEAD_URL`). When a momfluencer hits this platform for the first time, we look up her email in that sheet via `scripts/import-from-sheet.ts` so her marketing-side intake (city, IG, follower band) carries over.
