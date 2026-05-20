/**
 * Push the 3 v1 sales-video MP4s into our live Meta ad set via the Funnel Lab.
 *
 * What this does, end-to-end:
 *   1. Reads each MP4 from disk (default ~/Desktop/momfluence-videos/).
 *   2. Calls /<act>/advideos to upload + waits for encoding ready.
 *   3. Creates an ad creative with object_story_spec.video_data referencing
 *      the new video_id.
 *   4. Creates a PAUSED ad in META_AD_SET_ID, named `${creativeId} — ${slug}`
 *      so the optimizer's tick handler attributes it back to the right arm.
 *   5. Uploads the MP4 to the Supabase `creatives` bucket and back-fills the
 *      `creatives` row with the public_url (so the Funnel Lab UI shows a
 *      thumbnail/preview alongside the existing image creatives).
 *   6. Inserts a placeholder row into `optimizer_actions` for the new ads,
 *      mode='shadow', so the next tick has a record to update with insights.
 *
 * Usage:
 *   # Defaults to the 3 video files staged on Desktop.
 *   tsx scripts/push-sales-videos-to-meta.ts
 *
 *   # Override paths individually:
 *   tsx scripts/push-sales-videos-to-meta.ts \
 *     --a ~/Desktop/momfluence-videos/momfluence-sales-sceneA.mp4 \
 *     --b ~/Desktop/momfluence-videos/momfluence-sales-sceneB.mp4 \
 *     --c ~/Desktop/momfluence-videos/momfluence-sales-sceneC.mp4
 *
 *   # Dry run — log what would be pushed without calling Meta:
 *   tsx scripts/push-sales-videos-to-meta.ts --dry
 *
 * Required env vars:
 *   META_MARKETING_API_TOKEN — ads_management + ads_read scopes
 *   META_AD_ACCOUNT_ID       — act_XXXXX or bare XXXXX
 *   META_AD_SET_ID           — the live ad set the videos go into
 *   META_FB_PAGE_ID          — the FB Page id (for object_story_spec.page_id)
 *   NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY — for storage upload + creatives row update
 *
 * After this script runs, the videos are PAUSED in Meta Ads Manager. Flip
 * them to ACTIVE manually (or wait for the optimizer to do it when the
 * mode goes from shadow → live).
 */

import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { basename, resolve as resolvePath } from "node:path";
import { homedir } from "node:os";

import { pushVideoCreativeToAdSet } from "../lib/optimizer/video-ad-builder";
import { isConfigured } from "../lib/optimizer/meta-client";

loadEnvConfig(process.cwd());

interface SceneConfig {
  letter: "a" | "b" | "c";
  creativeId: string;
  lpVariant: string;
  label: string;
  message: string;     // primary text shown above the video
  title?: string;      // optional sub-headline shown below
}

/**
 * Scene metadata. Keep `creativeId` in lockstep with the rows already
 * inserted into the `creatives` table (see scripts/upload-sales-videos.ts
 * and the SQL on 2026-05-19) AND with the slug used by the tick handler's
 * regex `^(v-\d{4,6}-[a-z]-[a-z0-9-]+)\b`.
 */
const SCENES: SceneConfig[] = [
  {
    letter: "a",
    creativeId: "v-202605-a-group-chat",
    lpVariant: "group-chat-goldmine",
    label: "V·A · Group chat (15s vertical)",
    message: "Your group chat is already a goldmine. Now you get paid for it.",
    title: "Real brands. Recurring commissions. $5/mo · cancel anytime.",
  },
  {
    letter: "b",
    creativeId: "v-202605-b-receipts",
    lpVariant: "real-receipts",
    label: "V·B · Receipts (15s vertical)",
    message: "$847 in recurring commissions from one HelloFresh link she sent once.",
    title: "Real brands. Real receipts. $5/mo · cancel anytime.",
  },
  {
    letter: "c",
    creativeId: "v-202605-c-headline",
    lpVariant: "twenty-five-day-one",
    label: "V·C · Headline (15s vertical)",
    message: "Side income for moms — without becoming an influencer.",
    title: "Real brands. Recurring commissions. $5/mo · cancel anytime.",
  },
];

function parseArgs(): { paths: Record<"a" | "b" | "c", string>; dry: boolean } {
  const args = process.argv.slice(2);
  const out: Record<string, string> = {};
  let dry = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dry") { dry = true; continue; }
    const m = args[i].match(/^--(a|b|c)$/);
    if (m && args[i + 1]) {
      out[m[1]] = args[i + 1];
      i++;
    }
  }
  const desktop = resolvePath(homedir(), "Desktop", "momfluence-videos");
  const defaults: Record<"a" | "b" | "c", string> = {
    a: resolvePath(desktop, "momfluence-sales-sceneA.mp4"),
    b: resolvePath(desktop, "momfluence-sales-sceneB.mp4"),
    c: resolvePath(desktop, "momfluence-sales-sceneC.mp4"),
  };
  return {
    paths: { a: out.a ?? defaults.a, b: out.b ?? defaults.b, c: out.c ?? defaults.c },
    dry,
  };
}

