# MomFluence Platform — Pivot from v1 to v2

## v1 (March 2026): Local two-sided marketplace — abandoned
- Concept: South Bay LA local advertisers paired with local mom influencers
- Implementation: Static HTML signup site
- Outcome: 7 paying customers ($5/mo), all proactively refunded by Kevin
- Why abandoned: Two-sided local marketplaces require simultaneous onboarding of both sides; hard to scale; the "local" constraint limited offer selection
- Artifacts: Static HTML files at ~/momfluence-recovered/marketing/* (NOT in this repo, kept locally as reference)

## v2 (May 2026): Single-sided curated affiliate program — current
- Concept: Curated catalog of pre-approved affiliate offers; moms pay $5/mo to access; share tracking links and earn
- Why this works: Skips the supply-side problem (Kevin already has 22 approved offers); skips the "find offers" problem for moms (we did the work)
- Implementation: This Next.js platform (momfluence-platform), Sessions 1-3 complete
- Status: pending CTO review, Session 4 (signup funnel) next

## Messaging guide for v2
- Use: curated, hand-picked, pre-vetted, "we did the work," national, $5/mo, tracking links, NET-30
- Avoid: South Bay, Los Angeles (in product copy), local, in your area, two-sided, marketplace
- Frame as: curated brand partnership program for content creators
- Don't necessarily expose: affiliate marketing as the mechanism (it IS, but moms don't need to think about it)
- Tone: friendly, simple, "we did the math," "we did the work"

## Outstanding cleanup tasks

- `legal/sub-affiliate-agreement.md` line 13 still references "vetted local mom-creators" (v1 phrasing). The runtime source of truth is `agreements.body_md` in Supabase (per Session 3 — the `legal/*` files are dead at runtime). Fixing the body requires bumping the agreement version (currently v1) and force re-signing all existing signatures (currently 4 — Kevin's only). Defer to a future Agreement v2 release session.
