import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hashIp } from "@/lib/hash";

const Body = z.object({ agreementId: z.string().uuid(), signatureText: z.string().min(3).max(120) });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  const { error } = await supabase.from("agreement_signatures").insert({
    momfluencer_id: user.id,
    agreement_id: parsed.data.agreementId,
    signature_text: parsed.data.signatureText,
    ip_hash: hashIp(ip),
    user_agent: req.headers.get("user-agent")
  });

  if (error) {
    if (/duplicate key/i.test(error.message)) {
      return NextResponse.json({ ok: true, alreadySigned: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
