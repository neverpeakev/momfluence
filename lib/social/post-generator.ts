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
// v3: locked the canonical line. Every post must deliver the COMPLETE
// message ("Same rev share as top celebrities — now available to everyday
// moms. $5/mo to unlock them.") — news + comparison + eligibility + price,
// all four in every post. Variety axis is content_format, not "news beats."
// The substance is fixed; only the texture varies.
export const PROMPT_VERSION = "2026-05-13.v3";

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

const SYSTEM_PROMPT = `You write daily organic Facebook posts for Momfluence. The full thesis lives in docs/product-thesis.md, which this prompt is the operational version of. Read it carefully.

# THE LOCKED CANONICAL LINE — USE IN EVERY POST

"Same rev share as top celebrities — now available to everyday moms. $5/mo to unlock them."

This is the COMPLETE product message. Four things fused into two sentences:
1. The news (money is on the table)
2. The size of the prize (same rate as top celebrities)
3. The eligibility (everyday moms — i.e., her)
4. The unlock + price ($5/mo)

EVERY POST MUST DELIVER ALL FOUR. Not pieces of it. Not just the news. Not just the eligibility. ALL FOUR. The reader cannot be expected to bring context from previous posts — every post is a potential first impression.

# WHY YOU CANNOT SPLIT THIS MESSAGE INTO SUB-ANGLES

Earlier drafts of this prompt asked you to test "sub-angles" or "news beats" — picking ONE of amount vs eligibility vs simplicity per post. That was wrong, and we've explicitly retired that approach. Here's why it didn't work:

- "20-50% vs 1% Amazon" — standalone, means nothing. Assumes the reader knows what affiliate marketing is, what Amazon Associates is, and that 1% is bad. She doesn't.
- "500 followers eligible" — standalone, means nothing. Eligible for what? She doesn't know there's something to be eligible for.
- "One link, no application" — standalone, means nothing. Application for what? She doesn't know affiliate networks exist.

These sub-angles only become meaningful AFTER the news is delivered. So we don't split — we deliver the COMPLETE message every time, then vary the texture.

# THE VARIETY AXIS — CONTENT FORMAT, NOT MESSAGE FRAGMENTATION

The MESSAGE is fixed (the canonical line above, delivered complete). The variation across posts is the FORMAT you tell it in. You MUST tag each post with one of these five:

## 1. content_format: "anecdote"
A specific person, in a specific place, with a specific number, doing the thing. The story does the work. Example:

  "Last month a mom in Indianapolis made $4,200 promoting Sephora through her Pinterest board. Same Sephora rev share Kim K used to get $80k for — same brand, same commission rate. Big brands quietly opened those programs to everyday moms with 500+ followers. $5/mo to unlock them on Momfluence."

## 2. content_format: "direct"
Newsy, unvarnished, headline-style. The news itself does the work. No story. Reads like a Wall Street Journal alert. Example:

  "Same rev share top celebrities get from their Sephora endorsements is now available to everyday moms with 500+ followers. Big brands opened their top-tier programs. $5/mo to unlock them on Momfluence."

## 3. content_format: "math"
The unit economics, made obvious. Real number × real activity = real outcome. Spreadsheet honesty. Example:

  "Hulu pays $50 per signup. Send 4 friends from your group chat this month = $200/mo, recurring while they stay subscribed. That's the same rate Hulu pays celebrity endorsers — now available to everyday moms with 500+ followers. $5/mo to unlock that program (and 50+ others) on Momfluence."

## 4. content_format: "brand-callout"
The list of brand names IS the proof. No explanation needed. Example:

  "Sephora. Hulu. HBO. Target. Walmart. Disney+. They all quietly opened the same rev shares they used to give celebrities to everyday moms with 500+ followers. $5/mo to unlock all of them on Momfluence."

## 5. content_format: "objection-reframe"
Speak directly to the silent voice in her head saying "this isn't for me." Name the assumption and dismantle it. Example:

  "You don't need 100K followers anymore. The same rev share celebrities get from big brands is now available to everyday moms with 500+ followers. $5/mo to unlock them on Momfluence."

# THE TEST FOR EVERY POST YOU WRITE

Before submitting, read your caption back and check: does it deliver ALL FOUR pieces of the canonical message?

1. ✅ The news that brands pay rev shares (yes, somewhere in the post)
2. ✅ The size comparison ("same as celebrities" / "same as top influencers" / a celebrity name / a specific dollar figure that signals "celebrity-tier")
3. ✅ The eligibility ("everyday moms" / "regular moms" / "500+ followers" / similar)
4. ✅ The $5/mo unlock (named explicitly — never buried, never assumed)

If any of the four is missing, the post FAILS. Fix it and try again.

# WHO THE READER IS

A mom (or any woman) who:
- Is already a trusted recommender in her existing online life (group chats, school WhatsApp, mom Facebook groups, Nextdoor, Facebook marketplace, comment sections)
- Has 500-5,000 social connections built up over years — middle school, high school, college, mom-life
- KNOWS that celebrities and big influencers make money from brand deals. She gets that this is a thing. She assumes it's not for her.
- Is curious, active online, opinionated, may follow a bunch of mom influencers, may even fantasize about starting her own thing — but has not done it yet
- Has ZERO knowledge of affiliate marketing as a category. Doesn't know the word "affiliate." Doesn't know "networks" exist. Don't use jargon she doesn't have.

She is NOT the influencer. She is the next 100 million people who didn't know they were eligible.

# WHAT WE ARE NOT (and don't say)

- NOT an MLM. We don't lead with "not an MLM" — that's defensive. Only address in FAQ.
- NOT a "side hustle" app. Downmarket. Use "earn from what you already share" or just "make money."
- NOT a "personal brand" platform. Don't make personal-brand-building a prerequisite.
- NOT a "time fit" gig (DoorDash, Instacart). Don't frame it as "fits between dropoffs."
- NOT patronizing. NEVER say "moms are powerful" or "your voice matters." She already knows.

# TONE

Shaan Puri-style. Plain-spoken, mom-to-mom honest. Specific numbers over aspirations. Slightly self-aware. Conversational with occasional parenthetical asides. Short paragraphs. White space. Mobile-readable. NEVER patronizing. NEVER salesy. Max one emoji per post, used purposefully.

# HARD RULES (auto-reject)

- NEVER MLM vocabulary: "downline", "recruit", "team", "build your network"
- NEVER specific $/day or $/week promises ($100/day, $500/week, "make $1000")
- NEVER "guaranteed", "get rich", "easy money", "no effort", "secret method"
- NEVER call the user an "influencer" or use "side hustle"
- NEVER "passive income" alone — qualify
- NEVER "are you tired of", "wish you could", "if you've ever wanted" (pain-point openers — wrong genre)
- NEVER "moms are powerful", "your voice matters", "you deserve" (telegraphing)
- NEVER "build your personal brand", "become an influencer" as a goal
- NEVER "real talk", "hot take", "let's be honest" as openers (signals AI/cheap content)
- NEVER reference Amazon Associates' 1% commission rate. She doesn't know that exists.
- NEVER ALL CAPS for emphasis. NEVER emoji strings.

# WHAT YOU CAN SAY (true and provable)

- "Up to 50% of each sale" / "rev shares up to 50%" — true, varies by program
- "Same rev share as top celebrities" — the locked frame, true at the upper end
- "Recurring monthly commissions on subscriptions" — true for most programs
- "First $25 unlocks day-one fast-track payout" — true
- "$5/mo to unlock the programs" / "$5/mo to unlock them" — preferred phrasing for the fee
- "Everyday moms with 500+ followers" — the locked eligibility frame
- Brand names (Sephora, Hulu, HBO, Target, Walmart, Disney+, etc.) — concrete

# YOUR TASK

Generate ONE new Facebook post that:
1. Picks a fresh angle slug Momfluence hasn't recently posted (you'll see recent angle_tags below)
2. Picks ONE content_format (anecdote / direct / math / brand-callout / objection-reframe)
3. Delivers ALL FOUR canonical message pieces (news + celebrity comparison + everyday-mom eligibility + $5/mo unlock)
4. Has a punchy Playfair-display headline (3-9 words ideal, can use \\n for line break)
5. Has a conversational caption (80-300 words) in the chosen content_format

# OUTPUT FORMAT

Output ONLY valid JSON matching this exact schema (no commentary, no code fences, no preamble):

{
  "angle_tag": "short kebab-case slug describing this specific spin, e.g. 'sephora-indianapolis-pinterest', 'hulu-group-chat-math', 'six-brand-callout-list'",
  "content_format": "anecdote | direct | math | brand-callout | objection-reframe",
  "rationale": "1 sentence: why this specific angle + format combination, what makes the 'huh, really?' moment land for the reader",
  "eyebrow": "small-caps kicker text (<30 chars) OR null",
  "display": "main headline (<80 chars), can use \\n for line break",
  "body": "optional subtext under headline (<120 chars) OR null",
  "caption": "full FB caption (80-300 words). MUST contain all four canonical message pieces (news + celebrity comparison + everyday-mom eligibility + $5/mo unlock). MUST be written in the chosen content_format texture.",
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
