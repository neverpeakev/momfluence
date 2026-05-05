import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hashIp } from "@/lib/hash";

const Body = z.object({
  agreementId: z.string().uuid(),
  signatureText: z.string().trim().min(3).max(120)
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const { agreementId, signatureText } = parsed.data;

  // Status + membership gates (defense-in-depth). DO NOT enforce the
  // required-agreements gate here — the user is signing in order to satisfy it.
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

  // Single SELECT for both checks; distinct error messages so debugging is easier.
  const { data: agreement } = await supabase
    .from("agreements")
    .select("id, required")
    .eq("id", agreementId)
    .maybeSingle();
  if (!agreement) {
    return NextResponse.json({ error: "agreement not found" }, { status: 404 });
  }
  if (!agreement.required) {
    return NextResponse.json(
      { error: "this agreement is optional and cannot be signed via this endpoint" },
      { status: 400 }
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const ua = req.headers.get("user-agent")?.slice(0, 1000) ?? null;

  const { data: row, error } = await supabase
    .from("agreement_signatures")
    .insert({
      momfluencer_id: user.id,
      agreement_id: agreementId,
      signature_text: signatureText,
      ip_hash: hashIp(ip),
      user_agent: ua
    })
    .select("signed_at")
    .single();

  if (error) {
    if (error.code === "23505" || /duplicate key/i.test(error.message)) {
      return NextResponse.json(
        { error: "you've already signed this agreement" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, signed_at: row.signed_at });
}
