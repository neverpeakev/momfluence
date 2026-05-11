/**
 * Programmatic Meta Marketing API campaign builder.
 *
 * Creates the entire test campaign in one call:
 *   1. Campaign (paused, OUTCOME_SALES objective)
 *   2. Ad Set (broad mom targeting, cost cap, optimization on Purchase event)
 *   3. 10 ad creatives (one per /creatives variant image)
 *   4. 10 ads pointing at /lp/<slug>?c=<creativeId>
 *
 * Idempotent guard: by default refuses to build if a campaign with our
 * canonical name already exists in the account. Pass force=true to override.
 *
 * Image strategy: for each variant, POSTs the public PNG URL to Meta's
 * /adimages endpoint, which returns an image_hash. The hash is then used
 * in object_story_spec.link_data.image_hash. Meta dropped image_url support
 * in late 2025 — creatives must reference uploaded images by hash now.
 */

import { VARIANTS } from "@/lib/funnel-lab/variants";

const API_VERSION = "v20.0";
const BASE = `https://graph.facebook.com/${API_VERSION}`;

const CAMPAIGN_NAME = "MomFluence — Funnel Lab v1 — Cold Mom Acquisition";
const AD_SET_NAME = "Cold Moms — Broad — All Variants";
const FB_PAGE_ID_ENV = "META_FB_PAGE_ID"; // required to create ad creatives
const PIXEL_ID = "1468831514190648"; // v2 primary, matches app/layout.tsx

function token(): string {
  const t = process.env.META_MARKETING_API_TOKEN;
  if (!t) throw new Error("META_MARKETING_API_TOKEN not set");
  return t.trim();
}

function adAccount(): string {
  const a = process.env.META_AD_ACCOUNT_ID;
  if (!a) throw new Error("META_AD_ACCOUNT_ID not set");
  return a.startsWith("act_") ? a : `act_${a}`;
}

function fbPageId(): string {
  const id = process.env[FB_PAGE_ID_ENV];
  if (!id) {
    throw new Error(
      `${FB_PAGE_ID_ENV} not set — required for ad creatives. Set it to your Facebook Page ID (visible at facebook.com/<page>/settings).`
    );
  }
  return id;
}

function siteOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://momfluence.app";
}

