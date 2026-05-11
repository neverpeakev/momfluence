-- Funnel Lab v1 — optional visit-level attribution tracking.
--
-- Without this migration, /admin/funnel-lab still works — it just shows signup
-- counts only (from Stripe metadata). With this migration, the LP route can
-- log every visit so we can compute true CR (signups ÷ visits) and CPA
-- (ad spend ÷ purchases) per variant + creative.
--
-- This migration is INTENTIONALLY NOT APPLIED via the Supabase MCP.
-- Review and apply manually via `supabase db push` or the dashboard
-- SQL editor when you're ready to enable visit-level rollups.
--
-- After applying, also update app/lp/[variant]/page.tsx (or LPVisitTracker)
-- to POST a row into funnel_visits on mount. The schema is additive only —
-- nothing else changes.

create table if not exists public.funnel_visits (
  id          uuid primary key default gen_random_uuid(),
  variant     text not null,
  creative    text,
  visitor_id  text not null, -- anonymous cookie id, hashed client-side
  user_agent  text,
  referrer    text,
  occurred_at timestamptz not null default now()
);

create index if not exists funnel_visits_variant_idx on public.funnel_visits (variant);
create index if not exists funnel_visits_creative_idx on public.funnel_visits (creative);
create index if not exists funnel_visits_occurred_at_idx on public.funnel_visits (occurred_at desc);

-- Visits are insert-only from the browser (anon role). No reads allowed.
-- Admin dashboard reads via service role from the server.
alter table public.funnel_visits enable row level security;

drop policy if exists funnel_visits_anon_insert on public.funnel_visits;
create policy funnel_visits_anon_insert on public.funnel_visits
  for insert
  to anon
  with check (true);

drop policy if exists funnel_visits_admin_read on public.funnel_visits;
create policy funnel_visits_admin_read on public.funnel_visits
  for select
  to authenticated
  using (
    exists (
      select 1 from public.momfluencers m
      where m.id = auth.uid() and m.is_admin = true
    )
  );

-- Aggregate view used by /admin/funnel-lab (left-join to subscriptions via
-- the Stripe metadata — done in app code, not in SQL).
create or replace view public.funnel_visit_rollup as
  select
    variant,
    creative,
    count(*) as visits,
    count(distinct visitor_id) as unique_visitors,
    min(occurred_at) as first_seen,
    max(occurred_at) as last_seen
  from public.funnel_visits
  group by variant, creative;
