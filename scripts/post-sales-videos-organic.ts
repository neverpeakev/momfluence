/**
 * Post the 3 sales-video MP4s organically to the MomFluence FB Page + IG.
 *
 * Two distinct Meta flows:
 *
 *   FB Page video post:
 *     POST /{page_id}/videos  multipart  { source, description, access_token }
 *       → returns { id: <post_id> }
 *     One step. The Page Access Token is what authenticates this.
 *
 *   Instagram Reels post (2-step container/publish):
 *     POST /{ig_user_id}/media  { media_type: REELS, video_url, caption, access_token }
 *       → returns { id: <container_id> }
 *     Poll  /{container_id}?fields=status_code  every ~1.5s until "FINISHED"
 *     POST  /{ig_user_id}/media_publish  { creation_id, access_token }
 *       → returns { id: <media_id> }
 *
 *     Critical: IG REQUIRES a publicly-accessible video_url. We use the
 *     Supabase `creatives` storage bucket (public-read) and point IG at
 *     `public_url` from the creatives table.
 *
 * Usage:
 *   tsx scripts/post-sales-videos-organic.ts                 # post all 3 to both FB + IG
 *   tsx scripts/post-sales-videos-organic.ts --scene a        # one scene only
 *   tsx scripts/post-sales-videos-organic.ts --fb-only        # FB Page only (skip IG)
 *   tsx scripts/post-sales-videos-organic.ts --ig-only        # IG only (skip FB Page)
 *   tsx scripts/post-sales-videos-organic.ts --dry            # log what would happen, no API calls
 *
 * Required env vars:
 *   META_MARKETING_API_TOKEN — must have: pages_manage_posts, pages_show_list,
 *     instagram_basic, instagram_content_publish, business_management.
 *   META_FB_PAGE_ID — the FB Page id.
 *   NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY — to look up
 *     `creatives.public_url` for IG (and as a fallback uploader if a creative
 *     row doesn't have public_url yet).
 *
 * After this script runs, posts are LIVE on FB Page and IG immediately
 * (IG API doesn't support scheduling). Default captions are below; override
 * by editing the SCENES table.
 */

import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { basename, resolve as resolvePath } from "node:path";
import { homedir } from "node:os";

loadEnvConfig(process.cwd());

const API_VERSION = "v20.0";
const BASE = `https://graph.facebook.com/${API_VERSION}`;

interface SceneConfig {
  letter: "a" | "b" | "c";
  creativeId: string;
  /** Default local file path; overridden by --a/--b/--c CLI flags. */
  defaultPath: string;
  /** Caption used for both FB Page and IG. Keep under 2200 chars (IG hard limit). */
  caption: string;
}

const desktop = resolvePath(homedir(), "Desktop", "momfluence-videos");

const SCENES: SceneConfig[] = [
  {
    letter: "a",
    creativeId: "v-202605-a-group-chat",
    defaultPath: resolvePath(desktop, "momfluence-sales-sceneA.mp4"),
    caption:
      "Your group chat is already a goldmine — now you get paid for it.\n\n" +
      "Drop one tracked link in your next text rec → real brands pay you 20–60% of every subscription, every month.\n\n" +
      "$5/mo · cancel anytime\n" +
      "→ momfluence.app\n\n" +
      "#momlife #sidehustle #mompreneur #affiliatemarketing #recurringrevenue",
  },
  {
    letter: "b",
    creativeId: "v-202605-b-receipts",
    defaultPath: resolvePath(desktop, "momfluence-sales-sceneB.mp4"),
    caption:
      "$847 in recurring commissions from one HelloFresh link she sent ONCE.\n\n" +
      "Not a one-time bonus. Not refer-a-friend. Real brand partner payouts that keep paying as long as her friends stay subscribed.\n\n" +
      "$5/mo · cancel anytime\n" +
      "→ momfluence.app\n\n" +
      "#momhustle #sahmlife #realmom #affiliatemarketing #passiveincome",
  },
  {
    letter: "c",
    creativeId: "v-202605-c-headline",
    defaultPath: resolvePath(desktop, "momfluence-sales-sceneC.mp4"),
    caption:
      "Side income for moms — without becoming an influencer.\n\n" +
      "No followers, no camera, no experience. Just real brands paying real moms for the links they already share.\n\n" +
      "$5/mo · cancel anytime\n" +
      "→ momfluence.app\n\n" +
      "#sahm #sahmlife #momsofinstagram #sidehustleforreal #passiveincome",
  },
];

