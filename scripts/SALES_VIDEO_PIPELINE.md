# Sales-video pipeline (Claude Design → MP4 → Meta Ads + Organic → Funnel Lab)

End-to-end pipeline for producing vertical 9:16 sales videos in Claude Design,
pushing them into the live Meta ad set, AND queueing them as organic posts on
FB Page + Instagram Reels — all wired into the same Funnel Lab attribution +
optimizer cron that drives the existing 20 image ads.

First v1 shipped 2026-05-19 in a ~2h Claude Design session. Auto-push +
organic pipeline added 2026-05-20.

## What lives where

### Capture + encode (one-time, mostly)
| File | Purpose |
|---|---|
| `scripts/sales-video-capture.js` | Stand-alone puppeteer capture script (matches the one Claude Design ships in its handoff bundle). Walks 15s × 30fps × 3 scenes = 1,350 PNGs at 1080×1920. |
| Claude Design's `encode.sh` (lives in the downloaded bundle) | ffmpeg muxes each scene's PNGs into a vertical H.264 yuv420p MP4. |

### Push into the campaign (new — runs from your laptop or CI)
| File | Purpose |
|---|---|
| `lib/optimizer/meta-client.ts` | Now exports `uploadAdVideo` + `waitForVideoReady`. Mirrors the image flow but talks to `/<act>/advideos` + polls encoding status. |
| `lib/optimizer/video-ad-builder.ts` | `pushVideoCreativeToAdSet(input)` — uploads the MP4, polls encoding, creates an ad creative with `object_story_spec.video_data`, creates a PAUSED ad in `META_AD_SET_ID`. |
| `scripts/push-sales-videos-to-meta.ts` | CLI driver that runs the above for the 3 v1 MP4s on Desktop (or paths you pass via `--a/--b/--c`). |
| `app/api/optimizer/tick/route.ts` | Ad-name regex now matches BOTH `c\d+` (image) AND `v-YYYYMM-…` (video) prefixes so the optimizer attributes both types back to variants. |
| `app/api/funnel-lab/creatives/route.ts` | Now accepts video/mp4 (+ video/webm + video/quicktime) payloads from Claude Design's "↗ Push all" button. New generic field: `data_base64`. Legacy `png_base64` still accepted. |
| `scripts/upload-sales-videos.ts` | Light Supabase-bucket uploader + `creatives` row upsert. Useful when you want videos in our DB without touching Meta. |

### Organic post queue (new)
| File | Purpose |
|---|---|
| `scripts/post-sales-videos-organic.ts` | Posts MP4s to FB Page (`/<page>/videos`, binary upload) + IG Reels (2-step container/publish, needs public URL — fetched from `creatives.public_url`). |

## The full loop (from "I want to iterate" to "live in the campaign")

```bash
# 1. Edit in Claude Design (claude.ai/design → Sales Video file in MomFluence Design System)
# 2. Click "Download bundle" → ~/Downloads/MomFluence Design System.zip

unzip "~/Downloads/MomFluence Design System.zip" -d /tmp/sv && cd /tmp/sv/handoff/sales-video
npm install                                # ~30s (puppeteer)
npx http-server -p 8080 -c-1 . &           # background
node capture.js                            # ~3.5min for all 3 scenes
chmod +x encode.sh && ./encode.sh          # ~30s → ./out/*.mp4

# 3. Stage MP4s where the push script expects them
cp out/*.mp4 ~/Desktop/momfluence-videos/

# 4a. Push as PAID ads into the Funnel Lab ad set (PAUSED). Optimizer picks them up
#     automatically on the next 6h tick — ad-name regex matches `v-YYYYMM-*`.
tsx scripts/push-sales-videos-to-meta.ts

# 4b. ALSO post as ORGANIC on FB Page + IG Reels. Caption defaults are in the script,
#     edit SCENES[] there to change. IG Reels use Supabase public URLs (auto-uploaded
#     by the script if `creatives.public_url` is null).
tsx scripts/post-sales-videos-organic.ts

# 5. In Meta Ads Manager: search for `v-202605` ads, flip PAUSED → ACTIVE.
#    The 6h optimizer tick will start attributing visits/conversions
#    to them once they serve.
```

