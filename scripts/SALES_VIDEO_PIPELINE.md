# Sales-video pipeline (Claude Design → MP4 → Meta Ads → Funnel Lab)

Path B export of 3 vertical sales videos for paid social (Reels/TikTok/Shorts).
First shipped 2026-05-19 in a single ~2h session with Claude Design.

## What lives where

| File | Purpose |
|---|---|
| `scripts/sales-video-capture.js` | Stand-alone puppeteer capture script (matches the one Claude Design ships in its handoff bundle). Walks 15s timeline × 30fps × 3 scenes = 1,350 PNGs at 1080×1920. |
| `scripts/upload-sales-videos.ts` | Uploads MP4s to Supabase `creatives` bucket and registers the 3 rows in the `creatives` table with the right `lp_variant` mapping. |

## The full loop (from "I want to iterate" to "live in the campaign")

```bash
# 1. Edit in Claude Design (claude.ai/design)
# 2. Click "Download bundle" → ~/Downloads/MomFluence Design System.zip
# 3. Capture + encode locally
unzip "~/Downloads/MomFluence Design System.zip" -d /tmp/sv && cd /tmp/sv/handoff/sales-video
npm install                                # ~30s
npx http-server -p 8080 -c-1 . &           # background
node capture.js                            # ~3.5min for all 3 scenes
chmod +x encode.sh && ./encode.sh          # ~30s → ./out/*.mp4

# 4. Stage for Meta upload + Supabase
cp out/*.mp4 ~/Desktop/momfluence-videos/
# (optional) push to Supabase storage + register rows:
tsx scripts/upload-sales-videos.ts \
  --a ~/Desktop/momfluence-videos/momfluence-sales-sceneA.mp4 \
  --b ~/Desktop/momfluence-videos/momfluence-sales-sceneB.mp4 \
  --c ~/Desktop/momfluence-videos/momfluence-sales-sceneC.mp4

# 5. Kevin uploads MP4s in Meta Ads Manager → gets 3 ad_ids
# 6. Stamp Meta ad_ids into optimizer_actions (see "Ad-id stamping" below)
```

## Creative mapping (sales videos → LP variants)

| creative_id | lp_variant | scene |
|---|---|---|
| `v-202605-a-group-chat` | `group-chat-goldmine` | Group chat (HelloFresh chat exchange) |
| `v-202605-b-receipts` | `real-receipts` | Receipts ticker ($623 → $847) |
| `v-202605-c-headline` | `twenty-five-day-one` | Headline ("side income for moms") + dashboard mock |

Meta ad destination URLs (use these when creating the ad):
- `https://momfluence.app/lp/group-chat-goldmine?c=v-202605-a-group-chat`
- `https://momfluence.app/lp/real-receipts?c=v-202605-b-receipts`
- `https://momfluence.app/lp/twenty-five-day-one?c=v-202605-c-headline`

## Ad-id stamping

When Kevin sends back 3 Meta ad_ids, stamp them into `optimizer_actions` so
the next optimizer tick can attribute spend/visits/conversions:

```sql
-- Replace <META_AD_ID_A/B/C> with the actual numeric IDs from Meta Ads Manager.
UPDATE optimizer_actions
   SET meta_ad_id = CASE creative
                      WHEN 'v-202605-a-group-chat' THEN '<META_AD_ID_A>'
                      WHEN 'v-202605-b-receipts'   THEN '<META_AD_ID_B>'
                      WHEN 'v-202605-c-headline'   THEN '<META_AD_ID_C>'
                    END
 WHERE creative IN (
   'v-202605-a-group-chat',
   'v-202605-b-receipts',
   'v-202605-c-headline'
 );
```

## Caveats from the first release

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
  breath, not a bug. If we want zero deadtime in a future iteration, ask
  Claude Design to crossfade the exit/entry instead of fading-out-then-in.
