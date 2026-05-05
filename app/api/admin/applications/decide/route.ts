import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Body = z
  .object({
    id: z.string().uuid(),
    action: z.enum(["approve", "reject", "waitlist"]),
    reviewer_notes: z.string().max(2000).optional(),
    rejected_reason: z.string().max(2000).optional()
  })
  .refine(
    (data) =>
      data.action !== "reject" ||
      (data.rejected_reason !== undefined && data.rejected_reason.trim().length > 0),
    { message: "rejected_reason required when action is reject", path: ["rejected_reason"] }
  );

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: me } = await supabase
    .from("momfluencers")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!me?.is_admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const { id, action, reviewer_notes, rejected_reason } = parsed.data;

  const { data: existing } = await supabase
    .from("offer_applications")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (existing.status !== "pending") {
    return NextResponse.json(
      { error: `cannot transition from status='${existing.status}'` },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { reviewed_at: now, reviewer_id: user.id };
  if (reviewer_notes && reviewer_notes.trim().length > 0) {
    patch.reviewer_notes = reviewer_notes.trim();
  }

  if (action === "approve") {
    patch.status = "approved";
    patch.approved_at = now;
  } else if (action === "reject") {
    patch.status = "rejected";
    patch.rejected_reason = (rejected_reason ?? "").trim();
  } else {
    patch.status = "waitlisted";
  }

  const { error } = await supabase.from("offer_applications").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
