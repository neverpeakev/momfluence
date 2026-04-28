import { createClient } from "@/lib/supabase/server";
import { formatCents, netPayoutCents } from "@/lib/margin";
import GenerateLinkButton from "./GenerateLinkButton";

export const dynamic = "force-dynamic";

type Offer = {
  id: string;
  slug: string;
  title: string;
  brand: string | null;
  vertical: string | null;
  description: string | null;
  upstream_payout_cents: number;
  margin_bps: number;
  payout_type: string;
  hero_image_url: string | null;
};

export default async function OffersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("offers")
    .select("id,slug,title,brand,vertical,description,upstream_payout_cents,margin_bps,payout_type,hero_image_url")
    .eq("status", "active")
    .order("upstream_payout_cents", { ascending: false });
  const offers = (data ?? []) as Offer[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Live offers</h1>
        <p className="mt-1 text-navy-600">
          The payout shown is what <em>you</em> earn. The 10% platform fee is already baked out.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {offers.map((o) => {
          const net = netPayoutCents(o.upstream_payout_cents, o.margin_bps);
          return (
            <div key={o.id} className="card flex gap-4">
              {o.hero_image_url && (
                <img src={o.hero_image_url} alt="" className="h-24 w-24 rounded-lg object-cover" />
              )}
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-navy-500">{o.brand} · {o.vertical}</p>
                <h3 className="text-lg mt-1">{o.title}</h3>
                <p className="mt-1 text-sm text-navy-600 line-clamp-2">{o.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-semibold text-coral-600">{formatCents(net)}</p>
                    <p className="text-xs text-navy-500">per {o.payout_type === "rev_share" ? "first month" : "conversion"}</p>
                  </div>
                  <GenerateLinkButton offerId={o.id} offerSlug={o.slug} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {offers.length === 0 && (
        <div className="card">
          <p className="text-sm text-navy-600">No active offers in your area yet — check back tomorrow.</p>
        </div>
      )}
    </div>
  );
}
