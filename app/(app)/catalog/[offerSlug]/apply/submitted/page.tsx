import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ApplicationSubmittedPage({
  params
}: {
  params: Promise<{ offerSlug: string }>;
}) {
  const { offerSlug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: offer }, { data: m }] = await Promise.all([
    supabase.from("offers").select("brand, title").eq("slug", offerSlug).maybeSingle(),
    supabase.from("momfluencers").select("is_admin").eq("id", user.id).maybeSingle()
  ]);
  if (!offer) notFound();

  return (
    <div className="max-w-2xl">
      <div className="card">
        <h1 className="text-3xl">Application received</h1>
        <p className="mt-3 text-navy-600">
          Thanks — we got your application for{" "}
          <strong>{offer.brand ?? offer.title}</strong>. We&apos;ll review within 1-2 business
          days and email you at <strong>{user.email}</strong>.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/catalog" className="btn-primary">
            Back to catalog
          </Link>
          {m?.is_admin && (
            <Link href="/admin/applications" className="btn-ghost">
              Review applications
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
