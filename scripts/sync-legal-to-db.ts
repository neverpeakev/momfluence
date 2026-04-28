/**
 * Read the markdown files in /legal/ and upsert their contents into the
 * matching agreements row (matched on slug + version=1). Run after editing.
 *
 * Usage: tsx scripts/sync-legal-to-db.ts
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const FILES: Record<string, string> = {
  "sub-affiliate":      "sub-affiliate-agreement.md",
  "payout-terms":       "payout-terms.md",
  "ftc-disclosure":     "ftc-disclosure-rules.md",
  "prohibited-content": "prohibited-content.md"
};

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) {
    console.error("set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const sb = createClient(url, key);

  for (const [slug, file] of Object.entries(FILES)) {
    const body = await fs.readFile(path.join(process.cwd(), "legal", file), "utf8");
    const { error } = await sb
      .from("agreements")
      .update({ body_md: body })
      .eq("slug", slug)
      .eq("version", 1);
    if (error) console.warn("update failed", slug, error.message);
    else console.log("synced", slug, `(${body.length} chars)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
