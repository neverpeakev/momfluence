/**
 * Dry-run for the daily post generator. Calls Claude with synthetic
 * "recent posts" context, prints the result. Does NOT touch the DB,
 * does NOT post to FB. Run before deploy to confirm prompt + schema work.
 */
import { loadEnvConfig } from "@next/env";
import { generateDailyPost } from "../lib/social/post-generator";

async function main() {
  loadEnvConfig(process.cwd());
  const result = await generateDailyPost({
    recentAngleTags: ["welcome", "origin", "five-dollar-question", "explainer", "not-mlm", "mom-life", "brand-wall", "the-math", "no-followers", "chatgpt-angle", "stealth-income", "school-hours", "fast-track", "vs-amazon", "soft-cta"],
    recentDisplays: [
      "We just launched.\nWelcome.",
      "Built for moms who recommend things for free their whole lives.",
      "How it works",
      "MomFluence is NOT an MLM.",
    ],
    recentContentFormats: ["anecdote", "anecdote", "anecdote"],
    recentAccentBadges: ["$340", "$340", "$180"],
    recentImageBgs: ["warm-gradient", "warm-gradient", "navy-coral-gradient"],
  });
  console.log("✓ Generated successfully");
  console.log("  attempts:", result.attempts);
  console.log("  angle_tag:", result.post.angle_tag);
  console.log("  rationale:", result.post.rationale);
  console.log("  display:", JSON.stringify(result.post.display));
  console.log("  eyebrow:", result.post.eyebrow);
  console.log("  body:", result.post.body);
  console.log("  image_bg:", result.post.image_bg);
  console.log("  accent_badge:", result.post.accent_badge);
  console.log("  display_color:", result.post.display_color);
  console.log("\n--- CAPTION ---");
  console.log(result.post.caption);
}
main().catch(e => { console.error(e); process.exit(1); });
