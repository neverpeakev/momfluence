/**
 * One-shot seed script for the Momfluence Facebook Page.
 *
 * What it does (in order):
 *   1. Exchanges the user/system-user token for a Page Access Token via
 *      GET /me/accounts (Meta requires page-scoped tokens for page mutations).
 *   2. Updates Page metadata — about / description / website / mission /
 *      company_overview — via POST /<page_id>.
 *   3. For each post in SEED_POSTS:
 *      a. Fetches the rendered 1080×1080 PNG from /api/render/post/<slug>.png
 *         (Chromium-on-Vercel, same pipeline that renders ad creatives).
 *      b. POSTs to /<page_id>/photos with multipart/form-data —
 *         `source` (image bytes), `message` (caption), and either
 *         `published=true` for immediate posts or `published=false` +
 *         `scheduled_publish_time` (Unix timestamp) for scheduled posts.
 *
 * Usage:
 *   tsx scripts/seed-fb-page.ts
 *
 * Required env vars:
 *   META_MARKETING_API_TOKEN — must have scopes: pages_show_list,
 *     pages_manage_metadata, pages_manage_posts, business_management.
 *   META_FB_PAGE_ID — the target Facebook Page's id (e.g. 1086292991223812).
 *   NEXT_PUBLIC_SITE_URL — optional; defaults to https://momfluence.app.
 *
 * Idempotent? No. Re-running will create duplicate posts. Run once, verify
 * in Page Manager (or Meta Business Suite → Planner), delete and re-run
 * if you need to adjust copy.
 */

import { loadEnvConfig } from "@next/env";
import { SEED_POSTS, PAGE_ABOUT, type SeedPost } from "../lib/fb-page/seed-content";

loadEnvConfig(process.cwd());

const API_VERSION = "v20.0";
const BASE = `https://graph.facebook.com/${API_VERSION}`;

function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://momfluence.app").replace(/\/$/, "");
}

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`✗ ${name} env var is required. Set it before running:`);
    console.error(`    ${name}=... tsx scripts/seed-fb-page.ts`);
    process.exit(1);
  }
  return v.trim();
}

interface PageEntry {
  id: string;
  name: string;
  access_token: string;
}

async function fetchPageAccessToken(userToken: string, pageId: string): Promise<{ token: string; name: string }> {
  const url = `${BASE}/me/accounts?fields=id,name,access_token&limit=200&access_token=${encodeURIComponent(userToken)}`;
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`GET /me/accounts → ${res.status}: ${text.slice(0, 500)}`);
  }
  const data = JSON.parse(text) as { data?: PageEntry[] };
  const page = (data.data ?? []).find((p) => p.id === pageId);
  if (!page) {
    const found = (data.data ?? []).map((p) => `${p.id} (${p.name})`).join(", ") || "none";
    throw new Error(
      `Page ${pageId} not in user's manageable pages. System user must be assigned as Page admin in Business Settings. Pages found: ${found}`
    );
  }
  if (!page.access_token) {
    throw new Error(`Page ${pageId} (${page.name}) returned no access_token — token lacks pages_show_list / pages_manage_metadata scope`);
  }
  return { token: page.access_token, name: page.name };
}

/** Resolve the Instagram Business Account ID linked to the FB Page (if any).
 *  Returns null if no IG account is linked — common for FB Pages that haven't
 *  connected an IG account yet, and not an error condition. */
async function fetchInstagramAccountId(pageToken: string, pageId: string): Promise<string | null> {
  const url = `${BASE}/${pageId}?fields=instagram_business_account&access_token=${encodeURIComponent(pageToken)}`;
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`GET /${pageId} (instagram_business_account) → ${res.status}: ${text.slice(0, 500)}`);
  }
  const data = JSON.parse(text) as { instagram_business_account?: { id: string } };
  return data.instagram_business_account?.id ?? null;
}

