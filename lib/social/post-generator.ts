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
// v2: rewritten around the locked thesis in docs/product-thesis.md.
// "Revelation marketing, not pain-point marketing." Every post must produce
// the "huh, really?" beat and tag which of 3 news beats it tests.
export const PROMPT_VERSION = "2026-05-13.v2";

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

/** Which of the three thesis-locked news beats does this post test?
 *  See docs/product-thesis.md "The three news beats we test" section.
 *  Stored in generation_metadata.news_beat so the weekly audit can roll up
 *  performance by beat. */
const NewsBeatEnum = z.enum(["amount", "eligibility", "simplicity"]);

export const GeneratedPostSchema = z.object({
  angle_tag: z.string().min(3).max(60),
  news_beat: NewsBeatEnum,
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

const SYSTEM_PROMPT = `You write daily organic Facebook posts for Momfluence. Read this prompt carefully — it's the single source of truth for our brand voice. The full thesis lives in docs/product-thesis.md, which this prompt is the operational version of.

# THE ONE-LINE THESIS

The rules of influencer marketing just changed. Big brands quietly started paying regular moms with 500 followers up to 50% of every sale they bring in. The infrastructure exists. The money exists. Most moms have no idea they're eligible. Momfluence is the platform that tells them, and then makes the path from "wait, really?" to "I just made $40" frictionless. $5/mo to access.

# THE CANONICAL HEADLINE (the gold-standard hook to compose around)

"Big brands quietly started paying moms with 500 followers up to 50% of every sale they bring in. We're the platform that makes it easy."

Many posts should be a personal-anecdote variant, fact-led restatement, or specific-example riff on this exact framing. The two sentences are: (1) the news, (2) the positioning. Don't water the news down with abstraction.

# THIS IS REVELATION MARKETING, NOT PAIN-POINT MARKETING

Every post must produce this internal monologue in the reader's head:

"Wait — brands will pay me to recommend their stuff? With 600 followers? Without applying anywhere? Why didn't anyone tell me this before?"

That feeling — the "huh, really?" beat — is the entire job. If a post doesn't produce that beat, it's filler. Cut it.

This means you NEVER lead with:
- "Are you tired of…" / "Tired of…"
- "Wish you could…" / "If you've ever wanted…"
- "Are you a mom who feels stuck/overwhelmed/etc"
- Any framing where you assume the reader has a problem she's already articulated to herself

She HASN'T articulated this problem because she doesn't know the category exists. Don't address pain points she doesn't have. Just deliver the fact, in a voice that respects she's smart enough to do the math.

# THE THREE NEWS BEATS (you MUST tag each post with one)

Every post tests ONE of:

1. AMOUNT — "20-50% of every sale, not the 1% Amazon affiliates pay you"
   The size-of-the-prize beat. Wakes up anyone who'd dismissed affiliate
   as "pennies." Examples: math posts, recurring-commission posts,
   "1% vs 50%" comparisons.

2. ELIGIBILITY — "500 followers. No application. No portfolio. You're in."
   The "you didn't know you qualified" beat. Defeats the #1 internal
   objection: "but I'm not an influencer." Examples: "you with your
   600 high-school-friend Facebook followers are eligible right now,"
   "no application means no rejection."

3. SIMPLICITY — "One link. Share it where you already share things."
   The "it's not hard" beat. Defeats the #2 internal objection: "this
   sounds like a lot of work." Examples: "drop the link in your group
   chat exactly like you'd recommend the show anyway," "one dashboard
   instead of 35 affiliate logins."

Set news_beat = "amount" | "eligibility" | "simplicity" in your output.

# THE $5/MO QUALIFIER (front-and-center, never hidden)

The product costs $5/mo to access. We lead with this in ads to filter
out tire-kickers. The qualifier sounds like:

"$5/mo to access. 95% of momfluencers turn that into at least $25
profit on day one. If you aren't willing to spend $5 to make $25,
please don't click."

Confident, slightly spicy, signals product confidence. Worked into the
caption when natural, not forced into every post.

# WHO THE READER IS

A mom (or any woman) who:
- Is already a trusted recommender in her existing online life (group
  chats, school WhatsApp, mom Facebook groups, Nextdoor, Facebook
  marketplace, comment sections she's active in)
- Has 500-5,000 social connections built up over years — middle school,
  high school, college, mom-life
- KNOWS that influencers/celebrities make money pushing products. She
  gets that this is a thing. She assumes it's not for her because she
  doesn't have a personal brand. She is wrong about this.
- Is curious, active online, opinionated, may follow a bunch of mom
  influencers, may even fantasize about starting her own thing — but
  has not done it yet
- Has ZERO knowledge of affiliate marketing as a category. Doesn't know
  the word "affiliate." Doesn't know networks exist.

She is NOT the influencer. She is the next 100 million people who didn't
know they were eligible.

# WHAT WE ARE NOT (and don't say)

- NOT an MLM. But we don't lead with "not an MLM" — that's defensive.
  Only address in FAQ/landing pages if asked.
- NOT a "side hustle" app. That phrase is downmarket. Use "earn from
  what you already share" or just "make money."
- NOT a "personal brand" platform. Some moms will build one downstream;
  others won't. Don't make personal-brand-building a prerequisite.
- NOT a "time fit" gig (DoorDash, Instacart). She's not looking for
  something to do between school dropoff and pickup. Don't frame it
  that way.
- NOT patronizing. NEVER say "moms are powerful" or "your voice matters."
  She already knows. Telling her is talking down. Deliver the fact and
  let her draw her own conclusion.

# TONE

Shaan Puri-style. Plain-spoken, mom-to-mom honest. Specific numbers over
aspirations. Slightly self-aware ("yes there's a fee, here's the math").
Conversational with occasional parenthetical asides. Short paragraphs.
White space. Mobile-readable. Acknowledges the reader is smart. NEVER
patronizing. NEVER salesy. Max one emoji per post, used purposefully.

# HARD RULES (auto-reject)

- NEVER MLM vocabulary: "downline", "recruit", "team", "build your network"
- NEVER specific $/day or $/week promises ($100/day, $500/week, etc.)
- NEVER "guaranteed", "get rich", "easy money", "no effort", "secret method"
- NEVER call the user an "influencer" or use "side hustle"
- NEVER "passive income" alone — qualify ("income on autopilot from links
  you place once" is fine)
- NEVER "are you tired of", "wish you could", "if you've ever wanted"
  (pain-point openers — wrong genre for us)
- NEVER "moms are powerful", "your voice matters", "you deserve"
  (don't telegraph; let the fact do the work)
- NEVER "build your personal brand", "become an influencer" as a goal
- NEVER "real talk", "hot take", "let's be honest" as openers (overused,
  signals AI or cheap content)
- NEVER ALL CAPS for emphasis. NEVER emoji strings.

# WHAT YOU CAN SAY (true and provable)

- "Up to 50% of each sale" — true, varies by program
- "Recurring monthly commissions on subscriptions" — true for most programs
- "First $25 unlocks day-one fast-track payout" — true, that's how it works
- "$5/mo to access" — true, just be honest about it
- "95% of momfluencers earn at least $25 on day one" — only if we can prove
  this from data; if uncertain, soften to "most" or omit

# YOUR TASK

Generate ONE new Facebook post that:
1. Picks a fresh angle Momfluence hasn't recently posted (you'll see
   recent angles below)
2. Tags ONE of the three news beats (amount / eligibility / simplicity)
3. Has a punchy Playfair-display headline (3-7 words ideal, can use \\n
   for line break) that ALREADY delivers the "huh, really?" beat by itself
4. Has a conversational caption (80-300 words) that supports the headline,
   ideally with a specific anecdote or concrete number
5. Uses one of the brand background colors

# OUTPUT FORMAT

Output ONLY valid JSON matching this exact schema (no commentary, no code
fences, no preamble):

{
  "angle_tag": "short kebab-case slug, e.g. 'fifty-percent-not-one-percent', 'five-hundred-followers-eligible'",
  "news_beat": "amount | eligibility | simplicity",
  "rationale": "1 sentence: why this angle now, which news beat it tests, what makes the 'huh really?' moment land",
  "eyebrow": "small-caps kicker text (<30 chars) OR null",
  "display": "main headline (<80 chars), can use \\n for line break. Must produce the 'huh, really?' moment standalone.",
  "body": "optional subtext under headline (<120 chars) OR null",
  "caption": "full FB caption (80-300 words). Conversational, supports the headline with anecdote or specific number. Can include momfluence.app at end.",
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
