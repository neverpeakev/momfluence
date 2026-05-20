/**
 * One-shot uploader: takes the 3 sales-video MP4s exported by Claude Design
 * and (a) pushes them into the Supabase `creatives` storage bucket and (b)
 * registers a row in the `creatives` table for each one so the Funnel Lab
 * picks them up automatically.
 *
 * Usage:
 *   tsx scripts/upload-sales-videos.ts \
 *     --a ~/Downloads/group-chat.mp4 \
 *     --b ~/Downloads/receipts.mp4 \
 *     --c ~/Downloads/headline.mp4
 *
 * What it does for each scene:
 *   1. Uploads to bucket `creatives` at path `videos/v-202605-{a|b|c}-*.mp4`
 *      (bucket pre-configured to allow video/mp4 up to 50MB — see
 *       migration 20260514000000_creatives_table.sql, amended live via SQL
 *       on 2026-05-19).
 *   2. Builds the public URL (bucket is public-read).
 *   3. Upserts a row in `creatives` with the right lp_variant mapping:
 *        Scene A (Group chat) → group-chat-goldmine
 *        Scene B (Receipts)   → real-receipts
 *        Scene C (Headline)   → twenty-five-day-one
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL  — public Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — service-role key (writes bypass RLS)
 *
 * After this script runs, the next manual step is uploading each MP4 to
 * Meta Ads Manager as a new video creative, then sending the Meta ad_id
 * back to me so I can stamp it into optimizer_actions.meta_ad_id for
 * proper attribution tracking.
 */

import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

loadEnvConfig(process.cwd());

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error(
    "Missing env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

interface SceneConfig {
  letter: "a" | "b" | "c";
  scene: string;
  creativeId: string;
  label: string;
  lpVariant: string;
}

const SCENES: SceneConfig[] = [
  {
    letter: "a",
    scene: "group-chat",
    creativeId: "v-202605-a-group-chat",
    label: "V·A · Group chat (15s vertical)",
    lpVariant: "group-chat-goldmine",
  },
  {
    letter: "b",
    scene: "receipts",
    creativeId: "v-202605-b-receipts",
    label: "V·B · Receipts (15s vertical)",
    lpVariant: "real-receipts",
  },
  {
    letter: "c",
    scene: "headline",
    creativeId: "v-202605-c-headline",
    label: "V·C · Headline (15s vertical)",
    lpVariant: "twenty-five-day-one",
  },
];

function parseArgs(): Record<"a" | "b" | "c", string> {
  const args = process.argv.slice(2);
  const out: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const m = args[i].match(/^--(a|b|c)$/);
    if (m && args[i + 1]) {
      out[m[1]] = args[i + 1];
      i++;
    }
  }
  if (!out.a || !out.b || !out.c) {
    console.error(
      "Usage: tsx scripts/upload-sales-videos.ts --a <path> --b <path> --c <path>"
    );
    process.exit(1);
  }
  return out as Record<"a" | "b" | "c", string>;
}

async function upload(scene: SceneConfig, localPath: string): Promise<void> {
  console.log(`\n=== Scene ${scene.letter.toUpperCase()} · ${scene.scene} ===`);
  console.log(`  file:        ${localPath}`);

  const bytes = await readFile(localPath);
  const filename = basename(localPath);
  const storagePath = `videos/${scene.creativeId}.mp4`;
  console.log(`  bytes:       ${bytes.length.toLocaleString()} (${(bytes.length / 1024 / 1024).toFixed(2)} MB)`);

  // Push to storage. upsert: true so re-runs replace cleanly.
  const { error: uploadErr } = await supabase.storage
    .from("creatives")
    .upload(storagePath, bytes, {
      contentType: "video/mp4",
      upsert: true,
    });
  if (uploadErr) {
    console.error(`  ✗ upload failed: ${uploadErr.message}`);
    return;
  }
  console.log(`  ✓ uploaded to creatives/${storagePath}`);

  // Build public URL — bucket is public-read so no signed URLs needed.
  const { data: { publicUrl } } = supabase.storage
    .from("creatives")
    .getPublicUrl(storagePath);
  console.log(`  url:         ${publicUrl}`);

  // Upsert the creatives row (creative_id has a unique constraint so a
  // re-run replaces the existing row rather than erroring).
  const { error: dbErr } = await supabase.from("creatives").upsert(
    {
      creative_id: scene.creativeId,
      label: scene.label,
      section: "polished",
      lp_variant: scene.lpVariant,
      format: "1080x1920",
      mime: "video/mp4",
      filename,
      storage_path: storagePath,
      public_url: publicUrl,
      source: "claude-design-sales-video",
      designed_at: "1080x1920",
      rendered_at: "1080x1920",
    },
    { onConflict: "creative_id" }
  );
  if (dbErr) {
    console.error(`  ✗ db insert failed: ${dbErr.message}`);
    return;
  }
  console.log(`  ✓ registered creative_id=${scene.creativeId} → /lp/${scene.lpVariant}`);
}

async function main() {
  const paths = parseArgs();
  for (const scene of SCENES) {
    await upload(scene, paths[scene.letter]);
  }
  console.log("\n=== Next manual steps ===");
  console.log("1. Upload each MP4 to Meta Ads Manager as a video creative.");
  console.log("2. For each new ad, set destination URL:");
  for (const scene of SCENES) {
    console.log(
      `   Scene ${scene.letter.toUpperCase()}: https://momfluence.app/lp/${scene.lpVariant}?c=${scene.creativeId}`
    );
  }
  console.log("3. Send me the 3 Meta ad_ids and I'll stamp them into optimizer_actions.");
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
