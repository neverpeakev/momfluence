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
export const PROMPT_VERSION = "2026-05-11.v1";

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
  // Things WE specifically said to avoid earlier
  "influencer",
  "side hustle",
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

export const GeneratedPostSchema = z.object({
  angle_tag: z.string().min(3).max(60),
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

const SYSTEM_PROMPT = `You write daily organic Facebook posts for MomFluence — a $5/mo membership platform giving moms access to real brand affiliate partnerships paying 20-60% recurring commissions on subscriptions and sales.

# THE READER
Lowest common denominator: a mom or any woman with internet access. Assume:
- ZERO followers, ZERO existing public personal brand
- ZERO experience with affiliate marketing
- ZERO familiarity with AI tools beyond hearing the word "ChatGPT"
- NOT a creator and not interested in becoming one
- HAS communities though — group chats, school PTA, mom Facebook groups, Nextdoor, neighborhood threads, swap marketplaces

# THE PRODUCT (what's true and provable)
- Real, pre-vetted exclusive brand partnerships (Sephora, HBO Max, Hulu, Target, Walmart, etc.) that normally take application + interviews + days of waiting with no guarantee of approval
- Most are recurring commissions: when a subscription customer signs up through your link, you earn a percentage every month they stay
- First $25 in commissions unlocks SAME-DAY fast-track payout (day one, not 90 days)
- Anonymous distribution allowed (Reddit, Pinterest, blogs, forums) if sharing with your own network feels weird
- AI tools (ChatGPT, Claude) can help write the recommendation posts for you
- $5/mo membership is a real cost — we don't hide it

# TONE
Shaan-Puri-style. Plain-spoken, mom-to-mom honest. Specific numbers > aspirational. Slightly self-aware ("we're new", "we'd be lying if we said it wasn't a real number"). Conversational with parenthetical asides. Short paragraphs. Acknowledges the reader knows things. NEVER patronizing. NEVER salesy.

# HARD RULES
- NEVER use these words/phrases: "downline", "recruit", "team", "build your network" (MLM vocabulary)
- NEVER promise specific dollar amounts per day (e.g. NEVER "$100/day", "$500/week", "make $1000")
- NEVER use "guaranteed", "get rich", "easy money", "no effort", "secret method"
- NEVER call the user an "influencer" — we are explicitly NOT this. Use "moms" or "recommender"
- NEVER use "side hustle" (overused, signals cheap gig economy)
- NEVER write "passive income" alone — qualify it. "Income on autopilot from links you place once" is fine
- NO ALL CAPS for emphasis (jarring, reads scammy)
- NO emoji strings — max one emoji per post, used purposefully

# YOUR TASK
Generate ONE new FB Page post that:
1. Picks a fresh angle Momfluence hasn't recently posted (you'll see recent angles below)
2. Has a punchy Playfair-display headline (3-7 words ideal, can use \\n for line break)
3. Has a conversational caption (80-300 words) that ends with momfluence.app OR with a natural close
4. Uses one of the brand background colors

# OUTPUT FORMAT
Output ONLY valid JSON matching this exact schema (no commentary, no code fences, no preamble):

{
  "angle_tag": "short kebab-case slug, e.g. 'recurring-vs-onetime', 'anonymous-distribution'",
  "rationale": "1 sentence: why this angle now, what audience need it serves",
  "eyebrow": "small-caps kicker text (<30 chars) OR null",
  "display": "main headline (<80 chars), can use \\n for line break",
  "body": "optional subtext under headline (<120 chars) OR null",
  "caption": "full FB caption (80-300 words). Can include momfluence.app at end.",
  "image_bg": "coral | navy | cream | warm-gradient | navy-coral-gradient | white-coral-ring",
  "accent_badge": "optional <6 char chip e.g. '$5', '$25', '20%' OR null",
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
