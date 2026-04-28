import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Body = z.object({
  first_name: z.string().max(80).nullish(),
  last_name: z.string().max(80).nullish(),
  display_name: z.string().max(80).nullish(),
  instagram_handle: z.string().max(80).nullish(),
  tiktok_handle: z.string().max(80).nullish(),
  facebook_handle: z.string().max(200).nullish(),
  city: z.string().max(120).nullish(),
  state: z.string().max(2).nullish(),
  follower_band: z.string().max(20).nullish(),
  payout_method: z.enum(["unset", "paypal", "venmo", "ach", "check"]).nullish(),
  payout_handle: z.string().max(200).nullish()
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request", issues: parsed.error.issues }, { status: 400 });

  const { error } = await supabase.from("momfluencers").update(parsed.data).eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
