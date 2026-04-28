/**
 * Import momfluencer leads from the marketing-side Google Sheet (via the Apps Script
 * read endpoint) into Supabase as momfluencers with status='pending'.
 *
 * Usage: tsx scripts/import-from-sheet.ts
 *
 * The Apps Script GET endpoint currently returns `{status:"ok"}` — it needs to be
 * extended to return the rows. When that's done, this script is plug-and-play.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const sheetUrl = process.env.APPS_SCRIPT_LEAD_URL!;

if (!url || !serviceKey || !sheetUrl) {
  console.error("missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / APPS_SCRIPT_LEAD_URL");
  process.exit(1);
}

type Row = {
  email: string;
  first_name?: string;
  last_name?: string;
  instagram?: string;
  city?: string;
  follower_count?: string;
  submitted_at?: string;
};

async function main() {
  console.log("fetching sheet…");
  const r = await fetch(`${sheetUrl}?action=list&token=${process.env.APPS_SCRIPT_READ_TOKEN ?? ""}`);
  if (!r.ok) {
    console.error("sheet fetch failed:", r.status, await r.text());
    process.exit(1);
  }
  const json = await r.json();
  if (!Array.isArray(json.rows)) {
    console.error("unexpected sheet response (extend Apps Script doGet to return {rows:[…]}):", json);
    process.exit(1);
  }
  const rows: Row[] = json.rows;
  const sb = createClient(url, serviceKey);

  let inserted = 0, skipped = 0;
  for (const row of rows) {
    if (!row.email) { skipped++; continue; }
    // Look up existing auth user by email; create one if not present.
    const { data: existing } = await sb.from("momfluencers").select("id").eq("email", row.email).maybeSingle();
    if (existing) { skipped++; continue; }

    const { data: created, error: cErr } = await sb.auth.admin.createUser({ email: row.email, email_confirm: false });
    if (cErr || !created.user) { console.warn("createUser failed", row.email, cErr?.message); skipped++; continue; }

    const { error } = await sb.from("momfluencers").update({
      first_name: row.first_name ?? null,
      last_name: row.last_name ?? null,
      instagram_handle: row.instagram ?? null,
      city: row.city ?? null,
      follower_band: row.follower_count ?? null,
      utm_source_at_signup: "marketing-form"
    }).eq("id", created.user.id);

    if (error) console.warn("profile update failed", row.email, error.message);
    inserted++;
  }
  console.log(`done. inserted=${inserted} skipped=${skipped}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
