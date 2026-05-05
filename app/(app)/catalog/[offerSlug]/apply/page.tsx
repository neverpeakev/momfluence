import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ApplyForm, { type FormSchema } from "./ApplyForm";

export const dynamic = "force-dynamic";

type Offer = {
  id: string;
  slug: string;
  title: string;
  brand: string | null;
  status: string;
  access_model: "open" | "application_required";
  application_form_schema: FormSchema | null;
};

export default async function ApplyPage({
  params
}: {
  params: Promise<{ offerSlug: string }>;
}) {
  const { offerSlug } = await params;
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

  const { data: offer } = await supabase
    .from("offers")
    .select("id, slug, title, brand, status, access_model, application_form_schema")
    .eq("slug", offerSlug)
    .maybeSingle<Offer>();
  if (!offer) notFound();
  if (offer.status !== "active" || offer.access_model !== "application_required") {
    redirect("/catalog");
  }

  // UNIQUE (momfluencer_id, offer_id) means one row per mom per offer.
  // If a row exists in any status, the form would fail with 23505 — redirect.
  const { data: existing } = await supabase
    .from("offer_applications")
    .select("id")
    .eq("momfluencer_id", user.id)
    .eq("offer_id", offer.id)
    .maybeSingle();
  if (existing) redirect("/catalog");

  const schema = offer.application_form_schema;
  if (!schema?.fields?.length) {
    return (
      <div className="card max-w-2xl">
        <h1 className="text-2xl">Application form not configured</h1>
        <p className="mt-2 text-sm text-navy-600">
          We can&apos;t show you an application form for {offer.brand ?? offer.title} yet — the
          form schema is missing. Please email{" "}
          <a href="mailto:support@momfluence.app">support@momfluence.app</a>.
        </p>
        <p className="mt-4">
          <Link href="/catalog">Back to catalog</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/catalog" className="text-sm text-navy-500 no-underline hover:underline">
          ← Back to catalog
        </Link>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-2">
          {offer.brand && (
            <span className="pill bg-coral-50 text-coral-700 uppercase tracking-wide">
              {offer.brand}
            </span>
          )}
        </div>
        <h1 className="text-3xl mt-3">
          {schema.title ?? `Apply to promote ${offer.brand ?? offer.title}`}
        </h1>
        {schema.description && (
          <p className="mt-3 text-sm text-navy-600">{schema.description}</p>
        )}
      </div>

      <ApplyForm offerId={offer.id} offerSlug={offer.slug} schema={schema} />
    </div>
  );
}
