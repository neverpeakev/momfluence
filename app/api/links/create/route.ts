import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAdapter } from "@/lib/adapters/registry";
import { netPayoutCents } from "@/lib/margin";
import { shortId } from "@/lib/short-id";

const Body = z.object({ offerId: z.string().uuid(), label: z.string().min(1).max(40).nullable().optional() });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const { offerId, label } = parsed.data;

  // Block if account is not approved or has unsigned required agreements.
  const { data: profile } = await supabase
    .from("momfluencers")
    .select("status, is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || (profile.status !== "approved" && !profile.is_admin)) {
    return NextResponse.json({ error: "account not approved yet" }, { status: 403 });
  }

  const { data: required } = await supabase.from("agreements").select("id").eq("required", true);
  const { data: signed } = await supabase
    .from("agreement_signatures")
    .select("agreement_id")
    .eq("momfluencer_id", user.id);
  const signedSet = new Set((signed ?? []).map((s) => s.agreement_id));
  const missing = (required ?? []).filter((a) => !signedSet.has(a.id));
  if (missing.length > 0) {
    return NextResponse.json({ error: "must sign required agreements first" }, { status: 403 });
  }

  // Load the offer + its network
  const { data: offer } = await supabase
    .from("offers")
    .select("id, cta_url, upstream_payout_cents, margin_bps, network_id, status, networks!inner(adapter_key)")
    .eq("id", offerId)
    .maybeSingle();
  if (!offer || offer.status !== "active") return NextResponse.json({ error: "offer unavailable" }, { status: 404 });

  // Generate a unique token and the upstream URL with sub-id baked in
  const token = shortId(8);
  const adapterKey = (offer.networks as unknown as { adapter_key: string }).adapter_key;
  const adapter = getAdapter(adapterKey);
  const destination = adapter.buildAffiliateUrl({ ctaUrlTemplate: offer.cta_url, subId: token });

  const { data: link, error } = await supabase
    .from("tracking_links")
    .insert({
      token,
      momfluencer_id: user.id,
      offer_id: offer.id,
      custom_label: label ?? null,
      destination_url: destination
    })
    .select("id, token")
    .single();

  if (error || !link) return NextResponse.json({ error: error?.message ?? "insert failed" }, { status: 500 });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const shortUrl = `${baseUrl}/t/${link.token}`;

  return NextResponse.json({
    id: link.id,
    token: link.token,
    shortUrl,
    netPayoutCents: netPayoutCents(offer.upstream_payout_cents, offer.margin_bps)
  });
}