interface Args {
  paths: Record<"a" | "b" | "c", string>;
  scenes: Set<"a" | "b" | "c">;
  fbOnly: boolean;
  igOnly: boolean;
  dry: boolean;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const paths: Record<string, string> = {};
  const scenes = new Set<"a" | "b" | "c">();
  let fbOnly = false;
  let igOnly = false;
  let dry = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--fb-only") fbOnly = true;
    else if (a === "--ig-only") igOnly = true;
    else if (a === "--dry") dry = true;
    else if (a === "--scene" && args[i + 1]) {
      const s = args[i + 1].toLowerCase();
      if (s === "a" || s === "b" || s === "c") scenes.add(s);
      i++;
    } else {
      const m = a.match(/^--(a|b|c)$/);
      if (m && args[i + 1]) {
        paths[m[1]] = args[i + 1];
        i++;
      }
    }
  }
  if (scenes.size === 0) {
    scenes.add("a"); scenes.add("b"); scenes.add("c");
  }
  return {
    paths: {
      a: paths.a ?? SCENES[0].defaultPath,
      b: paths.b ?? SCENES[1].defaultPath,
      c: paths.c ?? SCENES[2].defaultPath,
    },
    scenes,
    fbOnly,
    igOnly,
    dry,
  };
}

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} env var is required`);
  return v.trim();
}

async function fetchPageAccessToken(userToken: string, pageId: string): Promise<string> {
  const url = `${BASE}/me/accounts?fields=id,access_token&limit=200&access_token=${encodeURIComponent(userToken)}`;
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) throw new Error(`GET /me/accounts → ${res.status}: ${text.slice(0, 500)}`);
  const { data } = JSON.parse(text) as { data?: Array<{ id: string; access_token: string }> };
  const page = (data ?? []).find((p) => p.id === pageId);
  if (!page?.access_token) {
    throw new Error(
      `Page ${pageId} not in /me/accounts response — token may lack pages_show_list / pages_manage_posts scopes, or system user isn't assigned as Page admin in Business Settings.`,
    );
  }
  return page.access_token;
}

async function fetchInstagramAccountId(pageToken: string, pageId: string): Promise<string | null> {
  const url = `${BASE}/${pageId}?fields=instagram_business_account&access_token=${encodeURIComponent(pageToken)}`;
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) throw new Error(`GET /${pageId} (instagram_business_account) → ${res.status}: ${text.slice(0, 500)}`);
  const data = JSON.parse(text) as { instagram_business_account?: { id: string } };
  return data.instagram_business_account?.id ?? null;
}

/** Post a video directly to the FB Page (one-step). Returns post id. */
async function postFbVideo(
  pageId: string,
  pageToken: string,
  bytes: Uint8Array,
  filename: string,
  caption: string,
): Promise<string> {
  const form = new FormData();
  const buf = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buf).set(bytes);
  form.append("source", new Blob([buf], { type: "video/mp4" }), filename);
  form.append("description", caption);
  form.append("access_token", pageToken);

  const res = await fetch(`${BASE}/${pageId}/videos`, { method: "POST", body: form });
  const text = await res.text();
  if (!res.ok) throw new Error(`POST /${pageId}/videos → ${res.status}: ${text.slice(0, 500)}`);
  const { id } = JSON.parse(text) as { id?: string };
  if (!id) throw new Error(`FB video post returned no id: ${text.slice(0, 200)}`);
  return id;
}

/** Post an IG Reel. 2-step: create container with video_url, then publish. */
async function postIgReel(
  igUserId: string,
  pageToken: string,
  videoUrl: string,
  caption: string,
): Promise<string> {
  // Step 1: create container
  const containerParams = new URLSearchParams();
  containerParams.append("media_type", "REELS");
  containerParams.append("video_url", videoUrl);
  containerParams.append("caption", caption);
  // share_to_feed=true so the Reel also lands in the main grid (not just Reels tab)
  containerParams.append("share_to_feed", "true");
  containerParams.append("access_token", pageToken);

  const cr = await fetch(`${BASE}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: containerParams.toString(),
  });
  const crText = await cr.text();
  if (!cr.ok) throw new Error(`IG /media (container) → ${cr.status}: ${crText.slice(0, 500)}`);
  const { id: containerId } = JSON.parse(crText) as { id?: string };
  if (!containerId) throw new Error(`IG /media returned no container id: ${crText.slice(0, 200)}`);

  // Step 2: poll until container is FINISHED (IG fetches the video async).
  // For 15s clips on Supabase, usually 5-20s.
  const maxWaitMs = 90_000;
  const t0 = Date.now();
  while (Date.now() - t0 < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 2000));
    const sr = await fetch(`${BASE}/${containerId}?fields=status_code&access_token=${encodeURIComponent(pageToken)}`);
    const sText = await sr.text();
    if (!sr.ok) throw new Error(`IG status check → ${sr.status}: ${sText.slice(0, 300)}`);
    const { status_code } = JSON.parse(sText) as { status_code?: string };
    if (status_code === "FINISHED") break;
    if (status_code === "ERROR" || status_code === "EXPIRED") {
      throw new Error(`IG container ${containerId} status=${status_code}`);
    }
  }

  // Step 3: publish
  const publishParams = new URLSearchParams();
  publishParams.append("creation_id", containerId);
  publishParams.append("access_token", pageToken);
  const pr = await fetch(`${BASE}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: publishParams.toString(),
  });
  const pText = await pr.text();
  if (!pr.ok) throw new Error(`IG /media_publish → ${pr.status}: ${pText.slice(0, 500)}`);
  const { id } = JSON.parse(pText) as { id?: string };
  if (!id) throw new Error(`IG publish returned no id: ${pText.slice(0, 200)}`);
  return id;
}

