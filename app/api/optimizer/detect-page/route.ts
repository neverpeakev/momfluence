/**
 * Discover Facebook Pages associated with the configured Meta access token.
 * Lets the admin pick the right Page ID without leaving /admin/optimizer.
 *
 * Endpoint: GET /me/accounts on the Meta Graph API.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface FbPage {
  id: string;
  name: string;
  category?: string;
  tasks?: string[];
}

interface MeAccountsResp {
  data: FbPage[];
  paging?: { next?: string };
}

export async function GET() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: me } = await sb.from("momfluencers").select("is_admin").eq("id", user.id).maybeSingle();
  if (!me?.is_admin) return NextResponse.json({ error: "admin only" }, { status: 403 });

  const token = process.env.META_MARKETING_API_TOKEN?.trim();
  if (!token) {
    return NextResponse.json({ error: "META_MARKETING_API_TOKEN not set" }, { status: 412 });
  }

  try {
    const res = await fetch(
      "https://graph.facebook.com/v20.0/me/accounts?fields=id,name,category,tasks&limit=50",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json({
        error: `Meta API returned ${res.status}`,
        detail: text.slice(0, 600),
      }, { status: 502 });
    }
    const body = JSON.parse(text) as MeAccountsResp;
    const adsEligible = body.data.filter((p) =>
      // Tasks include "ADVERTISE" if this token can run ads from the Page.
      !p.tasks || p.tasks.includes("ADVERTISE")
    );

    return NextResponse.json({
      ok: true,
      pages_total: body.data.length,
      pages_ads_eligible: adsEligible.length,
      pages: body.data.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        canAdvertise: p.tasks ? p.tasks.includes("ADVERTISE") : true,
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