async function uploadToSupabaseAndUpdateRow(
  scene: SceneConfig,
  bytes: Uint8Array,
  filename: string,
  videoId: string,
  adId: string,
  adCreativeId: string,
): Promise<{ publicUrl: string | null }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.warn(`  ⚠ Supabase env missing — skipping bucket upload + creatives row update`);
    return { publicUrl: null };
  }
  const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

  // The /api/funnel-lab/creatives sibling now writes videos to `videos/<id>.mp4`.
  // Match that convention here so the catalog view stays consistent.
  const storagePath = `videos/${scene.creativeId}.mp4`;
  // Convert Uint8Array to a fresh ArrayBuffer-backed slice for the upload
  // (same shape requirement as Meta's FormData — strict TS types).
  const buf = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buf).set(bytes);
  const { error: upErr } = await sb.storage
    .from("creatives")
    .upload(storagePath, buf, { contentType: "video/mp4", upsert: true, cacheControl: "86400" });
  if (upErr) {
    console.warn(`  ⚠ Supabase storage upload failed: ${upErr.message}`);
    return { publicUrl: null };
  }
  const { data: { publicUrl } } = sb.storage.from("creatives").getPublicUrl(storagePath);

  // Back-fill the creatives row with the public_url + meta refs. The row was
  // already created by scripts/upload-sales-videos.ts (or the manual SQL on
  // 2026-05-19) — we just hydrate the URL fields now that Meta has the videos.
  const { error: dbErr } = await sb
    .from("creatives")
    .update({
      public_url: publicUrl,
      filename,
      storage_path: storagePath,
      // No schema column for Meta IDs yet — stash in `source` as JSON-ish
      // suffix so we can grep them later without a migration. Future:
      // add `meta_video_id` / `meta_ad_id` columns to the creatives table.
      source: `claude-design-sales-video · video_id=${videoId} · ad_id=${adId} · adcreative_id=${adCreativeId}`,
    })
    .eq("creative_id", scene.creativeId);
  if (dbErr) {
    console.warn(`  ⚠ creatives row update failed: ${dbErr.message}`);
  }
  return { publicUrl };
}

async function main() {
  const { paths, dry } = parseArgs();

  // Pre-flight
  const cfg = isConfigured();
  if (!cfg.ok) {
    console.error(`✗ Meta config missing: ${cfg.missing.join(", ")}`);
    console.error("  Set the env vars (or `vercel env pull .env.local`) and try again.");
    process.exit(1);
  }
  if (!process.env.META_FB_PAGE_ID) {
    console.error("✗ META_FB_PAGE_ID not set — required for ad creatives (object_story_spec.page_id).");
    process.exit(1);
  }

  console.log("▸ MomFluence sales-video → Meta push (v1)\n");
  if (dry) console.log("  DRY RUN — no Meta calls will be made\n");

  for (const scene of SCENES) {
    const path = paths[scene.letter];
    console.log(`Scene ${scene.letter.toUpperCase()}  ${scene.creativeId}  → /lp/${scene.lpVariant}`);
    console.log(`  file: ${path}`);

    let bytes: Uint8Array;
    try {
      const b = await readFile(path);
      bytes = new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
    } catch (e) {
      console.error(`  ✗ couldn't read file: ${e instanceof Error ? e.message : e}`);
      console.error(`    (Make sure the file exists at ${path}, or pass --${scene.letter} <path>)`);
      continue;
    }

    if (dry) {
      console.log(`  [dry] would upload ${(bytes.byteLength / 1024).toFixed(0)}KB to /advideos`);
      console.log(`  [dry] would create ad creative with video_data + page_id`);
      console.log(`  [dry] would create ad in adset ${process.env.META_AD_SET_ID} (PAUSED)`);
      console.log("");
      continue;
    }

    try {
      const result = await pushVideoCreativeToAdSet({
        creativeId: scene.creativeId,
        lpVariant: scene.lpVariant,
        label: scene.label,
        mp4Bytes: bytes,
        filename: basename(path),
        message: scene.message,
        title: scene.title,
        ctaType: "SIGN_UP",
      });
      console.log(`  ✓ pushed: ad_id=${result.adId} video_id=${result.videoId}`);
      console.log(`    destination: ${result.destinationUrl}`);

      const { publicUrl } = await uploadToSupabaseAndUpdateRow(
        scene,
        bytes,
        basename(path),
        result.videoId,
        result.adId,
        result.adCreativeId,
      );
      if (publicUrl) console.log(`  ✓ Supabase: ${publicUrl}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`  ✗ push failed: ${msg}`);
    }
    console.log("");
  }

  console.log("Done.");
  console.log("\nNext: in Meta Ads Manager, find the new PAUSED ads (search for `v-202605`)");
  console.log("and flip them to ACTIVE. The optimizer's tick handler will pick them up");
  console.log("on the next 6h tick (00/06/12/18 UTC).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