async function ensureSupabasePublicUrl(
  creativeId: string,
  localPath: string,
  bytes: Uint8Array,
): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Check existing creatives row first
  const { data } = await sb.from("creatives").select("public_url, storage_path").eq("creative_id", creativeId).maybeSingle();
  if (data?.public_url) return data.public_url;

  // Upload fresh if no public_url yet
  const storagePath = data?.storage_path ?? `videos/${creativeId}.mp4`;
  const buf = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buf).set(bytes);
  const { error: upErr } = await sb.storage.from("creatives").upload(storagePath, buf, {
    contentType: "video/mp4",
    upsert: true,
    cacheControl: "86400",
  });
  if (upErr) {
    console.warn(`  ⚠ Supabase upload failed: ${upErr.message}`);
    return null;
  }
  const { data: { publicUrl } } = sb.storage.from("creatives").getPublicUrl(storagePath);
  await sb.from("creatives").update({ public_url: publicUrl, storage_path: storagePath, filename: basename(localPath) }).eq("creative_id", creativeId);
  return publicUrl;
}

async function main() {
  const args = parseArgs();
  const dry = args.dry;

  const userToken = requiredEnv("META_MARKETING_API_TOKEN");
  const pageId = requiredEnv("META_FB_PAGE_ID");

  console.log("▸ MomFluence sales-video → organic FB + IG\n");
  if (dry) console.log("  DRY RUN — no API calls will be made\n");

  let pageToken = "";
  let igUserId: string | null = null;
  if (!dry) {
    pageToken = await fetchPageAccessToken(userToken, pageId);
    console.log(`  ✓ page access token resolved`);
    if (!args.fbOnly) {
      igUserId = await fetchInstagramAccountId(pageToken, pageId);
      if (!igUserId) {
        console.warn(`  ⚠ No Instagram Business Account linked to FB Page ${pageId} — IG posts will be skipped.`);
      } else {
        console.log(`  ✓ instagram user id: ${igUserId}`);
      }
    }
    console.log("");
  }

  for (const scene of SCENES) {
    if (!args.scenes.has(scene.letter)) continue;

    const path = args.paths[scene.letter];
    console.log(`Scene ${scene.letter.toUpperCase()}  ${scene.creativeId}`);
    console.log(`  file: ${path}`);

    let bytes: Uint8Array;
    try {
      const b = await readFile(path);
      bytes = new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
    } catch (e) {
      console.error(`  ✗ couldn't read file: ${e instanceof Error ? e.message : e}`);
      continue;
    }

    // FB Page video post (binary upload, one step)
    if (!args.igOnly) {
      if (dry) {
        console.log(`  [dry] would POST /${pageId}/videos with ${(bytes.byteLength / 1024).toFixed(0)}KB MP4 + caption`);
      } else {
        try {
          const postId = await postFbVideo(pageId, pageToken, bytes, basename(path), scene.caption);
          console.log(`  ✓ FB Page post id: ${postId}`);
        } catch (e) {
          console.error(`  ✗ FB Page post failed: ${e instanceof Error ? e.message : e}`);
        }
      }
    }

    // IG Reel (needs public URL)
    if (!args.fbOnly && (igUserId || dry)) {
      if (dry) {
        console.log(`  [dry] would create IG Reels container with video_url + caption, poll for FINISHED, publish`);
      } else if (igUserId) {
        try {
          const videoUrl = await ensureSupabasePublicUrl(scene.creativeId, path, bytes);
          if (!videoUrl) {
            console.warn(`  ⚠ couldn't resolve a public URL for ${scene.creativeId} — IG Reel skipped`);
          } else {
            const mediaId = await postIgReel(igUserId, pageToken, videoUrl, scene.caption);
            console.log(`  ✓ IG Reel media id: ${mediaId}`);
          }
        } catch (e) {
          console.error(`  ✗ IG Reel failed: ${e instanceof Error ? e.message : e}`);
        }
      }
    }

    console.log("");
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
