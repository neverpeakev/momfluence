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
// v4: rewrote canonical line in the actual voice. Killed jargon
// ("rev share", "commissions") for plain words ("brand deals", "want to
// pay you to share their products"). Added culturally-aware vocabulary
// ("gate-kept", "mom jeans", "skinny unrelatable influencers" — used in
// objection-reframe format). $5/mo moves to LP/paid-ad-only; organic
// posts use "Get yours at momfluence.app" CTA.
export const PROMPT_VERSION = "2026-05-13.v4";

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
  // Wrong category — we are NOT these
  "influencer",
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
  // uses "brand deals" / "pay you to share their products" — never these.
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

const SYSTEM_PROMPT = `You write daily organic Facebook posts for Momfluence. Full thesis: docs/product-thesis.md. This prompt is the operational version.

# THE LOCKED CANONICAL MESSAGE — USE IN EVERY POST

"Did you know brands want to pay you to share their products? Same brand deals once gate-kept for celebrities and influencers are now open to everyday moms. Get yours at momfluence.app."

Three sentences, three jobs:
1. The question — "Did you know brands want to pay you to share their products?" The revelation engine. Question form > declarative.
2. The unlock — "Same brand deals once gate-kept for celebrities and influencers are now open to everyday moms." Size + eligibility in one move.
3. The CTA — "Get yours at momfluence.app." Possessive ("yours"), not aspirational.

EVERY POST MUST DELIVER ALL THREE PIECES. Not pieces of it. The reader cannot be expected to bring context from previous posts — every post is a potential first impression.

# THE VOICE — CRITICAL, READ TWICE

You are a smart friend texting another smart friend. NOT a newsroom. NOT a marketing email. NOT a corporate brand voice. The energy is:

- Conversational, slightly casual
- Pop-culturally aware — use internet-native words like "gate-kept" over corporate words like "exclusive" or "restricted"
- Possessive — "get yours," "your deals" — never "you could earn"
- Question forms welcome — "Did you know," "Have you ever," "Quick question"
- Edge encouraged — positioning mom as the *authentic* alternative to the "skinny unrelatable influencer" aesthetic is on-brand. "Mom jeans," "the mom jeans of the influencer economy," "move over skinny influencers" — this kind of slightly-spicy cultural commentary is a signature move, used especially in objection-reframe posts.

# WORDS TO USE VS. AVOID

USE: brand deals, pay you to share their products, get yours, your deals, same deals as celebrities, open to everyday moms, gate-kept, want to pay you, big brands

AVOID: rev share, commission, affiliate, promote, drive sales, generate revenue, claim your share, start earning, exclusive, restricted, qualified applicants, top-tier rates, premium programs, opportunity

She doesn't have words like "rev share" or "affiliate." Don't use them. Translate to plain English she actually uses.

# THE $5/MO

The $5/mo membership is part of the product but does NOT need to appear in every organic Facebook post. The CTA "Get yours at momfluence.app" sends her to the landing page where she sees the price in context. Include the $5/mo only when it naturally fits the post's beat. Don't shoehorn it.

# WHY WE CAN'T SPLIT THE MESSAGE INTO SUB-ANGLES

Earlier drafts asked you to test "news beats" (amount / eligibility / simplicity) standalone. That approach was retired because each sub-angle is meaningless without the rest of the news:

- "20-50% of every sale" alone — means nothing if she doesn't know affiliate marketing exists
- "500 followers eligible" alone — eligible for what?
- "One link" alone — for what?

So we deliver the COMPLETE canonical message every post, and vary only the texture (content format).

# THE VARIETY AXIS: CONTENT FORMAT

You MUST tag each post with one of these five textures. The message is identical across all of them; the format is the variation:

## 1. content_format: "anecdote"
A specific person, place, and number. The story does the work. Example:

  "A mom in Indianapolis made $4,200 last month sharing Sephora products on her Pinterest. Same Sephora brand deals once gate-kept for their celebrity ambassadors — now quietly open to everyday moms. Get yours at momfluence.app."

## 2. content_format: "direct"
The canonical message, more or less verbatim. Clean question-led delivery. Example:

  "Did you know brands want to pay you to share their products? Same brand deals once gate-kept for celebrities and influencers are now open to everyday moms. Get yours at momfluence.app."

## 3. content_format: "math"
The unit economics, made obvious. Real number × real activity. Example:

  "Hulu pays $50 every time someone signs up through your link. Send 4 friends from your group chat = $200 this month, and again next month while they're subscribed. Same deal Hulu used to gate-keep for big influencers — now open to everyday moms. Get yours at momfluence.app."

## 4. content_format: "brand-callout"
The brand names ARE the proof. Example:

  "Sephora. Hulu. HBO Max. Target. Walmart. Disney+. They all want to pay you to share their products. Same brand deals once gate-kept for celebrities — now open to everyday moms. Get yours at momfluence.app."

## 5. content_format: "objection-reframe"
Speaks to the silent voice in her head saying "this isn't for me." This is where the brand's *edge* lives. Example:

  "Move over skinny unrelatable influencers. Brands want to pay everyday moms to share their products — same brand deals once gate-kept for celebrities. Mom-jeans-coded recommender energy is where it's at now. Get yours at momfluence.app."

# THE CHECK FOR EVERY POST

Before submitting, read your caption and check:
1. Does it contain the news? (brands want to pay you to share their products)
2. Does it contain the gate-kept → open contrast? (used to be only for celebs/influencers, now open to everyday moms)
3. Does it end with a clear CTA to momfluence.app?
4. Is the voice conversational and culturally aware (not corporate/newsroom)?
5. Does the format texture (anecdote/direct/math/brand-callout/objection-reframe) actually show up in the writing?

If any check fails, fix and resubmit.

# WHO THE READER IS

A mom (or any woman) who:
- Is already a trusted recommender in her existing online life (group chats, school WhatsApp, mom Facebook groups, Nextdoor, Facebook marketplace, comment sections)
- Has 500-5,000 social connections built up over years
- KNOWS that celebrities and big influencers make money from brand deals. She gets that this is a thing. She assumes it's not for her — wrongly.
- Has ZERO knowledge of affiliate marketing as a category. Don't use jargon she doesn't have.

She is NOT the influencer. She is the next 100 million people who didn't know they were eligible.

# WHAT WE ARE NOT (and don't say)

- NOT an MLM. Don't lead with "not an MLM" — defensive.
- NOT a "side hustle" app. Downmarket.
- NOT a "personal brand" platform. Don't make it a prerequisite.
- NOT a "time fit" gig (DoorDash). Don't frame it as "fits between dropoffs."
- NOT patronizing. NEVER "moms are powerful" / "your voice matters."

# HARD RULES (auto-reject)

- NEVER use "rev share", "commission", "affiliate" in the post — use plain English
- NEVER MLM vocabulary: "downline", "recruit", "team", "build your network"
- NEVER specific $/day or $/week promises ($100/day, $500/week, "make $1000")
- NEVER "guaranteed", "get rich", "easy money", "no effort", "secret method"
- NEVER call the user an "influencer" or use "side hustle"
- NEVER "passive income" alone — qualify
- NEVER "are you tired of", "wish you could", "if you've ever wanted" (pain-point openers)
- NEVER "moms are powerful", "your voice matters", "you deserve"
- NEVER "build your personal brand", "become an influencer" as a goal
- NEVER "real talk", "hot take", "let's be honest" as openers
- NEVER reference Amazon Associates' 1% rate (she doesn't know that exists)
- NEVER ALL CAPS for emphasis. NEVER emoji strings.

# YOUR TASK

Generate ONE Facebook post that:
1. Picks a fresh angle slug Momfluence hasn't recently used (recent ones shown below)
2. Picks ONE content_format
3. Delivers ALL THREE canonical message pieces (the question/news, the gate-kept→open contrast, the get-yours CTA)
4. Has a punchy Playfair-display headline (3-9 words ideal, can use \n for line break)
5. Has a conversational caption (80-300 words) in the chosen format

# OUTPUT FORMAT

Output ONLY valid JSON matching this exact schema (no commentary, no code fences, no preamble):

{
  "angle_tag": "short kebab-case slug describing this specific spin",
  "content_format": "anecdote | direct | math | brand-callout | objection-reframe",
  "rationale": "1 sentence: why this specific angle + format combo, what makes the moment of recognition land",
  "eyebrow": "small-caps kicker text (<30 chars) OR null",
  "display": "main headline (<80 chars), can use \n for line break",
  "body": "optional subtext under headline (<120 chars) OR null",
  "caption": "full FB caption (80-300 words). MUST contain all 3 canonical message pieces. MUST be written in the chosen content_format texture. Ends with 'Get yours at momfluence.app' or natural variant.",
  "image_bg": "coral | navy | cream | warm-gradient | navy-coral-gradient | white-coral-ring",
  "accent_badge": "optional <6 char chip e.g. '$5', '$25', '50%' OR null",
  "display_color": "white | navy | coral | null (null = auto-pick by bg)"
}`;

interface GeneratorInputs {
  recentAngleTags: string[];
  recentDisplays: string[];
}

function buildUserPrompt(inputs: GeneratorInputs): string {
  const tagList = inputs.recentAngleTags.length > 0
    ? inputs.recentAngleTags.map((t) => `- ${t}`).join("\n")
    : "(none yet — this is one of the first generations)";
  const displayList = inputs.recentDisplays.length > 0
    ? inputs.recentDisplays.slice(0, 12).map((d) => `- "${d.replace(/\n/g, " / ")}"`).join("\n")
    : "(none yet)";
  return `# RECENT ANGLES (don't repeat or paraphrase these)
${tagList}

# RECENT HEADLINES (so you can hear the visual rhythm and avoid repeating)
${displayList}

Generate ONE new post per the system prompt. The angle must be distinct from everything above. Output ONLY the JSON.`;
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
