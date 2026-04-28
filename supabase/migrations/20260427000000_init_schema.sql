-- MomFluence Platform initial schema.
-- One Supabase auth user == one momfluencer row.
-- Data flow: momfluencer logs in → signs agreement → generates tracking_link
-- for an offer → traffic hits /api/track/{token} → click logged → upstream
-- network postback hits /api/postback → conversion logged → payout accrues.

create extension if not exists "pgcrypto";

-- ── networks: upstream affiliate networks we sub-broker offers from ──────
create table public.networks (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,           -- 'everflow', 'scaleo', 'mock', etc.
  name        text not null,
  adapter_key text not null,                  -- which lib/adapters/* module drives it
  config      jsonb not null default '{}',    -- { api_key_ref, affiliate_id, base_url }
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── offers: catalog as we expose it to momfluencers (margin already shaved) ──
create table public.offers (
  id                  uuid primary key default gen_random_uuid(),
  network_id          uuid not null references public.networks(id) on delete restrict,
  external_offer_id   text not null,                      -- network's offer id
  slug                text unique not null,
  title               text not null,
  vertical            text,                               -- 'health', 'beauty', 'fitness'…
  brand               text,
  description         text,
  cta_url             text not null,                      -- upstream tracking URL with our aff_id baked in
  payout_type         text not null check (payout_type in ('cpa','cpl','cps','rev_share')),
  upstream_payout_cents integer not null,                 -- what the network pays us
  margin_bps          integer not null default 1000,      -- 10% = 1000 basis points
  hero_image_url      text,
  status              text not null default 'active' check (status in ('active','paused','archived')),
  geo                 text[] default '{US}',
  caps                jsonb default '{}',                 -- daily/monthly cap state
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (network_id, external_offer_id)
);

-- ── momfluencers: one row per signed-up creator ─────────────────────────
create table public.momfluencers (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text not null,
  display_name        text,
  first_name          text,
  last_name           text,
  instagram_handle    text,
  tiktok_handle       text,
  facebook_handle     text,
  city                text,
  state               text,
  follower_band       text,                               -- '500-1000','1k-5k', etc.
  status              text not null default 'pending' check (status in ('pending','approved','suspended','offboarded')),
  approved_at         timestamptz,
  approved_by         uuid references auth.users(id),
  payout_method       text default 'unset' check (payout_method in ('unset','paypal','venmo','ach','check')),
  payout_handle       text,
  membership_status   text default 'inactive' check (membership_status in ('inactive','trialing','active','past_due','canceled')),
  stripe_customer_id  text,
  utm_source_at_signup text,
  notes_internal      text,
  is_admin            boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index momfluencers_status_idx on public.momfluencers(status);
create index momfluencers_email_idx  on public.momfluencers(lower(email));

-- ── tracking_links: per-momfluencer share link for a given offer ────────
create table public.tracking_links (
  id              uuid primary key default gen_random_uuid(),
  token           text unique not null,                   -- short id used in /t/{token}
  momfluencer_id  uuid not null references public.momfluencers(id) on delete cascade,
  offer_id        uuid not null references public.offers(id) on delete restrict,
  custom_label    text,                                   -- e.g. 'IG bio', 'TikTok caption'
  destination_url text not null,                          -- upstream URL with our aff_sub appended
  created_at      timestamptz not null default now(),
  unique (momfluencer_id, offer_id, custom_label)
);

create index tracking_links_offer_idx       on public.tracking_links(offer_id);
create index tracking_links_momfluencer_idx on public.tracking_links(momfluencer_id);

-- ── clicks: every redirect through /t/{token} ──────────────────────────
create table public.clicks (
  id              uuid primary key default gen_random_uuid(),
  tracking_link_id uuid not null references public.tracking_links(id) on delete cascade,
  ip_hash         text,                                   -- sha256(ip + secret)
  user_agent      text,
  referer         text,
  country         text,
  region          text,
  device          text,
  created_at      timestamptz not null default now()
);

create index clicks_link_idx    on public.clicks(tracking_link_id);
create index clicks_created_idx on public.clicks(created_at desc);

-- ── conversions: postback events from upstream network ─────────────────
create table public.conversions (
  id                  uuid primary key default gen_random_uuid(),
  tracking_link_id    uuid not null references public.tracking_links(id) on delete restrict,
  network_event_id    text,                               -- network's transaction id (idempotency)
  network_payout_cents integer not null,                  -- gross from the network
  momfluencer_payout_cents integer not null,              -- net to the momfluencer (after margin)
  margin_cents        integer generated always as (network_payout_cents - momfluencer_payout_cents) stored,
  status              text not null default 'pending' check (status in ('pending','approved','rejected','reversed','paid')),
  approved_at         timestamptz,
  paid_at             timestamptz,
  raw_payload         jsonb,                              -- full postback for audit
  created_at          timestamptz not null default now()
);

-- partial unique index: dedup postbacks when network sends an event id
create unique index conversions_dedup_idx
  on public.conversions(tracking_link_id, network_event_id)
  where network_event_id is not null;

create index conversions_link_idx     on public.conversions(tracking_link_id);
create index conversions_status_idx   on public.conversions(status);
create index conversions_created_idx  on public.conversions(created_at desc);

-- ── payouts: batch withdrawals to momfluencers ─────────────────────────
create table public.payouts (
  id              uuid primary key default gen_random_uuid(),
  momfluencer_id  uuid not null references public.momfluencers(id) on delete restrict,
  amount_cents    integer not null check (amount_cents > 0),
  method          text not null check (method in ('paypal','venmo','ach','check')),
  external_ref    text,
  status          text not null default 'queued' check (status in ('queued','processing','paid','failed')),
  initiated_at    timestamptz not null default now(),
  paid_at         timestamptz,
  failure_reason  text
);

create index payouts_momfluencer_idx on public.payouts(momfluencer_id);

-- join table: which conversions are bundled into a payout
create table public.payout_conversions (
  payout_id     uuid not null references public.payouts(id) on delete cascade,
  conversion_id uuid not null references public.conversions(id) on delete restrict,
  primary key (payout_id, conversion_id)
);

-- ── agreements: versioned legal docs the momfluencer signs ─────────────
create table public.agreements (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null,                             -- 'sub-affiliate', 'payout-terms', 'ftc-disclosure'
  version      integer not null,
  title        text not null,
  body_md      text not null,
  effective_at timestamptz not null default now(),
  required     boolean not null default true,
  created_at   timestamptz not null default now(),
  unique (slug, version)
);

create table public.agreement_signatures (
  id               uuid primary key default gen_random_uuid(),
  momfluencer_id   uuid not null references public.momfluencers(id) on delete cascade,
  agreement_id     uuid not null references public.agreements(id) on delete restrict,
  signed_at        timestamptz not null default now(),
  ip_hash          text,
  user_agent       text,
  signature_text   text not null,                         -- typed name as e-signature
  unique (momfluencer_id, agreement_id)
);

-- ── program_assets: creative the momfluencer can swipe (per offer) ─────
create table public.program_assets (
  id          uuid primary key default gen_random_uuid(),
  offer_id    uuid references public.offers(id) on delete cascade,
  kind        text not null check (kind in ('image','video','caption','hashtag_pack','script','disclaimer')),
  title       text not null,
  body        text,
  url         text,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

create index program_assets_offer_idx on public.program_assets(offer_id);

-- ── helper: keep updated_at fresh ──────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger momfluencers_touch
  before update on public.momfluencers
  for each row execute function public.touch_updated_at();

create trigger offers_touch
  before update on public.offers
  for each row execute function public.touch_updated_at();

-- ── helper: auto-create momfluencer row on auth.users insert ──────────
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.momfluencers (id, email, status)
  values (new.id, new.email, 'pending')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ── earnings view (for dashboard widgets) ──────────────────────────────
create or replace view public.momfluencer_earnings as
select
  m.id as momfluencer_id,
  coalesce(sum(case when c.status in ('approved','paid') then c.momfluencer_payout_cents end), 0) as earned_cents,
  coalesce(sum(case when c.status = 'pending' then c.momfluencer_payout_cents end), 0)            as pending_cents,
  coalesce(sum(case when c.status = 'paid' then c.momfluencer_payout_cents end), 0)               as paid_cents,
  count(distinct c.id) filter (where c.status in ('approved','paid','pending')) as total_conversions
from public.momfluencers m
left join public.tracking_links tl on tl.momfluencer_id = m.id
left join public.conversions c     on c.tracking_link_id = tl.id
group by m.id;