/** Publish a single image post to Instagram. Two-step flow per Meta docs:
 *  1. POST /{ig-id}/media with image_url + caption → returns creation_id
 *  2. POST /{ig-id}/media_publish with creation_id → publishes immediately
 *
 *  IG Graph API does NOT support scheduling — only immediate publish. We
 *  use the public render endpoint for image_url (no upload step needed). */
async function publishInstagramPost(
  igAccountId: string,
  pageToken: string,
  post: SeedPost
): Promise<string> {
  const imageUrl = `${siteOrigin()}/api/render/post/${post.slug}.png`;

  // Step 1: create media container
  const containerParams = new URLSearchParams();
  containerParams.append("image_url", imageUrl);
  containerParams.append("caption", post.caption);
  containerParams.append("access_token", pageToken);
  const containerRes = await fetch(`${BASE}/${igAccountId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: containerParams.toString(),
  });
  const containerText = await containerRes.text();
  if (!containerRes.ok) {
    throw new Error(`IG /media (container) for ${post.slug} → ${containerRes.status}: ${containerText.slice(0, 500)}`);
  }
  const { id: creationId } = JSON.parse(containerText) as { id?: string };
  if (!creationId) {
    throw new Error(`IG /media returned no creation_id for ${post.slug}: ${containerText.slice(0, 200)}`);
  }

  // Step 2: publish (the container needs to be FINISHED — IG fetches the
  // image asynchronously. For small images on a fast endpoint it's usually
  // ready in <2s, but we poll briefly to be safe.)
  for (let attempt = 0; attempt < 8; attempt++) {
    await new Promise((r) => setTimeout(r, 1500));
    const statusRes = await fetch(
      `${BASE}/${creationId}?fields=status_code&access_token=${encodeURIComponent(pageToken)}`
    );
    const statusText = await statusRes.text();
    if (!statusRes.ok) {
      throw new Error(`IG status check for ${post.slug} → ${statusRes.status}: ${statusText.slice(0, 300)}`);
    }
    const { status_code } = JSON.parse(statusText) as { status_code?: string };
    if (status_code === "FINISHED") break;
    if (status_code === "ERROR" || status_code === "EXPIRED") {
      throw new Error(`IG container ${creationId} status=${status_code} for ${post.slug}`);
    }
  }

  const publishParams = new URLSearchParams();
  publishParams.append("creation_id", creationId);
  publishParams.append("access_token", pageToken);
  const publishRes = await fetch(`${BASE}/${igAccountId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: publishParams.toString(),
  });
  const publishText = await publishRes.text();
  if (!publishRes.ok) {
    throw new Error(`IG /media_publish for ${post.slug} → ${publishRes.status}: ${publishText.slice(0, 500)}`);
  }
  const { id: mediaId } = JSON.parse(publishText) as { id?: string };
  return mediaId ?? "<no-id>";
}

