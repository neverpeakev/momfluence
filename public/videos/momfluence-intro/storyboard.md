# storyboard.md — MomFluence launch intro

> Story design for the `momfluence.app` intro. Narrative arc follows the
> HyperFrames motion-graphics spine **Hook → Build → Punch → Resolve**, mapped
> onto the locked product-thesis 3-beat message (the news → eligibility
> puncture → CTA). Landscape 16:9, ~20.5 s, no voice-over required (motion-first;
> on-screen kinetic type carries the message). Optional VO script per scene is
> included for a narrated cut.

## One-line concept

Open on the signature HyperFrames **"HTML → video"** word-morph — then hijack
it: the morph resolves into momfluence's news, *"regular moms → real money,"*
and walks the viewer from *"wait, really?"* to *"I just made $40,"* closing on
the tagline and `momfluence.app`.

## Scene table (section_plan)

| Scene | Beat | Dur | Visual register | Blueprint | Named components / effects | Densest beat (the keyframe) |
|---|---|---|---|---|---|---|
| **s1** | Hook | 3.0s | Navy stage, single coral-lit kinetic word morph | kinetic-type | `kinetic-title` · char-morph `HTML→video` then `video→moms` | The mid-morph: "HTML" dissolving into "video" with the prompt caret + coral underline live |
| **s2** | Hook→Build | 3.5s | Stacked oversize Playfair headline, word reveal | kinetic-type | `kinetic-title` word-reveal · coral underline swipe · `flash-through-white` in | Full headline stacked: "moms are getting paid **celebrity-tier money**" with underline at full sweep |
| **s3** | Build | 3.5s | Split comparison, strikethrough | comparison | `prompt-box` (group-chat) · `coral-wipe` in · strike-out | "1M followers" struck through vs "500 followers ✓ regular mom" + chat bubble all on screen |
| **s4** | Build→Punch | 4.0s | The mechanism, prompt box center stage | prompt-box | `prompt-box` send · payout chips count · `mask-up` in | Recommendation typed → tracking link generated → "you keep 20–50%" chips all lit |
| **s5** | Punch | 3.5s | Dashboard stat tiles, earnings ticker | brand-stat | stat tiles · earnings count-up `$0→$40` · `prompt-send` in | Three stat tiles + "$40" earnings hit + "$5/mo" badge, all settled |
| **s6** | Resolve | 3.0s | Brand lockup, CTA | brand-reveal | logo lockup · tagline reveal · `flash-through-white` in | Full lockup: "Real moms. Real money. Real easy." + **momfluence.app** CTA |

Total: **20.5 s**. Transitions live at scene seams (owned by `components/transitions.html`).

## Per-scene detail

### s1 — Hook · `scene_s1.html`
- **On screen:** the kinetic title from the launch video. Letters of **HTML**
  morph/scramble into **video**, then **video** morphs into **moms**. A coral
  prompt-caret blinks; a coral underline draws under the live word.
- **Why it's the open:** it literally *grabs* the animation the founder loved and
  re-points it at the product — code→video→**moms** is the whole thesis in 3 words.
- **VO (optional):** "It started as a way to turn code into video…"
- **Densest frame:** caret + half-morphed glyphs + underline mid-draw.

### s2 — The news · `scene_s2.html`
- **On screen:** "Did you know **moms** are getting paid **celebrity-tier money**
  to recommend things online now?" — Playfair, word-by-word reveal, coral underline
  swipes under "celebrity-tier money."
- **Beat:** delivers *the news* (thesis beat 1).
- **VO:** "Did you know moms are getting paid celebrity-tier money to recommend things online now?"
- **Densest frame:** full headline stacked, underline at full sweep, eyebrow lit.

### s3 — Eligibility puncture · `scene_s3.html`
- **On screen:** split. Left: "~~1,000,000 followers~~" struck through, greyed.
  Right: "500 followers ✓ a regular mom." Below: a `prompt-box` group-chat bubble —
  "omg where did you get that?? send me the link 😭".
- **Beat:** *the eligibility puncture* (thesis beat 2).
- **VO:** "Not polished influencers with millions of followers — actual regular moms."
- **Densest frame:** strikethrough complete, ✓ popped, chat bubble landed.

### s4 — The mechanism · `scene_s4.html`
- **On screen:** the `prompt-box` composition center stage. A recommendation is
  "typed," a tracking link materializes (`momfluence.app/r/you`), and three coral
  payout chips light: "you keep 20%", "30%", "up to 50% of every sale."
- **Beat:** how the money actually moves — *real money for real recommendations.*
- **VO:** "Brands pay regular moms twenty to fifty percent of every sale they bring in."
- **Densest frame:** typed line + generated link + all three payout chips lit.

### s5 — The product · `scene_s5.html`
- **On screen:** mini dashboard — three stat tiles (Clicks · Conversions · Earnings),
  an earnings ticker counting `$0 → $40`, and a "$5/mo" membership badge. Captions
  "One login. One link. Curated programs."
- **Beat:** *the punch* — from "wait, really?" to "I just made $40."
- **VO:** "One login, one link, curated programs — and you just made forty dollars."
- **Densest frame:** ticker settled on **$40**, all tiles filled, $5/mo badge in.

### s6 — CTA · `scene_s6.html`
- **On screen:** brand lockup. Tagline "Real moms. Real money. Real easy." resolves,
  then the CTA "Find out more — get your cut at **momfluence.app**."
- **Beat:** *resolve* — the CTA (thesis beat 3).
- **VO:** "Real moms. Real money. Real easy. Find out more at momfluence.app."
- **Densest frame:** full lockup + tagline + coral CTA pill.

## Transition map (`components/transitions.html`)

```
s1 ──flash-through-white──▶ s2 ──coral-wipe──▶ s3 ──mask-up──▶ s4 ──prompt-send──▶ s5 ──flash-through-white──▶ s6
```
