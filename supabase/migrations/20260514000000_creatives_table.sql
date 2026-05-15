-- ============================================================
-- Funnel Lab — creatives table
-- ============================================================
-- Stores ad-creative metadata + public-URL pointers. PNGs themselves
-- live in the `creatives` storage bucket; this table is the registry.
--
-- Joined by the Funnel Lab UI on `creative_id` to render thumbnails
-- next to the per-creative Stripe rollup.

create extension if not exists pgcrypto;

create table if not exists creatives (
  id            uuid primary key default gen_random_uuid(),
  creative_id   text not null unique
                check (creative_id ~ '^[a-z0-9-]+$' and length(creative_id) between 1 and 120),
  label         text not null,
  section       text not null default 'other'
                check (section in ('polished', 'screenshot', 'ugly', 'hook', 'other')),
  lp_variant    text,
  format        text not null,                            -- e.g. '1080x1080'
  mime          text not null default 'image/png',
  filename      text not null,
  storage_path  text not null,                            -- relative path in `creatives` bucket
  public_url    text,
  source        text default 'design-system-ad-exporter',
  designed_at   text,                                     -- e.g. '540x540'
  rendered_at   text,                                     -- e.g. '1080x1080'
  pushed_at     timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists creatives_section_idx     on creatives (section);
create index if not exists creatives_lp_variant_idx  on creatives (lp_variant);
create index if not exists creatives_pushed_at_idx   on creatives (pushed_at desc);

-- Touch updated_at on upsert
create or replace function creatives_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists creatives_touch_updated_at on creatives;
create trigger creatives_touch_updated_at
  before update on creatives
  for each row execute function creatives_touch_updated_at();

-- ============================================================
-- Storage bucket
-- ============================================================
-- Bucket is PUBLIC-READ so the Funnel Lab UI can render thumbnails
-- without signed URLs. Writes are service-role only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('creatives', 'creatives', true, 10 * 1024 * 1024, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ============================================================
-- RLS — creatives are admin-readable; service-role bypasses.
-- ============================================================
alter table creatives enable row level security;

drop policy if exists creatives_admin_select on creatives;
create policy creatives_admin_select on creatives
  for select to authenticated
  using (
    exists (
      select 1 from momfluencers m
      where m.id = auth.uid() and m.is_admin = true
    )
  );

-- No insert/update policy for authenticated — only service role can write
-- (i.e. the /api/funnel-lab/creatives route). Service role bypasses RLS.

-- ============================================================
-- Storage RLS — service-role bypasses; public reads allowed via bucket.
-- ============================================================
-- (no extra policy needed; `public = true` on the bucket above lets anonymous
--  reads through; writes require service-role which bypasses storage RLS.)
