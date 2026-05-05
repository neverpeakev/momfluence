import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ReactMarkdown, { type Components } from "react-markdown";
import { createClient } from "@/lib/supabase/server";
import { relativeTime } from "@/lib/relative-time";
import SignAgreementForm from "../SignAgreementForm";

export const dynamic = "force-dynamic";

type Agreement = {
  id: string;
  slug: string;
  version: number;
  title: string;
  body_md: string;
  required: boolean;
  effective_at: string | null;
};

const md: Components = {
  h1: (props) => (
    <h1
      className="text-2xl font-display font-semibold text-navy-900 mt-6 mb-3"
      {...props}
    />
  ),
  h2: (props) => (
    <h2
      className="text-xl font-display font-semibold text-navy-900 mt-5 mb-2"
      {...props}
    />
  ),
  h3: (props) => (
    <h3 className="text-lg font-medium text-navy-900 mt-4 mb-2" {...props} />
  ),
  p: (props) => <p className="text-navy-700 leading-relaxed mb-3" {...props} />,
  ul: (props) => (
    <ul className="list-disc pl-5 mb-3 text-navy-700 space-y-1" {...props} />
  ),
  ol: (props) => (
    <ol className="list-decimal pl-5 mb-3 text-navy-700 space-y-1" {...props} />
  ),
  li: (props) => <li className="leading-relaxed" {...props} />,
  strong: (props) => <strong className="font-semibold text-navy-900" {...props} />,
  em: (props) => <em className="italic" {...props} />,
  a: (props) => (
    <a className="text-coral-600 hover:text-coral-700 underline" {...props} />
  ),
  hr: (props) => <hr className="border-t border-navy-100 my-6" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="border-l-4 border-navy-200 pl-4 italic text-navy-600 my-3"
      {...props}
    />
  )
};

function formatEffective(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

export default async function AgreementDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Status + membership gates BEFORE we fetch + parse the agreement body.
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

  const { data: agreement } = await supabase
    .from("agreements")
    .select("id, slug, version, title, body_md, required, effective_at")
    .eq("slug", slug)
    .maybeSingle<Agreement>();
  if (!agreement) notFound();

  const { data: sig } = await supabase
    .from("agreement_signatures")
    .select("signed_at, signature_text")
    .eq("momfluencer_id", user.id)
    .eq("agreement_id", agreement.id)
    .maybeSingle();

  const signedAtAbsolute = sig
    ? new Date(sig.signed_at).toLocaleDateString("en-US", { dateStyle: "long" })
    : null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href="/agreements"
          className="text-sm text-navy-500 no-underline hover:underline"
        >
          ← Back to agreements
        </Link>
      </div>

      <div>
        <h1 className="text-3xl">{agreement.title}</h1>
        <p className="mt-1 text-sm text-navy-500">
          Version {agreement.version} · Effective {formatEffective(agreement.effective_at)}
        </p>
      </div>

      <article className="card">
        <ReactMarkdown components={md}>{agreement.body_md}</ReactMarkdown>
      </article>

      {sig ? (
        <div className="card border-l-4 border-green-500">
          <p className="text-sm text-navy-700">
            You signed this on <strong>{signedAtAbsolute}</strong>{" "}
            <span className="text-navy-500">({relativeTime(sig.signed_at)})</span>.
          </p>
          <p className="mt-1 text-sm text-navy-700">
            Your typed name on file: <strong>{sig.signature_text}</strong>
          </p>
          <Link href="/agreements" className="btn-ghost mt-4">
            Back to agreements
          </Link>
        </div>
      ) : (
        <div className="card">
          <SignAgreementForm agreementId={agreement.id} />
        </div>
      )}
    </div>
  );
}
