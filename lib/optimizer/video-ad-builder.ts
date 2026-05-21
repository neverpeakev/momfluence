/**
 * Video ad-creative builder for the Funnel Lab.
 *
 * Parallel to lib/optimizer/campaign-builder.ts (which handles image ads).
 * This file does NOT touch the existing image flow — it adds a new code
 * path for video creatives so we can run images and videos side-by-side
 * in the same ad set without rewriting the proven image pipeline.
 *
 * The flow per video:
 *
 *   1. Upload the MP4 bytes to /<act>/advideos       (meta-client.uploadAdVideo)
 *   2. Poll until encoding is `ready`                 (meta-client.waitForVideoReady)
 *   3. Compute a public thumbnail URL                 (Meta requires `image_url`
 *      on video_data — falls back to auto-generated thumb if we don't supply)
 *   4. POST /<act>/adcreatives with object_story_spec.video_data
 *   5. POST /<act>/ads referencing the creative_id, starts PAUSED
 *
 * After this, the optimizer's tick handler should pick the new ads up
 * automatically — see app/api/optimizer/tick/route.ts where ad-name parsing
 * was extended on 2026-05-20 to match both `c<NN>` (image arms) and
 * `v-<date>-<scene>-<slug>` (video arms).
 *
 * Why not extend campaign-builder.ts directly? Because (a) campaign-builder
 * is the launcher that creates the campaign + ad set + initial 10 image ads
 * in one shot, and (b) videos arrive piecemeal (one at a time, async). The
 * two flows happen at different lifecycle points; keeping them separate
 * matches that asymmetry.
 */

import {
  adAccountId,
  uploadAdVideo,
  waitForVideoReady,
  type MetaVideoStatus,
} from "@/lib/optimizer/meta-client";

const API_VERSION = "v20.0";
const BASE = `https://graph.facebook.com/${API_VERSION}`;
const FB_PAGE_ID_ENV = "META_FB_PAGE_ID";

function token(): string {
  const t = process.env.META_MARKETING_API_TOKEN;
  if (!t) throw new Error("META_MARKETING_API_TOKEN not set");
  return t.trim();
}

function fbPageId(): string {
  const id = process.env[FB_PAGE_ID_ENV];
  if (!id) {
    throw new Error(
      `${FB_PAGE_ID_ENV} not set — required for ad creatives. Set to the FB Page ID.`,
    );
  }
  return id;
}

function adSetId(): string {
  const id = process.env.META_AD_SET_ID;
  if (!id) throw new Error("META_AD_SET_ID not set");
  return id;
}

async function meta<T>(
  path: string,
  init: RequestInit & { qs?: Record<string, string> } = {},
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

export interface PushVideoInput {
  /** Internal creative id, e.g. "v-202605-a-group-chat". Used in ad name → optimizer attribution. */
  creativeId: string;
  /** LP variant slug, e.g. "group-chat-goldmine". Used in destination URL. */
  lpVariant: string;
  /** Display label for Meta Asset Library. */
  label: string;
  /** Raw MP4 file bytes. */
  mp4Bytes: Uint8Array;
  /** Filename to send to Meta. */
  filename: string;
  /** Optional thumbnail URL. As of late 2025 Meta no longer auto-generates
   *  a thumbnail from frame 0 — one of `thumbnailUrl` or `thumbnailImageHash`
   *  is now required, or the /adcreatives call fails with code 1443226. */
  thumbnailUrl?: string;
  /** Optional thumbnail image_hash (preferred over URL — pre-uploaded via
   *  the caller's /adimages step; image_hash references are more stable than
   *  Meta fetching an URL at creative-creation time). */
  thumbnailImageHash?: string;
  /** Ad copy. */
  message: string;       // primary text shown above the video
  title?: string;        // optional sub-headline below
  ctaType?: string;      // e.g. "SIGN_UP" (default), "LEARN_MORE", "GET_OFFER"
  /** Optional destination override; default is `${siteOrigin}/lp/<variant>?c=<creativeId>`. */
  destinationUrl?: string;
  /** Optional ad-set override; default is env META_AD_SET_ID. Useful when
   *  spawning experiment ad sets (PR #82) and pushing new video creatives
   *  into them rather than the legacy single ad set. */
  targetAdSetId?: string;
}

export interface PushVideoResult {
  videoId: string;
  adCreativeId: string;
  adId: string;
  encodingStatus: MetaVideoStatus;
  destinationUrl: string;
}

function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://momfluence.app").replace(/\/$/, "");
}

