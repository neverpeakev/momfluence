#!/usr/bin/env node
/**
 * One-shot push: send the 3 v5 MP4s to /api/funnel-lab/push-video (paid)
 * AND /api/funnel-lab/post-video-organic (FB + IG) via our production
 * endpoints, using inline data_base64 so no Supabase pre-upload is needed.
 *
 * Auth: cookie from a logged-in browser tab at https://momfluence.app
 * (passed via --cookie flag), OR Bearer CRON_SECRET passed via --bearer.
 *
 * Usage:
 *   node push-v5-to-meta-and-organic.mjs --cookie "<full cookie string>"
 *   # OR
 *   node push-v5-to-meta-and-organic.mjs --bearer "<CRON_SECRET>"
 */

import { readFile } from "node:fs/promises";
import { resolve as resolvePath } from "node:path";
import { homedir } from "node:os";

const args = process.argv.slice(2);
const flag = (k, def) => {
  const i = args.indexOf("--" + k);
  return i >= 0 ? args[i + 1] : def;
};

const COOKIE = flag("cookie", "");
const BEARER = flag("bearer", "");
const DRY = args.includes("--dry");
const SKIP_FB = args.includes("--skip-fb");
const SKIP_IG = args.includes("--skip-ig");
const SKIP_META = args.includes("--skip-meta");

if (!COOKIE && !BEARER && !DRY) {
  console.error("Need either --cookie <value> or --bearer <value> (or --dry to test).");
  process.exit(1);
}

const ORIGIN = "https://momfluence.app";

const SCENES = [
  {
    letter: "a",
    creativeId: "v-202605-a-group-chat",
    lpVariant: "group-chat-goldmine",
    label: "V·A · Group chat (15s vertical, v5)",
    metaMessage:
      "Your group chat is already a goldmine. Now you get paid for it.",
    metaTitle: "Real brands · recurring commissions · $5/mo",
    organicCaption:
      "Your group chat is already a goldmine — now you get paid for it.\n\nDrop one tracked link in your next text rec → real brands pay you 20–60% of every subscription, every month.\n\n$5/mo · cancel anytime\n→ momfluence.app\n\n#momlife #sidehustle #mompreneur #affiliatemarketing #recurringrevenue",
  },
  {
    letter: "b",
    creativeId: "v-202605-b-receipts",
    lpVariant: "real-receipts",
    label: "V·B · Receipts (15s vertical, v5)",
    metaMessage:
      "$847 in recurring commissions from one HelloFresh link she sent once.",
    metaTitle: "Illustrative example · individual results vary",
    organicCaption:
      "$847 in recurring commissions from one HelloFresh link she sent ONCE.\n\nNot a one-time bonus. Not refer-a-friend. Real brand partner payouts that keep paying as long as her friends stay subscribed.\n\nIllustrative example · individual results vary.\n\n$5/mo · cancel anytime\n→ momfluence.app\n\n#momhustle #sahmlife #realmom #affiliatemarketing #passiveincome",
  },
  {
    letter: "c",
    creativeId: "v-202605-c-headline",
    lpVariant: "twenty-five-day-one",
    label: "V·C · Headline (15s vertical, v5)",
    metaMessage:
      "Side income for moms — without becoming an influencer.",
    metaTitle: "Real brands · recurring commissions · $5/mo",
    organicCaption:
      "Side income for moms — without becoming an influencer.\n\nNo followers, no camera, no experience. Just real brands paying real moms for the links they already share.\n\n$5/mo · cancel anytime\n→ momfluence.app\n\n#sahm #sahmlife #momsofinstagram #sidehustleforreal #passiveincome",
  },
];

const desktop = resolvePath(homedir(), "Desktop", "momfluence-videos");
const paths = {
  a: resolvePath(desktop, "momfluence-sales-sceneA.mp4"),
  b: resolvePath(desktop, "momfluence-sales-sceneB.mp4"),
  c: resolvePath(desktop, "momfluence-sales-sceneC.mp4"),
};
const thumbs = {
  a: resolvePath(desktop, "thumbs-A.png"),
  b: resolvePath(desktop, "thumbs-B.png"),
  c: resolvePath(desktop, "thumbs-C.png"),
};

function authHeaders() {
  const h = { "Content-Type": "application/json" };
  if (BEARER) h["Authorization"] = `Bearer ${BEARER}`;
  if (COOKIE) h["Cookie"] = COOKIE;
  return h;
}

