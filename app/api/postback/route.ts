import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAdapter } from "@/lib/adapters/registry";
import { netPayoutCents } from "@/lib/margin";

// Upstream networks fire postbacks here when a conversion lands.
// URL: /api/postback?network=<slug>&...adapter-specific...
// The adapter is responsible for verifying signatures and shaping the payload.

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}

async function handle(req: NextRequest) {
  const url = new URL(req.url);
  const networkSlug = url.searchParams.get("network");
  if (!networkSlug) return NextResponse.json({ error: "missing network" }, { status: 400 });

  const svc = createServiceRoleClient();
  const { data: network } = await svc
    .from("networks")
    .select("id, adapter_key, active")
    .eq("slug", networkSlug)
    .maybeSingle();
  if (!network || !network.active) return NextResponse.json({ error: "unknown or inactive network" }, { status: 404 });

  const bodyText = req.method === "POST" ? await req.text() : "";
  const adapter = getAdapter(network.adapter_key);

  let event;
  try {
    event = await adapter.parsePostback({ headers: req.headers, bodyText, query: url.searchParams });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "verify failed" }, { status: 401 });
  }
  if (!event) return NextResponse.json({ ignored: true });

  // Resolve which tracking link / offer this is for
  const { data: link } = await svc
    .from("tracking_links")
    .select("id, offer_id, offers!inner(margin_bps, status, external_offer_id)")
    .eq("token", event.subId)
    .maybeSingle();

  if (!link) return NextResponse.json({ error: "unknown sub_id" }, { status: 404 });
  const offer = link.offers as unknown as { margin_bps: number; status: string; external_offer_id: string };

  if (offer.external_offer_id !== event.externalOfferId) {
    // network reported a different offer than the one tied to the sub_id; refuse to credit
    return NextResponse.json({ error: "offer mismatch" }, { status: 409 });
  }

  const grossCents = event.upstreamPayoutCents;
  const netCents = netPayoutCents(grossCents, offer.margin_bps);

  const { error } = await svc.from("conversions").insert({
    tracking_link_id: link.id,
    network_event_id: event.networkEventId,
    network_payout_cents: grossCents,
    momfluencer_payout_cents: netCents,
    status: event.status,
    raw_payload: event.raw
  });

  // unique-violation on (tracking_link_id, network_event_id) when network_event_id is non-null
  // means we already recorded this — return ok for idempotency
  if (error && !/duplicate key/i.test(error.message)) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