/**
 * End-to-end push of one video into the live Funnel Lab ad set.
 *
 * Returns immediately after the ad is created in PAUSED state. The optimizer's
 * next tick will pick it up via `listAds()` and start scoring it against the
 * other arms. Caller is responsible for flipping status → ACTIVE when ready
 * (e.g. via Meta Ads Manager or a follow-up API call).
 *
 * Throws if encoding fails. Successful return implies the ad is created and
 * referenceable by the optimizer.
 */
export async function pushVideoCreativeToAdSet(
  input: PushVideoInput,
): Promise<PushVideoResult> {
  // Trace through stdout so the calling script can show progress.
  const log = (msg: string) => console.log(`  [${input.creativeId}] ${msg}`);

  // 1. Upload the MP4 → get video_id.
  log(`uploading ${input.filename} (${(input.mp4Bytes.byteLength / 1024).toFixed(0)} KB) → /advideos`);
  const upload = await uploadAdVideo(input.mp4Bytes, input.filename, input.label);
  log(`upload accepted; video_id=${upload.id}`);

  // 2. Wait for encoding. 5min default timeout is plenty for 15s 1080×1920 clips.
  log(`polling encoding status…`);
  const status = await waitForVideoReady(upload.id, {
    onTick: (s) => log(`  status: ${s.video_status}`),
  });
  log(`encoding ready`);

  // 3. Build the destination URL. Same UTM convention as image ads
  //    (see lib/optimizer/campaign-builder.ts) so analytics stays comparable.
  const destination =
    input.destinationUrl ??
    `${siteOrigin()}/lp/${input.lpVariant}?c=${input.creativeId}&utm_source=meta&utm_campaign=funnel-lab-v1&utm_content=${input.creativeId}`;

  // 4. Create the ad creative. Note the SHAPE difference from image ads:
  //    object_story_spec.video_data { video_id, image_url, call_to_action,
  //    message, title } — NOT link_data.
  //
  //    Meta REQUIRES image_hash OR image_url on video_data (the post
  //    thumbnail). Auto-frame-0 generation is gone as of late 2025
  //    (error 1443226). image_hash is preferred (more stable than URL,
  //    Meta doesn't need to re-fetch). Caller is responsible for upload-
  //    ing the thumbnail to /adimages and passing the resulting hash.
  const ctaType = input.ctaType ?? "SIGN_UP";
  if (!input.thumbnailUrl && !input.thumbnailImageHash) {
    throw new Error(
      `pushVideoCreativeToAdSet for ${input.creativeId}: one of thumbnailUrl or thumbnailImageHash is required (Meta no longer auto-generates video thumbnails)`,
    );
  }
  const adCreative = await meta<{ id: string }>(`/${adAccountId()}/adcreatives`, {
    method: "POST",
    body: JSON.stringify({
      name: `${input.creativeId} — ${input.lpVariant} — video creative`,
      object_story_spec: {
        page_id: fbPageId(),
        video_data: {
          video_id: upload.id,
          ...(input.thumbnailImageHash
            ? { image_hash: input.thumbnailImageHash }
            : input.thumbnailUrl
              ? { image_url: input.thumbnailUrl }
              : {}),
          message: input.message,
          ...(input.title ? { title: input.title } : {}),
          call_to_action: { type: ctaType, value: { link: destination } },
        },
      },
    }),
  });
  log(`ad_creative id=${adCreative.id}`);

  // 5. Create the ad — name must START with the creativeId so the optimizer's
  //    tick handler can attribute it. The image flow uses `c\d+`; videos use
  //    `v-NNNNNN-…`. tick/route.ts:158 was extended on 2026-05-20 to match both.
  const ad = await meta<{ id: string }>(`/${adAccountId()}/ads`, {
    method: "POST",
    body: JSON.stringify({
      name: `${input.creativeId} — ${input.lpVariant}`,
      adset_id: input.targetAdSetId ?? adSetId(),
      creative: { creative_id: adCreative.id },
      status: "PAUSED",
    }),
  });
  log(`ad id=${ad.id} created (PAUSED). Flip to ACTIVE in Ads Manager to start serving.`);

  return {
    videoId: upload.id,
    adCreativeId: adCreative.id,
    adId: ad.id,
    encodingStatus: status,
    destinationUrl: destination,
  };
}
