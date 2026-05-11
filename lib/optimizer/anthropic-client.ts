/**
 * Variant remix via Claude.
 *
 * Given a winning variant's hypothesis + hero copy + observed performance,
 * ask Claude Opus 4.7 to produce 3 distinct remix candidates the marketer
 * can review and (optionally) promote into VARIANTS.
 *
 * Output is constrained JSON. The optimizer NEVER auto-launches generated
 * variants — it queues them as `remix_proposed` actions for human review
 * in /admin/optimizer.
 */

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { FunnelVariant } from "@/lib/funnel-lab/variants";

const MODEL = "claude-opus-4-7";
const MAX_TOKENS = 2000;

function client(): Anthropic {
  const apiKey = process.env.anthropic_public_api_key ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("anthropic_public_api_key not set");
  return new Anthropic({ apiKey: apiKey.trim() });
}

/** Schema for a single remix candidate. Mirrors the FunnelVariant.hero shape.
 *  Limits are LLM-forgiving — Claude often emits psychographic angles longer
 *  than terse tags and slightly-overlong headlines; failing the simulate run
 *  on a 41-char angle isn't useful, so we leave headroom and downstream
 *  consumers (admin review, ad creation) can hard-truncate if they need to. */
const RemixSchema = z.object({
  hypothesis: z.string().min(10).max(400),
  angle: z.string().min(3).max(100),
  hero: z.object({
    eyebrow: z.string().min(3).max(100),
    headline: z.string().min(5).max(200),
    subhead: z.string().min(10).max(400),
    ctaPrimary: z.string().min(3).max(80),
    ctaSecondary: z.string().min(3).max(80),
  }),
  closer: z.object({
    headline: z.string().min(3).max(120),
    subhead: z.string().min(5).max(240),
  }),
  notes: z.string().min(5).max(500),
});

const RemixResponseSchema = z.object({ candidates: z.array(RemixSchema).length(3) });

export type RemixCandidate = z.infer<typeof RemixSchema>;

const SYSTEM_PROMPT = `You are an expert direct-response copywriter for a women-targeted side-income product called MomFluence ($5/mo membership that gives moms access to real brand affiliate programs paying 20–60% recurring commissions).

The reader is a mom or any woman with internet access — assume:
- ZERO followers
- ZERO experience with affiliate marketing
- ZERO familiarity with AI tools beyond hearing the word "ChatGPT"
- NOT a creator and not interested in becoming one

Your job: given a winning landing-page variant, produce 3 DISTINCT remix candidates that test ADJACENT psychographic angles. Each must be jargon-free, plain-spoken, and pull on a different emotional thread than the winner.

Hard rules:
- NEVER promise specific dollar amounts beyond the $25 day-one fast-track payout that the product actually delivers.
- NEVER use "passive income" without qualification — "income on autopilot from links you place once" is fine; "passive income" alone reads MLM.
- NEVER promise anyone they'll get rich.
- NO emoji-heavy or all-caps copy.
- Keep hero headlines under 100 characters. Subheads under 280.
- Each candidate must be IDENTIFIABLY DIFFERENT — not paraphrased versions of the winner.

Return ONLY valid JSON matching this schema:
{
  "candidates": [
    {
      "hypothesis": "one-sentence hypothesis this variant tests",
      "angle": "short psychographic tag (e.g. 'recovering shopper', 'snowbird grandma')",
      "hero": {
        "eyebrow": "short uppercase-style preamble",
        "headline": "main pull, can contain \\n for line break",
        "subhead": "1-2 sentences",
        "ctaPrimary": "button label",
        "ctaSecondary": "secondary link label"
      },
      "closer": { "headline": "short", "subhead": "short" },
      "notes": "what this candidate tests + why it should beat the winner"
    },
    ... 2 more candidates ...
  ]
}`;

export async function generateRemixCandidates(winner: FunnelVariant, stats: {
  visits: number;
  conversions: number;
  spendUsd: number;
  cpaUsd: number;
}): Promise<RemixCandidate[]> {
  const userPrompt = `Winning variant:
- slug: ${winner.slug}
- label: ${winner.label}
- angle: ${winner.angle}
- hypothesis: ${winner.hypothesis}
- eyebrow: ${winner.hero.eyebrow}
- headline: ${winner.hero.headline}
- subhead: ${winner.hero.subhead}
- ctaPrimary: ${winner.hero.ctaPrimary}
- closer.headline: ${winner.closer.headline}
- closer.subhead: ${winner.closer.subhead}

Observed performance (last 7 days):
- visits: ${stats.visits}
- conversions: ${stats.conversions}
- spend: $${stats.spendUsd.toFixed(2)}
- CPA: $${stats.cpaUsd.toFixed(2)}

Produce 3 remix candidates. Each should test a DIFFERENT angle adjacent to this winner — not minor paraphrasing.`;

  const res = await client().messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  // Defensive: pull the first text block.
  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No text content in Anthropic response");

  const text = block.text.trim();
  // Strip code fences if Claude wrapped the JSON.
  const cleaned = text.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Anthropic response was not valid JSON: ${cleaned.slice(0, 300)}`);
  }

  const validated = RemixResponseSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(`Anthropic response did not match schema: ${validated.error.message}`);
  }

  return validated.data.candidates;
}

export const ANTHROPIC_MODEL = MODEL;
