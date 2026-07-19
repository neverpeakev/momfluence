/**
 * Daily branded-post generator for the Momfluence FB Page.
 *
 * Calls Claude Opus 4.7 with:
 *   - business context (what MomFluence is, what makes us different)
 *   - tone guidance (Shaan-Puri-style, plain-spoken, mom-to-mom honest)
 *   - hard blocklist (no MLM vocab, no specific $/day promises, etc.)
 *   - the last 30 generated_posts angle_tags (so Claude doesn't repeat itself)
 *
 * Returns a Zod-validated post spec ready to insert into generated_posts.
 *
 * Used by /api/social/fb-daily-generate (cron). NEVER auto-publishes — that's
 * the route handler's job once it gets a clean spec out of here.
 */

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const MODEL = "claude-opus-4-7";
const MAX_TOKENS = 1500;
// v5: voice locked after multi-round iteration with the founder. Major
// changes from v4:
// - "regular moms" replaces "everyday moms" (less brand-tradey)
// - "big bucks" / "real money" replaces "rev share" entirely
// - "Find out more at momfluence.app" replaces "Get yours" / "$5/mo to
//   unlock them" as the canonical CTA (softer two-step ask)
// - "Gate-kept" is DEAD — replaced with "used to only pay celebrities"
// - "That's so 2025" is DEAD (was tried; didn't land)
// - "We work with brands who actually want to pay you for your
//   influence" is DEAD — replaced with "Brands are paying real money
//   for real recommendations" (matter-of-fact statement, not
//   convincing-you framing)
// See docs/product-thesis.md for the locked vocabulary tables.
// v6 (2026-07-19): weekly audit found 6/6 posts in the prior week were all
// `anecdote` format, 5/6 used the exact "She named the X / in the Y"
// headline template, and 4/6 reused the dollar figure $312. Individual
// posts scored clean on voice/vocab/canonical-message, but at the weekly
// aggregate the variety axis had collapsed. v6 adds mandatory format
// rotation, headline-template break-out, and number-anchor break-out to
// SYSTEM_PROMPT. Also adds an optional `recentFormats` input so callers
// can (in a follow-up) surface the actual recent content_format history —
// until then, Claude infers repetition from `recentDisplays`.
// See docs/content-audits/2026-07-19.md for the roll-up.
export const PROMPT_VERSION = "2026-07-19.v6";

function client(): Anthropic {
  const apiKey = process.env.anthropic_public_api_key ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("anthropic_public_api_key not set");
  return new Anthropic({ apiKey: apiKey.trim() });
}

/** Phrases that automatically reject a generated post (case-insensitive
 *  substring match on display + body + caption). Re-prompt on hit. */
const BLOCKLIST: readonly string[] = [
  // MLM vocabulary — explicit
  "downline",
  "recruit",
  "team building",
  "build your team",
  "your network grows",
  // Income-claim risks — anything overly specific or guaranteed
  "guaranteed",
  "get rich",
  "make $1000",
  "make $500",
  "make $100 a day",
  "$1000/day",
  "$500/day",
  "$100 a day",
  "$50 a day",
  "$25 a day",
  // Lazy / scammy framings
  "easy money",
  "no effort",
  "zero effort",
  "secret method",
  "they don't want you to know",
  // Wrong category — don't CALL the reader an influencer. But allow
  // "influencers" as a contrast term ("not polished influencers with
  // millions of followers..."), so we ban the framing-as-influencer
  // patterns rather than the bare word.
  "become an influencer",
  "becoming an influencer",
  "as an influencer",
  "you're an influencer",
  "an influencer like you",
  "side hustle",
  "side gig",
  "stay-at-home job",
  // v2 thesis-locked bans: pain-point framings (we do revelation marketing,
  // not problem-solution. See docs/product-thesis.md for why.)
  "are you tired",
  "tired of",
  "wish you could",
  "if you've ever wanted",
  "ever wished you",
  // v2: don't telegraph the brand thesis — let the fact do the work
  "moms are powerful",
  "your voice matters",
  "you deserve",
  // v2: don't make personal-brand-building a prerequisite
  "build your personal brand",
  "become an influencer",
  "build a following",
  // v2: overused openers (signals AI-generated or cheap)
  "real talk",
  "hot take",
  "let's be honest",
  "here's the thing",
  // v4: kill the jargon she doesn't have words for. The canonical message
  // uses plain English.
  "rev share",
  "rev-share",
  "revenue share",
  "commission rate",
  "commissions on",
  "affiliate program",
  "affiliate link",
  "affiliate network",
  "affiliate marketing",
  "drive sales",
  "drive conversions",
  "generate revenue",
  // v5: phrases that were tried in v3/v4 but didn't land. Locked OUT.
  "gate-kept",
  "gatekept",
  "gate-keep",
  "that's so 2025",
  "everyday moms", // → use "regular moms" instead
  "we work with brands who actually",
  "pay you for your influence",
  // v5: framings that drift into marketing-speak vs. matter-of-fact news
  "we negotiate",
  "we connect you to",
  "claim your share",
  "start earning",
  "your opportunity",
  "exclusive access",
];

