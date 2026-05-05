import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { relativeTime } from "@/lib/relative-time";

export const dynamic = "force-dynamic";

const ORDER: Record<string, number> = {
  "sub-affiliate": 0,
  "payout-terms": 1,
  "ftc-disclosure": 2,
  "prohibited-content": 3
};

// Best-effort markdown→plaintext for the index preview. Not a parser; if a
// future agreement has weird syntax we'll patch.
function stripMarkdown(input: string, maxLen = 200): string {
  const text = input
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^>\s+/gm, "")
    .replace(/^-{3,}$/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\n{2,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "…";
}

type AgreementRow = {
  id: string;
  slug: string;
  version: number;
  title: string;
  body_md: string;
  required: boolean;
};

export default async function AgreementsIndexPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: m } = await supabase
    .from("momfluencers")
    .select("status, membership_status, is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!m) redirect("/login");
  if (m.status === "pending" || m.status === "suspended" || m.status === "offboarded") {
    redirect("/pending-approval");
  }
  if (
    m.status === "approved" &&
    !m.is_admin &&
    !["trialing", "active"].includes(m.membership_status ?? "")
  ) {
    redirect("/paywall");
  }

  const { data: rows } = await supabase
    .from("agreements")
    .select("id, slug, version, title, body_md, required")
    .eq("required", true);

  const { data: sigs } = await supabase
    .from("agreement_signatures")
    .select("agreement_id, signed_at")
    .eq("momfluencer_id", user.id);
  const signedAt = new Map<string, string>(
    (sigs ?? []).map((s) => [s.agreement_id as string, s.signed_at as string])
  );

  const agreements = ((rows ?? []) as AgreementRow[]).slice().sort((a, b) => {
    const ao = ORDER[a.slug] ?? 99;
    const bo = ORDER[b.slug] ?? 99;
    if (ao !== bo) return ao - bo;
    return a.slug.localeCompare(b.slug);
  });

  const allSigned =
    agreements.length > 0 && agreements.every((a) => signedAt.has(a.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Program agreements</h1>
        <p className="mt-1 text-navy-600">
          These four agreements form the legal basis of your MomFluence membership.
          You&apos;ll need to sign all of them before generating tracking links or applying
          for gated offers.
        </p>
      </div>

      <div className="space-y-4">
        {agreements.map((a) => {
          const signedTime = signedAt.get(a.id);
          const isSigned = Boolean(signedTime);
          return (
            <div
              key={a.id}
              className="card flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl">{a.title}</h2>
                  <span className="text-xs text-navy-500">v{a.version}</span>
                </div>
                <div>
                  {isSigned ? (
                    <span className="pill bg-green-50 text-green-700">
                      ✓ Signed {relativeTime(signedTime)}
                    </span>
                  ) : (
                    <span className="pill bg-amber-50 text-amber-800">Not signed</span>
                  )}
                </div>
                <p className="text-sm text-navy-600">{stripMarkdown(a.body_md)}</p>
              </div>
              <div className="flex-shrink-0 sm:pt-1">
                <Link
                  href={`/agreements/${a.slug}`}
                  className={isSigned ? "btn-ghost" : "btn-primary"}
                >
                  {isSigned ? "View" : "Review and sign"}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2">
        {allSigned ? (
          <Link href="/dashboard" className="btn-primary">
            Continue to dashboard
          </Link>
        ) : (
          <div>
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="inline-flex items-center justify-center rounded-xl border border-navy-200 bg-navy-50 px-5 py-3 font-medium text-navy-400 cursor-not-allowed"
            >
              Continue to dashboard
            </button>
            <p className="mt-1 text-xs text-navy-500">
              Sign all required agreements first.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