async function updatePageMetadata(pageToken: string, pageId: string): Promise<void> {
  const params = new URLSearchParams();
  params.append("about", PAGE_ABOUT.shortDescription);
  params.append("description", PAGE_ABOUT.longDescription);
  params.append("website", PAGE_ABOUT.website);
  params.append("mission", PAGE_ABOUT.mission);
  // company_overview deprecated by Meta — POST returns 500 OAuthException
  params.append("access_token", pageToken);

  const res = await fetch(`${BASE}/${pageId}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`POST /${pageId} (metadata) → ${res.status}: ${text.slice(0, 500)}`);
  }
}

async function fetchPostImage(slug: string): Promise<Buffer> {
  const url = `${siteOrigin()}/api/render/post/${slug}.png`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Render fetch ${url} → ${res.status} ${res.statusText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) {
    throw new Error(`Render returned suspiciously small image for ${slug}: ${buf.length} bytes`);
  }
  return buf;
}

async function fetchLogoImage(variant: "icon" | "cover"): Promise<Buffer> {
  const url = `${siteOrigin()}/api/render/logo/${variant}.png`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Render fetch ${url} → ${res.status} ${res.statusText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) {
    throw new Error(`Render returned suspiciously small image for logo ${variant}: ${buf.length} bytes`);
  }
  return buf;
}

async function updateProfilePicture(pageToken: string, pageId: string): Promise<void> {
  const buf = await fetchLogoImage("icon");
  const form = new FormData();
  form.append("source", new Blob([new Uint8Array(buf)], { type: "image/png" }), "profile.png");
  form.append("access_token", pageToken);
  const res = await fetch(`${BASE}/${pageId}/picture`, { method: "POST", body: form });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`POST /${pageId}/picture → ${res.status}: ${text.slice(0, 500)}`);
  }
}

/** Cover photo flow: upload as unpublished photo first (returns photo_id),
 *  then POST /{page-id} with `cover=<photo_id>` to set it as the page cover. */
async function updateCoverPhoto(pageToken: string, pageId: string): Promise<void> {
  const buf = await fetchLogoImage("cover");
  // Step 1: upload as unpublished + no_story (so it doesn't appear in feed)
  const uploadForm = new FormData();
  uploadForm.append("source", new Blob([new Uint8Array(buf)], { type: "image/png" }), "cover.png");
  uploadForm.append("published", "false");
  uploadForm.append("no_story", "true");
  uploadForm.append("access_token", pageToken);
  const upRes = await fetch(`${BASE}/${pageId}/photos`, { method: "POST", body: uploadForm });
  const upText = await upRes.text();
  if (!upRes.ok) {
    throw new Error(`Cover upload POST /${pageId}/photos → ${upRes.status}: ${upText.slice(0, 500)}`);
  }
  const { id: photoId } = JSON.parse(upText) as { id?: string };
  if (!photoId) {
    throw new Error(`Cover upload returned no photo id: ${upText.slice(0, 200)}`);
  }
  // Step 2: assign as cover
  const setForm = new URLSearchParams();
  setForm.append("cover", photoId);
  setForm.append("access_token", pageToken);
  const setRes = await fetch(`${BASE}/${pageId}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: setForm.toString(),
  });
  const setText = await setRes.text();
  if (!setRes.ok) {
    throw new Error(`Set cover POST /${pageId} cover=${photoId} → ${setRes.status}: ${setText.slice(0, 500)}`);
  }
}

/** Convert {dayOffset, hourEastern} → Unix timestamp.
 *  Meta wants seconds since epoch. ET = UTC-5 (or -4 in DST); we use -5
 *  as a conservative approximation — being an hour "off" from true ET is
 *  harmless for posting cadence purposes. */
function scheduledUnix(dayOffset: number, hourEastern: number): number {
  const now = new Date();
  const target = new Date(now);
  target.setUTCDate(target.getUTCDate() + dayOffset);
  target.setUTCHours(hourEastern + 5, 0, 0, 0); // ET → UTC, conservative
  return Math.floor(target.getTime() / 1000);
}

async function createPagePost(
  pageToken: string,
  pageId: string,
  post: SeedPost
): Promise<{ id: string; scheduledFor?: string }> {
  const imageBuf = await fetchPostImage(post.slug);

  const form = new FormData();
  form.append("source", new Blob([new Uint8Array(imageBuf)], { type: "image/png" }), `${post.slug}.png`);
  form.append("message", post.caption);

  let scheduledFor: string | undefined;
  if (post.schedule === "immediate") {
    form.append("published", "true");
  } else {
    const unix = scheduledUnix(post.schedule.dayOffset, post.schedule.hourEastern);
    form.append("published", "false");
    form.append("scheduled_publish_time", String(unix));
    scheduledFor = `day+${post.schedule.dayOffset} @ ${post.schedule.hourEastern}:00 ET (unix ${unix})`;
  }
  form.append("access_token", pageToken);

  const res = await fetch(`${BASE}/${pageId}/photos`, {
    method: "POST",
    body: form,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`POST /${pageId}/photos for ${post.slug} → ${res.status}: ${text.slice(0, 500)}`);
  }
  const data = JSON.parse(text) as { id?: string; post_id?: string };
  const id = data.post_id ?? data.id ?? "<no-id>";
  return { id, scheduledFor };
}

