-- Row Level Security: momfluencers see only their own data; admins see all.
-- networks/offers/agreements/program_assets are public-readable (the catalog).

alter table public.networks            enable row level security;
alter table public.offers              enable row level security;
alter table public.momfluencers        enable row level security;
alter table public.tracking_links      enable row level security;
alter table public.clicks              enable row level security;
alter table public.conversions         enable row level security;
alter table public.payouts             enable row level security;
alter table public.payout_conversions  enable row level security;
alter table public.agreements          enable row level security;
alter table public.agreement_signatures enable row level security;
alter table public.program_assets      enable row level security;

-- helper: is the calling user a platform admin?
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.momfluencers where id = uid), false);
$$;

-- ── catalog reads (anyone authenticated can browse) ──
create policy "offers_read_all"           on public.offers              for select using (status = 'active' or public.is_admin());
create policy "networks_read_all"         on public.networks            for select using (active = true or public.is_admin());
create policy "agreements_read_all"       on public.agreements          for select using (true);
create policy "program_assets_read_all"   on public.program_assets      for select using (true);

-- ── self-row policies ──
create policy "momfluencers_self_read"    on public.momfluencers        for select using (id = auth.uid() or public.is_admin());
create policy "momfluencers_self_update"  on public.momfluencers        for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

create policy "tracking_links_self_rw"    on public.tracking_links      for all using (momfluencer_id = auth.uid() or public.is_admin()) with check (momfluencer_id = auth.uid() or public.is_admin());

create policy "clicks_self_read"          on public.clicks              for select using (
  exists(select 1 from public.tracking_links tl where tl.id = tracking_link_id and (tl.momfluencer_id = auth.uid() or public.is_admin()))
);

create policy "conversions_self_read"     on public.conversions         for select using (
  exists(select 1 from public.tracking_links tl where tl.id = tracking_link_id and (tl.momfluencer_id = auth.uid() or public.is_admin()))
);

create policy "payouts_self_read"         on public.payouts             for select using (momfluencer_id = auth.uid() or public.is_admin());
create policy "payout_conversions_self_read" on public.payout_conversions for select using (
  exists(select 1 from public.payouts p where p.id = payout_id and (p.momfluencer_id = auth.uid() or public.is_admin()))
);

create policy "agreement_signatures_self" on public.agreement_signatures for select using (momfluencer_id = auth.uid() or public.is_admin());
create policy "agreement_signatures_insert_self" on public.agreement_signatures for insert with check (momfluencer_id = auth.uid());

-- ── admin writes ──
create policy "offers_admin_write"        on public.offers              for all using (public.is_admin()) with check (public.is_admin());
create policy "networks_admin_write"      on public.networks            for all using (public.is_admin()) with check (public.is_admin());
create policy "agreements_admin_write"    on public.agreements          for all using (public.is_admin()) with check (public.is_admin());
create policy "program_assets_admin_write" on public.program_assets     for all using (public.is_admin()) with check (public.is_admin());
create policy "momfluencers_admin_insert" on public.momfluencers        for insert with check (public.is_admin() or id = auth.uid());

-- writes to clicks/conversions/payouts come from server (service-role) only;
-- no insert/update/delete policy = no anon/authenticated writes allowed.
-- The service role bypasses RLS by design.

-- view inherits permissions from underlying tables
grant select on public.momfluencer_earnings to authenticated;
