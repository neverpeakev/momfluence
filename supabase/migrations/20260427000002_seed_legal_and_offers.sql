-- Seed: networks, mock offers, agreement v1, program assets.
-- Realistic mock so the dashboard works end-to-end before any real network adapter is wired.

insert into public.networks (slug, name, adapter_key, config, active) values
  ('mock',     'MomFluence Mock Network', 'mock',     '{}', true),
  ('everflow', 'Everflow (stub)',         'everflow', '{}', false),
  ('scaleo',   'Scaleo (stub)',           'scaleo',   '{}', false),
  ('affise',   'Affise (stub)',           'affise',   '{}', false),
  ('offer18',  'Offer18 (stub)',          'offer18',  '{}', false);

with mock as (select id from public.networks where slug = 'mock')
insert into public.offers (
  network_id, external_offer_id, slug, title, vertical, brand, description,
  cta_url, payout_type, upstream_payout_cents, margin_bps, hero_image_url, geo
)
select mock.id, ext, sl, ti, vert, br, descr, url, pt, payout, 1000, img, geo
from mock, (values
  ('mock-001','healthy-smiles-pediatric',    'Healthy Smiles Pediatric Dental Booking','health',  'Healthy Smiles',
   'Local pediatric dental practice — gets a $50 lead bounty per new patient consult booked.',
   'https://offers.mock/healthy-smiles?aff_id=momfluence&aff_sub1={SUB_ID}','cpa', 5000,
   'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&q=80', '{US}'::text[]),
  ('mock-002','spring-hair-refresh',         'Spring Hair Refresh — Local Salon Bundle','beauty',  'Bloom Salon',
   'Local salon promo. Pays per booked appointment within 14 days of click.',
   'https://offers.mock/bloom-salon?aff_id=momfluence&aff_sub1={SUB_ID}','cpa', 4000,
   'https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?w=600&q=80', '{US}'::text[]),
  ('mock-003','mommy-fit-kickstart',         'Mommy Fit Kickstart 14-Day Trial',       'fitness', 'Mommy Fit',
   'Postpartum fitness studio trial. Pays $30 per signed-up trial member.',
   'https://offers.mock/mommyfit?aff_id=momfluence&aff_sub1={SUB_ID}','cpl',  3000,
   'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80', '{US}'::text[]),
  ('mock-004','tutor-tribe-summer',          'Tutor Tribe Summer Reading Program',     'education','Tutor Tribe',
   'Local tutoring program. Rev-share — 20% of first month''s tuition.',
   'https://offers.mock/tutortribe?aff_id=momfluence&aff_sub1={SUB_ID}','rev_share', 6000,
   'https://images.unsplash.com/photo-1491013516836-7db643ee125a?w=600&q=80', '{US}'::text[])
) as t(ext, sl, ti, vert, br, descr, url, pt, payout, img, geo);

-- legal v1 (bodies are short stubs; full text lives in /legal/*.md and gets synced into the DB on deploy)
insert into public.agreements (slug, version, title, body_md, required) values
  ('sub-affiliate', 1, 'MomFluence Sub-Affiliate Agreement v1',
   '_(Full text loaded from /legal/sub-affiliate-agreement.md at sign-time)_', true),
  ('payout-terms', 1, 'MomFluence Payout Terms v1',
   '_(NET-30 from approval, $50 minimum, 10% platform margin baked in.)_', true),
  ('ftc-disclosure', 1, 'FTC Disclosure & Promo Code of Conduct v1',
   '_(Required #ad / #sponsored disclosure in every post mentioning a MomFluence offer.)_', true),
  ('prohibited-content', 1, 'Prohibited Content & Channels v1',
   '_(No incentivized clicks, no spam, no impersonation, no medical claims, no kids under 13 on camera without consent.)_', true);

-- program assets: per-offer creative the momfluencer can swipe
insert into public.program_assets (offer_id, kind, title, body, position)
select o.id, 'caption', 'Suggested IG caption', e'My kids ACTUALLY look forward to the dentist now ✨ — @healthysmilespediatric had us in and out in 30 min and the staff was so sweet. If you''ve been putting it off, link in bio for a free consult. #ad #momfluence', 1
from public.offers o where o.slug = 'healthy-smiles-pediatric';

insert into public.program_assets (offer_id, kind, title, body, position)
select o.id, 'hashtag_pack', 'Hashtag pack', '#momlife #pediatricdentist #healthysmiles #momfluence #ad #sponsored', 2
from public.offers o where o.slug = 'healthy-smiles-pediatric';

insert into public.program_assets (offer_id, kind, title, body, position)
select o.id, 'disclaimer', 'FTC disclaimer (required)', 'Required: include #ad or "Paid partnership with [brand]" prominently. Do not bury in 30+ tag pile.', 99
from public.offers o;
