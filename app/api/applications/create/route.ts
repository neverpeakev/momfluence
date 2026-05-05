import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Body = z.object({
  offerId: z.string().uuid(),
  applicationData: z.record(z.unknown())
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const { offerId, applicationData } = parsed.data;

  // Status + membership gates (defense-in-depth; catalog already filters but the
  // endpoint is callable directly).
  const { data: profile } = await supabase
    .from("momfluencers")
    .select("status, membership_status, is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || (profile.status !== "approved" && !profile.is_admin)) {
    return NextResponse.json({ error: "account not approved yet" }, { status: 403 });
  }
  if (
    !profile.is_admin &&
    !["trialing", "active"].includes(profile.membership_status ?? "")
  ) {
    return NextResponse.json({ error: "membership required" }, { status: 403 });
  }

  // Required-agreements gate (mirrors /api/links/create).
  const { data: required } = await supabase.from("agreements").select("id").eq("required", true);
  const { data: signed } = await supabase
    .from("agreement_signatures")
    .select("agreement_id")
    .eq("momfluencer_id", user.id);
  const signedSet = new Set((signed ?? []).map((s) => s.agreement_id));
  const missing = (required ?? []).filter((a) => !signedSet.has(a.id));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: "must sign required agreements first" },
      { status: 403 }
    );
  }

  const { data: offer } = await supabase
    .from("offers")
    .select("id, status, access_model")
    .eq("id", offerId)
    .maybeSingle();
  if (!offer || offer.status !== "active" || offer.access_model !== "application_required") {
    return NextResponse.json({ error: "offer unavailable for application" }, { status: 404 });
  }

  const { data: row, error } = await supabase
    .from("offer_applications")
    .insert({
      momfluencer_id: user.id,
      offer_id: offerId,
      status: "pending",
      application_data: applicationData
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "you've already applied to this offer" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: row.id });
}