async function main() {
  const igOnly = process.argv.includes("--ig-only");
  const userToken = requiredEnv("META_MARKETING_API_TOKEN");
  const pageId = requiredEnv("META_FB_PAGE_ID");

  console.log(`\n→ Resolving page access token for ${pageId}...`);
  const { token: pageToken, name } = await fetchPageAccessToken(userToken, pageId);
  console.log(`  ✓ ${name} (page ${pageId})`);

  let succeeded = 0;
  const failures: Array<{ slug: string; error: string }> = [];

  if (!igOnly) {
    console.log(`\n→ Updating page metadata (about / description / website / mission)...`);
    await updatePageMetadata(pageToken, pageId);
    console.log(`  ✓ Metadata updated`);

    console.log(`\n→ Updating profile photo (rendered from /api/render/logo/icon.png)...`);
    try {
      await updateProfilePicture(pageToken, pageId);
      console.log(`  ✓ Profile photo updated`);
    } catch (e) {
      console.log(`  ✗ Profile photo failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    console.log(`\n→ Updating cover photo (rendered from /api/render/logo/cover.png)...`);
    try {
      await updateCoverPhoto(pageToken, pageId);
      console.log(`  ✓ Cover photo updated`);
    } catch (e) {
      console.log(`  ✗ Cover photo failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    console.log(`\n→ Creating ${SEED_POSTS.length} posts...`);

    for (const post of SEED_POSTS) {
      try {
        const r = await createPagePost(pageToken, pageId, post);
        const label = post.schedule === "immediate" ? "[LIVE NOW]" : `[scheduled ${r.scheduledFor}]`;
        console.log(`  ✓ ${post.slug.padEnd(24)} ${r.id}  ${label}`);
        succeeded++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.log(`  ✗ ${post.slug.padEnd(24)} ${msg}`);
        failures.push({ slug: post.slug, error: msg });
      }
    }

    console.log(`\n${succeeded}/${SEED_POSTS.length} posts created. ${failures.length === 0 ? "✓ All good." : "✗ See failures above."}`);
  } else {
    console.log(`\n→ --ig-only mode: skipping FB metadata, photos, and post creation`);
  }

  // Instagram cross-post. IG Graph API doesn't support scheduling, so we
  // only mirror the immediate posts. The 12 scheduled posts will need to
  // be cross-posted via Meta Business Suite or a follow-up daily cron.
  console.log(`\n→ Cross-posting immediate posts to Instagram...`);
  const igAccountId = await fetchInstagramAccountId(pageToken, pageId).catch((e) => {
    console.log(`  ✗ Could not resolve IG account: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  });
  if (!igAccountId) {
    console.log(`  (skipped — no Instagram Business Account linked to this Page, or token lacks instagram_basic scope)`);
  } else {
    console.log(`  ✓ IG account ${igAccountId} linked`);
    const immediates = SEED_POSTS.filter((p) => p.schedule === "immediate");
    let igOk = 0;
    const igFailures: Array<{ slug: string; error: string }> = [];
    for (const post of immediates) {
      try {
        const mediaId = await publishInstagramPost(igAccountId, pageToken, post);
        console.log(`  ✓ ${post.slug.padEnd(24)} IG media ${mediaId}`);
        igOk++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.log(`  ✗ ${post.slug.padEnd(24)} ${msg}`);
        igFailures.push({ slug: post.slug, error: msg });
      }
    }
    console.log(`\n${igOk}/${immediates.length} IG posts published. ${immediates.length - igOk > 0 ? "Note: IG only mirrors immediate posts (scheduling not supported by IG Graph API)." : ""}`);
  }

  console.log("");

  if (failures.length > 0) {
    console.log("Failed posts (re-run after fixing):");
    for (const f of failures) console.log(`  - ${f.slug}: ${f.error}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("\n✗ Seed script failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
