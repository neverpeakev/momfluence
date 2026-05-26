/**
 * Application review status endpoint.
 *
 * The /application-status page polls this every 3 seconds while showing
 * the "reviewing your application…" experience. Returns one of:
 *   { state: "reviewing" }   — checkout still propagating / brief pause
 *   { state: "approved" }    — webhook flipped membership_status='active'
 *   { state: "rejected", reason }  — V2 (auto-review may mark this)
 *
 * Note: the webhook handler currently auto-approves on payment in both
 * modes (subscription and payment). The "reviewing" experience exists
 * primarily as a psychological wait — it makes the application feel
 * selective. Real rejection criteria + auto-refund land in V2.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ state: "unauthenticated" }, { status: 401 });
  }
  const { data: m } = await sb
    .from("momfluencers")
    .select("status, membership_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!m) {
    return NextResponse.json({ state: "reviewing" });
  }
  if (m.membership_status === "active") {
    return NextResponse.json({ state: "approved" });
  }
  if (m.status === "rejected") {
    return NextResponse.json({ state: "rejected", reason: "We couldn't verify your application details." });
  }
  return NextResponse.json({ state: "reviewing" });
}