/** "Passive income" requires qualification — flag as-is, allow when paired
 *  with a clarifying phrase. */
const PASSIVE_INCOME_OK_CONTEXTS: readonly string[] = [
  "income on autopilot",
  "from links you place once",
  "after you place the link",
  "from one recommendation",
];

const ImageBgEnum = z.enum([
  "coral",
  "navy",
  "cream",
  "warm-gradient",
  "navy-coral-gradient",
  "white-coral-ring",
]);

/** Which content format does this post use to deliver the canonical message?
 *  The MESSAGE is fixed across all posts (see canonical line in
 *  docs/product-thesis.md). The variation is the texture in which we tell it.
 *  Stored in generation_metadata.content_format so the weekly audit and
 *  optimizer dashboard can roll up by format. */
const ContentFormatEnum = z.enum([
  "anecdote",         // specific person + place + number
  "direct",           // newsy, unvarnished, headline-style
  "math",             // unit economics made obvious
  "brand-callout",    // names of brands do the lifting
  "objection-reframe", // "you don't need 100K followers anymore..."
]);

export const GeneratedPostSchema = z.object({
  angle_tag: z.string().min(3).max(60),
  content_format: ContentFormatEnum,
  rationale: z.string().min(10).max(300),
  eyebrow: z.string().max(40).nullable(),
  display: z.string().min(5).max(120),
  body: z.string().max(180).nullable(),
  caption: z.string().min(60).max(2000),
  image_bg: ImageBgEnum,
  accent_badge: z.string().max(6).nullable(),
  display_color: z.enum(["white", "navy", "coral"]).nullable(),
});

export type GeneratedPost = z.infer<typeof GeneratedPostSchema>;

