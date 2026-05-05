import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCents, netPayoutCents } from "@/lib/margin";
import OfferCta, { type ApplicationStatus } from "./OfferCta";

export const dynamic = "force-dynamic";

type Offer = {
  id: string;
  slug: string;
  title: string;
  brand: string | null;
  vertical: string | null;
  description: string | null;
  hero_image_url: string | null;
  payout_type: "cpa" | "cpl" | "cps" | "rev_share";
  upstream_payout_cents: number;
  margin_bps: number;
  access_model: "open" | "application_required";
  networks: { slug: string; name: string };
};

type LinkRow = {
  offer_id: string;
  token: string;
  destination_url: string;
};

function payoutLabel(o: Offer): string | null {
  if (o.payout_type === "rev_share") return "Revenue share";
  const net = netPayoutCents(o.upstream_payout_cents, o.margin_bps);
  if (net < 1) return null;
  if (o.payout_type === "cpa") return `${formatCents(net)} per signup`;
  if (o.payout_type === "cpl") return `${formatCents(net)} per lead`;
  return null;
}

export default async function CatalogPage() {
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

  const { data: offerRows } = await supabase
    .from("offers")
    .select(
      "id, slug, title, brand, vertical, description, hero_image_url, payout_type, upstream_payout_cents, margin_bps, access_model, networks!inner(slug, name)"
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });
  const offers = (offerRows ?? []) as unknown as Offer[];

  const { data: linkRows } = await supabase
    .from("tracking_links")
    .select("offer_id, token, destination_url")
    .eq("momfluencer_id", user.id);
  const linkByOffer = new Map<string, LinkRow>(
    (linkRows ?? []).map((l) => [l.offer_id, l as LinkRow])
  );

  // RLS auto-filters offer_applications to the caller's own rows.
  const { data: appRows } = await supabase
    .from("offer_applications")
    .select("offer_id, status");
  const appStatusByOffer = new Map<string, ApplicationStatus>(
    (appRows ?? []).map((a) => [a.offer_id as string, a.status as ApplicationStatus])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Catalog</h1>
        <p className="mt-1 text-navy-600">
          Brands you can promote. Payouts shown are your net after the 10% platform fee.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map((o) => {
          const existing = linkByOffer.get(o.id);
          const payout = payoutLabel(o);
          return (
            <div key={o.id} className="card flex flex-col gap-4">
              {o.hero_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={o.hero_image_url}
                  alt=""
                  className="aspect-video w-full rounded-xl object-cover"
                />
              ) : (
                <div className="aspect-video w-full rounded-xl bg-gradient-to-br from-navy-50 to-navy-100 flex items-center justify-center">
                  <span className="font-display text-2xl text-navy-700 px-4 text-center">
                    {o.brand ?? o.title}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {o.brand && (
                  <span className="pill bg-coral-50 text-coral-700 uppercase tracking-wide">
                    {o.brand}
                  </span>
                )}
                {o.vertical && (
                  <span className="pill bg-navy-100 text-navy-700">{o.vertical}</span>
                )}
              </div>

              <div className="flex-1">
                <h3 className="text-lg line-clamp-2">{o.title}</h3>
                {o.description && (
                  <p className="mt-2 text-sm text-navy-600 line-clamp-3">{o.description}</p>
                )}
              </div>

              {payout && <p className="text-sm font-semibold text-coral-600">{payout}</p>}

              <div>
                <OfferCta
                  offerId={o.id}
                  offerSlug={o.slug}
                  accessModel={o.access_model}
                  destinationUrl={existing?.destination_url ?? null}
                  applicationStatus={appStatusByOffer.get(o.id) ?? null}
                />
              </div>
            </div>
          );
        })}
      </div>

      {offers.length === 0 && (
        <div className="card">
          <p className="text-sm text-navy-600">No active offers right now — check back tomorrow.</p>
        </div>
      )}
    </div>
  );
}