async function postPushVideo(scene, mp4Bytes, thumbBytes) {
  const body = {
    creative_id: scene.creativeId,
    lp_variant: scene.lpVariant,
    label: scene.label,
    message: scene.metaMessage,
    title: scene.metaTitle,
    cta_type: "SIGN_UP",
    data_base64: Buffer.from(mp4Bytes).toString("base64"),
    thumbnail_data_base64: Buffer.from(thumbBytes).toString("base64"),
    filename: `${scene.creativeId}.mp4`,
  };
  const res = await fetch(`${ORIGIN}/api/funnel-lab/push-video`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`push-video ${res.status}: ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

async function postOrganicVideo(scene, mp4Bytes) {
  // The organic endpoint expects storage_path or public_url for IG. Inline
  // data_base64 isn't supported there because IG needs a fetchable URL.
  // Strategy: first POST to /api/funnel-lab/creatives to land it in the
  // Supabase bucket (which gives us public_url), then call the organic
  // endpoint with that public_url.
  //
  // /api/funnel-lab/creatives accepts data_base64 (we extended it for video
  // in PR #68) and writes to the bucket. The route's response includes the
  // public_url.
  const ingestBody = {
    creative_id: scene.creativeId,
    label: scene.label,
    section: "polished",
    lp_variant: scene.lpVariant,
    format: "1080x1920",
    mime: "video/mp4",
    filename: `${scene.creativeId}.mp4`,
    data_base64: Buffer.from(mp4Bytes).toString("base64"),
    source: "claude-design-sales-video-v5",
  };
  const ingestRes = await fetch(`${ORIGIN}/api/funnel-lab/creatives`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(ingestBody),
  });
  const ingestText = await ingestRes.text();
  if (!ingestRes.ok) throw new Error(`creatives-ingest ${ingestRes.status}: ${ingestText.slice(0, 400)}`);
  const ingest = JSON.parse(ingestText);
  if (!ingest.public_url) throw new Error(`creatives-ingest returned no public_url: ${ingestText.slice(0, 300)}`);

  const body = {
    creative_id: scene.creativeId,
    caption: scene.organicCaption,
    public_url: ingest.public_url,
    fb: !SKIP_FB,
    ig: !SKIP_IG,
    filename: `${scene.creativeId}.mp4`,
  };
  const res = await fetch(`${ORIGIN}/api/funnel-lab/post-video-organic`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`post-video-organic ${res.status}: ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

async function main() {
  console.log(`▸ Pushing v5 to Meta + organic (FB Page + IG Reels)`);
  if (DRY) console.log("  DRY RUN — no HTTP calls");
  console.log("");

  for (const scene of SCENES) {
    console.log(`Scene ${scene.letter.toUpperCase()}  ${scene.creativeId}`);
    console.log(`  file: ${paths[scene.letter]}`);

    let bytes, thumbBytes;
    try {
      bytes = await readFile(paths[scene.letter]);
      thumbBytes = await readFile(thumbs[scene.letter]);
      console.log(`  loaded ${(bytes.byteLength / 1024).toFixed(0)} KB mp4 + ${(thumbBytes.byteLength / 1024).toFixed(0)} KB thumb`);
    } catch (e) {
      console.error(`  ✗ couldn't read MP4/thumb: ${e.message}`);
      continue;
    }

    if (DRY) {
      console.log(`  [dry] would call /api/funnel-lab/push-video + /api/funnel-lab/post-video-organic`);
      console.log("");
      continue;
    }

    if (!SKIP_META) {
      try {
        const r = await postPushVideo(scene, bytes, thumbBytes);
        console.log(`  ✓ Meta: ad_id=${r.ad_id}  video_id=${r.video_id}`);
        console.log(`    destination: ${r.destination_url}`);
      } catch (e) {
        console.error(`  ✗ Meta push failed: ${e.message}`);
      }
    } else {
      console.log("  ⊘ Meta push skipped (--skip-meta)");
    }

    if (!SKIP_FB || !SKIP_IG) {
      try {
        const r = await postOrganicVideo(scene, bytes);
        console.log(`  ✓ Organic: fb=${r.fb_post_id ?? "skip"} ig=${r.ig_media_id ?? "skip"}`);
        if (r.warnings?.length) {
          for (const w of r.warnings) console.warn(`    ⚠ ${w}`);
        }
      } catch (e) {
        console.error(`  ✗ organic post failed: ${e.message}`);
      }
    }

    console.log("");
  }

  console.log("Done.");
  console.log("\nFlip the 3 PAUSED ads to ACTIVE in Meta Ads Manager (search 'v-202605').");
  console.log("Top up Meta balance + drop cost cap to $25 if not already done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