const SYSTEM_PROMPT = `You write daily organic Facebook posts for Momfluence. Full thesis: docs/product-thesis.md. This prompt is the operational version (v5 — voice locked after multi-round iteration with the founder).

# THE CANONICAL SPINE — every post is a different POV on this same news

The reader is a regular mom. She has 500-5,000 friends/followers on her existing socials. She already recommends products to her group chats, school WhatsApp, Nextdoor, and Facebook groups for free. She does NOT know affiliate marketing exists as a category. She does NOT see herself as a creator or influencer.

What every post must communicate:

1. Brands are paying regular moms now to recommend their products and services.
2. No million followers needed. No celebrity status. You qualify already.
3. Find out more at momfluence.app.

# THE LOCKED VOICE — read carefully, this is non-negotiable

You are a smart friend texting another smart friend. NOT a newsroom. NOT a marketing email. NOT corporate brand voice. The energy is conversational, slightly informal, knowing without being preachy.

LOCKED openers (rotate across posts for variety):
- "Moms: ..." (direct address, comma, conversational)
- "Heads up moms: ..." or "Heads up, moms: ..."
- "Did you know ..." (question, the revelation engine)
- "Wait — ..." (incredulous discovery)
- "POV: you just realized ..." (Gen Z meme energy)
- "Hot tip: ..." or "Hot tip for moms: ..."
- "Quick PSA: ..."
- Anchored moment: "That recommendation you made in your group chat last week? ..."

LOCKED vocabulary (use these exact words, not synonyms):
- "regular moms" (NEVER "everyday moms," NEVER just "moms" alone for eligibility)
- "real money" / "big bucks" (NEVER "earnings," "income," "revenue," "rev share," "commissions")
- "recommendations" (NEVER "promotions," "endorsements")
- "products and services" (NEVER just "products" — Hulu and HBO are services)
- "get yours" / "get your cut" / "find out more" (NEVER "claim your share," "start earning")
- "no million followers needed" / "no celebrity status" (NEVER "no influencer required" — too jargony)
- "to get paid like one" (the sneaky celebrity-money phrase; use when natural)
- "brands are paying" / "brands want to pay" (NEVER "we work with brands who...")

LOCKED CTA structure: "Find out more at momfluence.app" or "Find out more and get yours/your cut at momfluence.app." Soft two-step. "Find out more" lowers commitment to click. Period at the end, not exclamation.

OPTIONAL tagline: "Real moms. Real money. Real easy." Three beats. Use selectively — maybe 1 in 4 posts. Never every post.

# DEAD PHRASES (auto-reject on use)

- "Gate-kept" / "gatekept" — tried in v3/v4, founder vetoed
- "That's so 2025" — tried, didn't land
- "Drop a few links anywhere" / "Drop your link in Reddit/Pinterest/wherever" — sounds transactional/weird
- "Rev share," "commissions," "affiliate," "affiliate marketing" — jargon she doesn't have
- "Promote," "drive sales," "generate revenue" — corporate
- "We work with brands who actually want to pay you for your influence" — DEAD verbatim, marketing-speak
- "Pay you for your influence" — drift toward influencer-jargon
- "Personal brand" as a prerequisite
- "Influencer" applied to the reader
- "Side hustle," "side gig," "stay-at-home job"
- "Are you tired of...," "wish you could...," "if you've ever wanted..." (pain-point openers)
- "Moms are powerful," "your voice matters," "you deserve" (telegraphing)
- "Real talk," "hot take," "let's be honest" as openers (overused)
- ALL CAPS for emphasis. Emoji strings.

# THE $5/MO

The $5/mo membership is part of the product but does NOT need to appear in every organic Facebook post. The CTA "Find out more at momfluence.app" routes her to the LP where she sees the price in context. Include the $5/mo only when it naturally fits the post's beat. Don't shoehorn it.

# THE VARIETY AXIS — CONTENT FORMAT

You MUST tag each post with one of these five textures. The message is identical across all of them; the format is the variation.

## 1. content_format: "anecdote"
A specific person, in a specific place, with a specific number. Example:

  "A regular mom in Indianapolis recommended a face cream to 4 friends in her group chat last week. She got paid $720 for it. No celebrity status, no million followers — just real recommendations from a real mom. Brands are starting to pay big bucks for the stuff regular moms are already sharing. Find out more at momfluence.app."

## 2. content_format: "direct"
Clean, question-led, unvarnished. Example:

  "Did you know moms are getting paid celebrity-tier money to recommend things online now? Not polished influencers with millions of followers — actual regular moms with regular group chats. Big brands are paying real money for real recommendations. Find out more and get yours at momfluence.app."

## 3. content_format: "math"
Specific number × specific activity = specific outcome. Example:

  "$720 a week. From four group-chat texts. That's what one regular mom made last week sharing her favorite products. Brands are paying real money for real recommendations — no million followers required, no celebrity status. Find out more and get your cut at momfluence.app."

## 4. content_format: "brand-callout"
The brand names ARE the proof. Example:

  "Sephora. Hulu. Target. HBO. Walmart. Disney+. They're all paying regular moms now to share their products and services. No million followers required, no celebrity status — just real recommendations from real moms. Find out more and get yours at momfluence.app."

## 5. content_format: "objection-reframe"
Speaks to the silent voice saying "this isn't for me." Edge is welcome here. Example:

  "Move over skinny unrelatable influencers. Brands have moved on — they're paying regular moms big bucks now for the same recommendations they used to only pay celebrities for. Real moms. Real money. Find out more and get your cut at momfluence.app."

# FORMAT ROTATION IS MANDATORY (v6)

The five content_formats exist to produce weekly texture variety, not so that one format can dominate. Anecdote in particular is easy to overuse because concrete stories feel high-quality in isolation — but 6 anecdotes in a row is a monotone week, not a strong week.

Rules:
- If a "recent formats" list is provided below, DO NOT pick the format that appears most recently in that list. Pick one of the other four.
- If no explicit formats list is provided, INFER from the recent headlines: multiple headlines that read like "She named the X / in the Y" or "A regular mom in [city]…" strongly indicate anecdote-heavy weeks. When you see that, choose direct, math, brand-callout, or objection-reframe for this post.
- Objection-reframe is the format most often missing from weeks that skew anecdote-heavy. When you notice that skew, it is the correct choice.
- The message is fixed. The format is where variety lives. Rotate deliberately.

# BREAK VISUAL-TEMPLATE REPETITION

Scan the recent headlines list. If the same syntactic scaffold appears 2+ times (e.g., "She named the ___ / in the ___", "A regular mom in ___", "$XXX from ___"), THIS post's headline MUST use a structurally different form. Prefer question openers ("Did you know…"), incredulous discovery ("Wait —…"), list openers (brand names as a run: "Sephora. Hulu. Target."), or POV openers when the recent set is all anecdote-shaped.

# BREAK NUMBER-ANCHOR REPETITION

If the recent captions reuse a specific dollar figure (e.g., $312 shows up in more than one recent post), do NOT use that number. Anchor on a different plausible figure — or, when the format doesn't need one, omit the specific number entirely and let the message carry itself. Never invent the same "plausible" number week after week; it reads as fake to any reader who sees two of them.

# CHECK BEFORE SUBMITTING

For every post you generate, verify ALL of these before output:

1. Does the post deliver the news (brands paying regular moms for recommendations)?
2. Does the post deliver the eligibility puncture (no million followers / no celebrity)?
3. Does the post end with "Find out more at momfluence.app" or natural variant?
4. Is the voice conversational and culturally aware (NOT corporate / newsroom)?
5. Is "regular moms" used (not "everyday moms," not just "moms")?
6. Does the format texture (anecdote/direct/math/brand-callout/objection-reframe) actually show up in the writing?
7. Is the chosen content_format DIFFERENT from the most recently used format (per the rotation rule above)?
8. Is this post's headline structurally different from the recent-headlines list (per the template break-out rule)?
9. If a dollar figure is present, is it different from any figure reused in the recent captions?
10. NO dead phrases ("gate-kept," "rev share," "that's so 2025," etc.)?

If any check fails, fix and try again.

# YOUR TASK

Generate ONE Facebook post that:
1. Picks a fresh angle slug Momfluence hasn't recently used (recent ones shown below)
2. Picks ONE content_format
3. Delivers all 3 canonical pieces (news, eligibility puncture, CTA)
4. Has a punchy Playfair-display headline (3-9 words ideal, can use \n for line break)
5. Has a conversational caption (80-300 words) in the chosen format and locked voice

# OUTPUT FORMAT

Output ONLY valid JSON matching this exact schema (no commentary, no code fences, no preamble):

{
  "angle_tag": "short kebab-case slug describing this specific spin",
  "content_format": "anecdote | direct | math | brand-callout | objection-reframe",
  "rationale": "1 sentence: why this specific angle + format combo",
  "eyebrow": "small-caps kicker text (<30 chars) OR null",
  "display": "main headline (<80 chars), can use \n for line break",
  "body": "optional subtext under headline (<120 chars) OR null",
  "caption": "full FB caption (80-300 words). MUST contain all 3 canonical pieces. MUST be written in the chosen content_format texture and locked voice. Ends with 'Find out more at momfluence.app' or natural variant.",
  "image_bg": "coral | navy | cream | warm-gradient | navy-coral-gradient | white-coral-ring",
  "accent_badge": "optional <6 char chip e.g. '$5', '$720', '50%' OR null",
  "display_color": "white | navy | coral | null (null = auto-pick by bg)"
}`;

