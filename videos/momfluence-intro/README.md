# MomFluence — launch intro (HyperFrames)

A ~20.5s, 16:9 launch/intro film for **momfluence.app**, authored to the
[HyperFrames](https://github.com/heygen-com/hyperframes) composition contract.
It opens by *grabbing* the signature HyperFrames **"HTML → video"** kinetic title
and re-pointing it at the product — `HTML → video → moms → money` — then walks the
locked product-thesis message (the news → the eligibility puncture → the CTA).

## What's here

```
videos/momfluence-intro/
├── frame.md            # design system inverted for the frame (tokens, scale, voice)
├── storyboard.md       # scene table + per-scene narration (Hook→Build→Punch→Resolve)
├── storyboard.html     # ← OPEN THIS: reviewable scene table (16:9), embeds every keyframe live
├── storyboard-portrait.html # reviewable board for the 9:16 vertical cut
├── components/         # named reusable compositions
│   ├── kinetic-title.html   # the "HTML → video" word-morph (the grabbed animation)
│   ├── prompt-box.html      # recommendation → tracking link → payout chips
│   └── transitions.html     # flash-through-white · coral-wipe · mask-up · prompt-send
├── compositions/       # 16:9 master — one composition per scene, opening on its DENSEST beat
│   ├── scene_s1.html … scene_s6.html
└── compositions-portrait/   # 9:16 (1080×1920) Reels/Stories variant — same six scenes
    ├── scene_s1.html … scene_s6.html
```

## Two aspect ratios

- **16:9 master** (`compositions/`, `storyboard.html`) — the brand/launch film, matches
  the "HTML → video" launch reference.
- **9:16 vertical** (`compositions-portrait/`, `storyboard-portrait.html`) — 1080×1920 for
  IG Reels / TikTok / Stories. Same six beats and animations; the comparison (s3) and stat
  tiles (s5) stack vertically, type scaled for a phone, caption keep-out = bottom 320px.
  Drops straight into the existing vertical sales pipeline (`scripts/SALES_VIDEO_PIPELINE.md`).

## Review it now (no install)

Open **`storyboard.html`** in a browser. Every scene's densest beat renders live
(each iframe loops its GSAP timeline). Each `compositions/scene_s*.html` and each
`components/*.html` is also a standalone page you can open directly.

> Standalone preview loops only when **not** inside the HyperFrames runtime
> (`window.__HYPERFRAMES__`). The registered timeline itself stays deterministic
> (no `repeat:-1`), so the render is unaffected.

## Render to MP4 (HyperFrames CLI)

The CLI/render half of HyperFrames isn't installed in this repo. To produce the
actual video:

```bash
npx skills add heygen-com/hyperframes          # installs the skills + CLI
npx hyperframes preview videos/momfluence-intro # live preview of the full cut
npx hyperframes render  videos/momfluence-intro --out momfluence-intro.mp4
```

Scene order and the transition map are declared in `storyboard.md`; tokens and the
output contract in `frame.md`. (The HyperFrames MCP `compose`/`render_video` tools
are intentionally disabled for local/CLI agents — author HTML locally, render via
the CLI. The hosted MCP path is for chat clients without a filesystem.)

## Conventions followed

- Root `data-composition-id` / `data-scene-id`, fixed `data-width/height/duration`,
  `position:relative; overflow:hidden`.
- One **paused** GSAP timeline per composition, registered at
  `window.__timelines["<id>"]`, built synchronously at load.
- Deterministic: no `Math.random`, no `Date.now`, no network at render, no
  `repeat:-1` in the registered timeline.
- Transform/opacity/clip-path only; layout pre-computed at setup.
- Each keyframe carries `data-poster-time` = its densest beat (used by the
  standalone preview to show the still first).

## Source of truth

- Voice + message: `docs/product-thesis.md` (locked v5).
- Color/type tokens: `docs/design/lp-baseline-v2/tokens.html` → `tailwind.config.ts`.
