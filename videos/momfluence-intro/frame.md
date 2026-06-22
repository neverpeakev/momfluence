# frame.md — MomFluence launch intro (frame design system)

> HyperFrames reads `frame.md` first. This is the LP design system **inverted for
> the frame**: same tokens, same voice, but rewritten for a 1920×1080 motion
> canvas — fixed pixel scale, no web chrome (no scroll, no hover, no nav, no
> responsive breakpoints). Every value here is baked into the compositions so
> the render is deterministic.

## Output contract

| Field | Value |
|---|---|
| Composition | `1920 × 1080`, landscape 16:9 (brand/launch film) |
| FPS target | 30 |
| Total duration | ~20.5 s (6 scenes) |
| Runtime | GSAP, single **paused** timeline per scene on `window.__timelines` |
| Determinism | no `Math.random`, no `Date.now`, no network at render, no `repeat:-1` in the registered timeline |
| Motion | transform-only (`x`,`y`,`scale`,`rotation`), opacity, clip-path; layout pre-computed at setup |

Caption keep-out (if captions are ever mounted): bottom 180 px (`y ≥ 900`).

## Color (from `tailwind.config.ts` @ neverpeakev/momfluence — no new colors)

| Token | Hex | Frame role |
|---|---|---|
| `navy-900` | `#141a30` | **Stage background**, deepest ink |
| `navy-800` | `#1c2541` | Panel fill, card on dark |
| `navy-700` | `#243155` | Hairlines on dark, secondary panel |
| `navy-600` | `#2c3d6c` | Body ink on light |
| `navy-400` | `#5d70a3` | Meta / muted label |
| `navy-100` | `#e2e7f1` | Light text on navy, hairline on light |
| `navy-50`  | `#f3f5fa` | Light panel fill |
| `coral-500`| `#f04a25` | **Primary accent** — underline swipes, CTA fill, the "yes" hit |
| `coral-600`| `#cf3a1b` | Accent hover/deep |
| `coral-200`| `#ffbaa6` | Glow / soft ring |
| `coral-50` | `#fff4f1` | Soft chip on light |

Signature gradient (kinetic accent): `linear-gradient(100deg,#f04a25,#ffbaa6)`.
Stage glow: radial `#243155` → `#141a30` from 38% 30%.

## Type

| Role | Family / weight | Frame scale (px @1080) |
|---|---|---|
| Kinetic headline (display) | **Playfair Display 700**, `letter-spacing:-0.01em` | 132–220 |
| Section headline | Playfair Display 700 | 88–120 |
| Sub / lead | DM Sans 600 | 40–56 |
| Body / label | DM Sans 400–500 | 26–34 |
| Eyebrow | DM Sans 600, `uppercase`, `tracking:0.16em`, coral-600 | 22 |
| Mono chips (links, payouts) | `ui-monospace, Menlo` | 24–30 |

Fonts loaded once per composition from Google Fonts (DM Sans + Playfair Display).
Web `clamp()`/`vw` units are **banned** — fixed px only, the frame never reflows.

## Voice (locked — from `docs/product-thesis.md`)

Smart friend texting a smart friend. The 3 beats every piece must deliver:

1. **The news** — brands pay *regular moms* for recommendations.
2. **The eligibility puncture** — no million followers, no celebrity status.
3. **The CTA** — "Find out more at momfluence.app."

Locked words: **"regular moms"**, **"real money"/"big bucks"**, possessive CTA
**"get your cut"**. Tagline (use once): **"Real moms. Real money. Real easy."**

## Named frame components (in `components/`)

| Component | File | Used by |
|---|---|---|
| **Kinetic title composition** — the word-morph "X → Y" reveal grabbed from the HyperFrames "HTML → video" launch animation | `components/kinetic-title.html` | s1, s2 |
| **Prompt box composition** — group-chat recommendation → tracking link → payout, the product mechanism in one box | `components/prompt-box.html` | s3, s4 |
| **Transition components** — `flash-through-white`, `coral-wipe`, `mask-up`, `prompt-send` | `components/transitions.html` | scene seams |

## Scene → keyframe map

Each scene's "most visually dense beat" is authored as a standalone
HyperFrames composition in `compositions/scene_s*.html`. See `storyboard.md`
for the scene table and `storyboard.html` for the reviewable version.