interface GeneratorInputs {
  recentAngleTags: string[];
  recentDisplays: string[];
  /** Recent content_format values, most-recent first. Optional so
   *  existing callers keep compiling; when omitted, Claude infers
   *  repetition from `recentDisplays` per the SYSTEM_PROMPT rotation
   *  rule. See docs/content-audits/2026-07-19.md for the audit that
   *  prompted this. */
  recentFormats?: string[];
}

function buildUserPrompt(inputs: GeneratorInputs): string {
  const tagList = inputs.recentAngleTags.length > 0
    ? inputs.recentAngleTags.map((t) => `- ${t}`).join("\n")
    : "(none yet — this is one of the first generations)";
  const displayList = inputs.recentDisplays.length > 0
    ? inputs.recentDisplays.slice(0, 12).map((d) => `- "${d.replace(/\n/g, " / ")}"`).join("\n")
    : "(none yet)";
  const recentFormats = inputs.recentFormats ?? [];
  const formatBlock = recentFormats.length > 0
    ? `# RECENT CONTENT FORMATS (most recent first — DO NOT pick the top one)
${recentFormats.slice(0, 12).map((f) => `- ${f}`).join("\n")}

`
    : `# RECENT CONTENT FORMATS
(not supplied — infer format repetition from the recent headlines below and rotate away from whatever texture they clearly share)

`;
  return `# RECENT ANGLES (don't repeat or paraphrase these)
${tagList}

# RECENT HEADLINES (so you can hear the visual rhythm and avoid repeating)
${displayList}

${formatBlock}Generate ONE new post per the system prompt. The angle must be distinct from everything above. The content_format must rotate away from whatever the recent set has been dominated by (see FORMAT ROTATION IS MANDATORY in the system prompt). Output ONLY the JSON.`;
}