async function meta<T>(
  path: string,
  init: RequestInit & { qs?: Record<string, string> } = {}
): Promise<T> {
  const { qs, ...rest } = init;
  const url = new URL(`${BASE}${path}`);
  if (qs) for (const [k, v] of Object.entries(qs)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    ...rest,
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      ...(rest.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Meta API ${path} → ${res.status}: ${text.slice(0, 800)}`);
  return JSON.parse(text) as T;
}

export interface BuildResult {
  campaignId: string;
  adSetId: string;
  ads: Array<{ creativeId: string; adId: string; adCreativeId: string; variantSlug: string }>;
  warnings: string[];
}

export interface BuildInputs {
  dailyBudgetUsd: number;
  costCapUsd?: number;
  force?: boolean;
}

/**
 * Upload an image to Meta's ad-image library via the /adimages endpoint,
 * returning the resulting image_hash. Required for ad-creative creation
 * since Meta dropped support for image_url in object_story_spec.link_data
 * in late 2025 — creatives now must reference a previously-uploaded image
 * by hash.
 *
 * Approach: fetch our own PNG bytes, base64-encode them, and POST as
 * `bytes` in a form-urlencoded body. Meta's `bytes` field is documented
 * as "encoded source bytes" (base64-encoded), NOT raw binary; sending
 * raw bytes via multipart causes Meta to interpret the first 8 bytes of
 * the PNG signature as base64-decoded garbage and reject the upload as
 * "Invalid image format" (file_size: 8).
 *
 * Earlier iterations of this function used:
 *   - `url` param (Meta fetches server-side) — failed with code 3
 *     "Application does not have the capability", needs advanced
 *     URL-fetch capability on the Meta App.
 *   - multipart/form-data with raw blob — failed because `bytes` is
 *     base64-encoded, not a binary field.
 */
async function uploadAdImage(slug: string): Promise<string> {
  // 1. Fetch our own PNG bytes (chromium-rendered).
  const imageUrl = `${siteOrigin()}/api/render/creative/${encodeURIComponent(slug)}.png`;
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) {
    throw new Error(`Failed to fetch own image ${imageUrl}: ${imgRes.status} ${imgRes.statusText}`);
  }
  const arrayBuf = await imgRes.arrayBuffer();
  if (arrayBuf.byteLength < 1000) {
    throw new Error(`Suspiciously small image for ${slug}: ${arrayBuf.byteLength} bytes — render pipeline issue`);
  }
  const base64 = Buffer.from(arrayBuf).toString("base64");

  // 2. POST as form-urlencoded with bytes=<base64>.
  const formBody = new URLSearchParams();
  formBody.append("bytes", base64);

  const url = `${BASE}/${adAccount()}/adimages`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody.toString(),
  });

  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`Meta /adimages upload failed: ${resp.status} ${text.slice(0, 500)}`);
  }
  const data = JSON.parse(text) as { images: Record<string, { hash: string }> };
  const first = Object.values(data.images ?? {})[0];
  if (!first?.hash) {
    throw new Error(`Meta /adimages returned no hash for ${slug}: ${text.slice(0, 300)}`);
  }
  return first.hash;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&apos;|&#39;|&#x27;/g, "'")
    .replace(/&quot;|&#34;|&#x22;/g, '"')
    .replace(/&lsquo;|&#8216;|&#x2018;/g, "‘")
    .replace(/&rsquo;|&#8217;|&#x2019;/g, "’")
    .replace(/&ldquo;|&#8220;|&#x201C;/g, "“")
    .replace(/&rdquo;|&#8221;|&#x201D;/g, "”")
    .replace(/&ndash;|&#8211;/g, "–")
    .replace(/&mdash;|&#8212;/g, "—")
    .replace(/&hellip;|&#8230;/g, "…")
    .replace(/&amp;/g, "&"); // last — & must decode after other entities
}

async function findExistingCampaign(): Promise<string | null> {
  type Resp = { data: Array<{ id: string; name: string }> };
  const r = await meta<Resp>(`/${adAccount()}/campaigns`, {
    qs: { fields: "id,name", limit: "200" },
  });
  const hit = r.data.find((c) => c.name === CAMPAIGN_NAME);
  return hit?.id ?? null;
}

export async function buildCampaign(inputs: BuildInputs): Promise<BuildResult> {
  const warnings: string[] = [];

  // Idempotency check
  if (!inputs.force) {
    const existing = await findExistingCampaign();
    if (existing) {
      throw new Error(
        `Campaign with name "${CAMPAIGN_NAME}" already exists (id=${existing}). Pass force=true to create a duplicate.`
      );
    }
  }

  // Required env early
  void fbPageId();

  // 1. Campaign
  const campaign = await meta<{ id: string }>(`/${adAccount()}/campaigns`, {
    method: "POST",
    body: JSON.stringify({
      name: CAMPAIGN_NAME,
      objective: "OUTCOME_SALES",
      status: "PAUSED",
      special_ad_categories: [],
      buying_type: "AUCTION",
      // Meta requires this be specified when budget lives at the ad-set
      // level (as ours does — see daily_budget on the ad set below).
      // false = each ad set spends only its own budget. true would let
      // Meta reallocate up to 20% across ad sets for cross-optimization,
      // pointless here since we run a single ad set in this campaign.
      is_adset_budget_sharing_enabled: false,
    }),
  });

  // 2. Ad Set
  // Targeting: women 28-55, US, no detailed-interest targeting (Andromeda-friendly).
  // Optimization on Purchase pixel event with cost cap.
  const targeting = {
    age_min: 28,
    age_max: 55,
    genders: [2], // 2 = female per Meta API
    geo_locations: { countries: ["US"] },
    publisher_platforms: ["facebook", "instagram", "audience_network", "messenger"],
    facebook_positions: ["feed", "story", "facebook_reels"],
    instagram_positions: ["stream", "story", "reels", "explore"],
    // Meta requires this be explicitly set as of late 2025. 0 = lock to the
    // demographics declared above (we want this for the validation phase —
    // confirms moms-specifically convert). Flip to 1 later to let Meta expand
    // beyond age/gender if performance plateaus.
    targeting_automation: { advantage_audience: 0 },
  };

  const dailyBudgetCents = Math.round(inputs.dailyBudgetUsd * 100);
  const bidAmountCents = Math.round((inputs.costCapUsd ?? 5) * 100);

  const adSet = await meta<{ id: string }>(`/${adAccount()}/adsets`, {
    method: "POST",
    body: JSON.stringify({
      name: AD_SET_NAME,
      campaign_id: campaign.id,
      status: "PAUSED",
      daily_budget: String(dailyBudgetCents),
      billing_event: "IMPRESSIONS",
      optimization_goal: "OFFSITE_CONVERSIONS",
      bid_strategy: "COST_CAP",
      bid_amount: bidAmountCents,
      // Conversion tracking — pixel + Purchase event
      promoted_object: {
        pixel_id: PIXEL_ID,
        custom_event_type: "PURCHASE",
      },
      targeting,
      start_time: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    }),
  });

  // 3 + 4: Ad creatives + ads, one per variant.
  // Image flow (Meta requires image_hash, not image_url, in object_story_spec.link_data
  // since late 2025): for each variant we POST the public PNG URL to /adimages, which
  // returns an image_hash that the creative spec references. Meta fetches the URL once
  // and caches the image internally.
  const ads: BuildResult["ads"] = [];

  for (const v of VARIANTS) {
    const creativeId = v.primaryCreativeId;
    const destination = `${siteOrigin()}/lp/${v.slug}?c=${creativeId}&utm_source=meta&utm_campaign=funnel-lab-v1&utm_content=${creativeId}`;

    try {
      // 3a. Upload image → get image_hash
      const imageHash = await uploadAdImage(v.slug);

      // 3b. Build ad creative — link-share style (single image, click → LP).
      // Decode HTML entities defensively: variant copy is sometimes pasted
      // from HTML sources (&apos;, &lsquo;, etc.) and React decodes them
      // automatically when rendering JSX, but Meta receives raw strings —
      // so unsanitized copy appears as "you&apos;re" in the actual ads.
      const adCreative = await meta<{ id: string }>(`/${adAccount()}/adcreatives`, {
        method: "POST",
        body: JSON.stringify({
          name: `${creativeId} — ${v.slug} — creative`,
          object_story_spec: {
            page_id: fbPageId(),
            link_data: {
              image_hash: imageHash,
              link: destination,
              message: decodeHtmlEntities(v.hero.subhead),
              name: decodeHtmlEntities(v.hero.headline.replace(/\n/g, " ")),
              description: decodeHtmlEntities(v.hero.eyebrow),
              call_to_action: { type: "SIGN_UP", value: { link: destination } },
            },
          },
        }),
      });

      // 4. Build the ad
      const ad = await meta<{ id: string }>(`/${adAccount()}/ads`, {
        method: "POST",
        body: JSON.stringify({
          name: `${creativeId} — ${v.slug}`,
          adset_id: adSet.id,
          creative: { creative_id: adCreative.id },
          status: "PAUSED",
        }),
      });

      ads.push({
        creativeId,
        adId: ad.id,
        adCreativeId: adCreative.id,
        variantSlug: v.slug,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      warnings.push(`Failed to create ad for ${v.slug} (${creativeId}): ${msg}`);
    }
  }

  return {
    campaignId: campaign.id,
    adSetId: adSet.id,
    ads,
    warnings,
  };
}

/**
 * Smoke-test helper — returns a checklist of what's configured.
 */
export function preflightConfig(): { ok: boolean; checks: Array<{ name: string; ok: boolean; detail?: string }> } {
  const checks = [
    { name: "META_MARKETING_API_TOKEN", ok: Boolean(process.env.META_MARKETING_API_TOKEN) },
    { name: "META_AD_ACCOUNT_ID", ok: Boolean(process.env.META_AD_ACCOUNT_ID) },
    { name: "META_FB_PAGE_ID", ok: Boolean(process.env.META_FB_PAGE_ID) },
    { name: `Anthropic key (${process.env.anthropic_public_api_key ? "anthropic_public_api_key" : "ANTHROPIC_API_KEY"})`, ok: Boolean(process.env.anthropic_public_api_key ?? process.env.ANTHROPIC_API_KEY) },
    { name: "STRIPE_SECRET_KEY", ok: Boolean(process.env.STRIPE_SECRET_KEY) },
    { name: "SUPABASE_SERVICE_ROLE_KEY", ok: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) },
    { name: "CRON_SECRET", ok: Boolean(process.env.CRON_SECRET) },
  ];
  return { ok: checks.every((c) => c.ok), checks };
}