## Creative mapping (sales videos → LP variants)

| creative_id | lp_variant | scene |
|---|---|---|
| `v-202605-a-group-chat` | `group-chat-goldmine` | Group chat (HelloFresh text exchange) |
| `v-202605-b-receipts` | `real-receipts` | Receipts ticker ($623 → $847 recurring) |
| `v-202605-c-headline` | `twenty-five-day-one` | Headline ("side income for moms") + dashboard mock |

Ad name convention (must match the tick handler regex):

```
v-YYYYMM-<scene>-<slug> — <lp_variant>
^^^^^^^^^^^^^^^^^^^^^^^^^      The optimizer keys on the leading creativeId here.
```

Meta ad destination URLs (set by `video-ad-builder.ts` automatically):
- `https://momfluence.app/lp/group-chat-goldmine?c=v-202605-a-group-chat&utm_source=meta&utm_campaign=funnel-lab-v1&utm_content=v-202605-a-group-chat`
- `https://momfluence.app/lp/real-receipts?c=v-202605-b-receipts&utm_source=meta&utm_campaign=funnel-lab-v1&utm_content=v-202605-b-receipts`
- `https://momfluence.app/lp/twenty-five-day-one?c=v-202605-c-headline&utm_source=meta&utm_campaign=funnel-lab-v1&utm_content=v-202605-c-headline`

## How the optimizer sees video ads

The tick handler (`app/api/optimizer/tick/route.ts`) was extended on 2026-05-20:

```ts
const videoMatch = ad.name.match(/^(v-\d{4,6}-[a-z]-[a-z0-9-]+)\b/i);
const imageMatch = videoMatch ? null : ad.name.match(/^(c\d+)\b/i);
const m = videoMatch ?? imageMatch;
if (m) adByCreative.set(m[1].toLowerCase(), { id: ad.id, name: ad.name });
```

After that, video ads flow through the exact same arms-and-posteriors machinery
as image ads. Insights (impressions/clicks/spend) come from `getAdInsights(7d)`,
conversions come from Stripe's `metadata.lp_variant` + `metadata.creative_id`.
A video ad with `creative_id = "v-202605-a-group-chat"` will write
`optimizer_actions.creative = "v-202605-a-group-chat"` and join cleanly with
the row already in `creatives` table.

## Caveats — known limitations of v1

- **HelloFresh letter-mark chip** in Scene A is a placeholder. Replace with a
  real brand asset before paid scale (Meta sometimes rejects ads showing
  competitor logos without permission).
- **Founding-mom avatars** in the t=11.5 flash are gradient placeholders with
  initials (J/M/A/S/K). PR #64 shipped real AI photos to the live LP at
  `/avatars/mom-N.jpg` — point Claude Design at those URLs in v2 by editing
  `FOUNDING_MOMS` (components.jsx line 40) and setting `src` on each entry.
- **Burned-in captions on by default.** Fine for sound-off feeds. Toggle off
  in the Tweaks panel for sound-on IG Stories cuts.
- **Brief ~0.3s navy/white breath at t=11.0** in all 3 scenes — between the
  value-prop beat exit and the founding-mom/CTA reveal. Intentional design
  breath, not a bug. If we want zero deadtime, ask Claude Design to crossfade
  the exit/entry instead of fading-out-then-in.

## Future improvements

- **Vercel-side video render endpoint** — today the capture pipeline only runs
  locally (needs puppeteer + ffmpeg in the same process). A `/api/render/creative-video/[slug].mp4`
  endpoint would let the FunnelLab UI's "↗ Push all" button work for videos
  the same way it does for images.
- **`creatives` table: dedicated `meta_video_id` / `meta_ad_id` columns** —
  today the push script crams these into the `source` text column. A small
  migration to add proper columns + an index would let the FunnelLab UI
  show the Meta-side IDs natively.
- **Auto flip PAUSED → ACTIVE** — the push script creates ads as PAUSED for
  safety. Once we trust the pipeline, add an `--activate` flag (or have the
  optimizer flip new arms ACTIVE on first tick if they pass a sanity check).