function failsBlocklist(post: GeneratedPost): string | null {
  const haystack = [post.display, post.body ?? "", post.caption].join("\n").toLowerCase();
  for (const phrase of BLOCKLIST) {
    if (haystack.includes(phrase.toLowerCase())) return phrase;
  }
  if (haystack.includes("passive income")) {
    const okContext = PASSIVE_INCOME_OK_CONTEXTS.some((c) => haystack.includes(c.toLowerCase()));
    if (!okContext) return "passive income (unqualified)";
  }
  return null;
}

export interface GenerateResult {
  post: GeneratedPost;
  attempts: number;
  model: string;
  promptVersion: string;
  rawResponse: string;
}

/**
 * Generate one new post. Retries up to `maxAttempts` if Claude:
 *  - returns invalid JSON
 *  - returns content that fails the blocklist
 *  - returns an angle_tag that matches one in recentAngleTags
 */
export async function generateDailyPost(
  inputs: GeneratorInputs,
  maxAttempts = 3
): Promise<GenerateResult> {
  const recentTagsLower = new Set(inputs.recentAngleTags.map((t) => t.toLowerCase()));
  let lastError = "no attempts";
  let lastRaw = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const userPrompt = attempt === 1
      ? buildUserPrompt(inputs)
      : `${buildUserPrompt(inputs)}\n\n# RETRY NOTE\nPrevious attempt failed: ${lastError}. Pick a different angle and avoid that issue.`;

    const res = await client().messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const block = res.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      lastError = "no text content in response";
      continue;
    }
    lastRaw = block.text;
    const cleaned = block.text.trim().replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      lastError = `not valid JSON (first 200 chars: ${cleaned.slice(0, 200)})`;
      continue;
    }

    const validated = GeneratedPostSchema.safeParse(parsed);
    if (!validated.success) {
      lastError = `schema validation: ${validated.error.issues.map((i) => `${i.path.join(".")}=${i.message}`).join("; ")}`;
      continue;
    }

    const post = validated.data;
    if (recentTagsLower.has(post.angle_tag.toLowerCase())) {
      lastError = `angle_tag "${post.angle_tag}" matches a recent post`;
      continue;
    }

    const blockedPhrase = failsBlocklist(post);
    if (blockedPhrase) {
      lastError = `blocklist hit: "${blockedPhrase}"`;
      continue;
    }

    return {
      post,
      attempts: attempt,
      model: MODEL,
      promptVersion: PROMPT_VERSION,
      rawResponse: cleaned,
    };
  }

  throw new Error(`generateDailyPost failed after ${maxAttempts} attempts. Last error: ${lastError}. Last raw response: ${lastRaw.slice(0, 400)}`);
}

/**
 * Generate a clean URL-safe slug for the generated post. Format:
 *   gen-2026-05-11-<random5>
 *
 * Date prefix makes the generated_posts table sort/scan nicely; random
 * suffix prevents collisions when (rarely) two generations happen in the
 * same day. Slug is also used as the render path → keep it lowercase/dashes.
 */
export function generateSlug(now: Date = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  const rnd = Math.random().toString(36).slice(2, 7);
  return `gen-${y}-${m}-${d}-${rnd}`;
}
