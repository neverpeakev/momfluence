import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient } from "@/lib/supabase/server";
import SignAgreementForm from "./SignAgreementForm";

export const dynamic = "force-dynamic";

const FILE_BY_SLUG: Record<string, string> = {
  "sub-affiliate":      "sub-affiliate-agreement.md",
  "payout-terms":       "payout-terms.md",
  "ftc-disclosure":     "ftc-disclosure-rules.md",
  "prohibited-content": "prohibited-content.md"
};

async function loadBody(slug: string, fallback: string): Promise<string> {
  const f = FILE_BY_SLUG[slug];
  if (!f) return fallback;
  try {
    return await fs.readFile(path.join(process.cwd(), "legal", f), "utf8");
  } catch {
    return fallback;
  }
}

export default async function AgreementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: agreementsRaw } = await supabase
    .from("agreements")
    .select("id, slug, version, title, body_md, required")
    .order("required", { ascending: false })
    .order("slug");

  const { data: signedRows } = await supabase
    .from("agreement_signatures")
    .select("agreement_id, signed_at")
    .eq("momfluencer_id", user.id);

  const signed = new Map((signedRows ?? []).map((s) => [s.agreement_id, s.signed_at]));

  const agreements = await Promise.all(
    (agreementsRaw ?? []).map(async (a) => ({ ...a, body_md: await loadBody(a.slug, a.body_md) }))
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl">Program agreements</h1>
        <p className="mt-1 text-navy-600">Sign before you can generate tracking links. Re-signing is required when a new version is published.</p>
      </div>

      {agreements.map((a) => (
        <article key={a.id} className="card">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl">{a.title}</h2>
              <p className="text-xs text-navy-500 mt-1">v{a.version}</p>
            </div>
            {signed.has(a.id) ? (
              <span className="pill bg-green-100 text-green-800">Signed {new Date(signed.get(a.id)!).toLocaleDateString()}</span>
            ) : a.required ? (
              <span className="pill bg-coral-100 text-coral-800">Required</span>
            ) : (
              <span className="pill bg-navy-100 text-navy-700">Optional</span>
            )}
          </header>

          <div className="prose prose-sm mt-4 max-h-96 overflow-y-auto rounded border border-navy-100 bg-navy-50/40 p-4 whitespace-pre-wrap">
            {a.body_md}
          </div>

          {!signed.has(a.id) && <SignAgreementForm agreementId={a.id} />}
        </article>
      ))}
    </div>
  );
}
