import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { hashIp } from "@/lib/hash";

// Public tracking redirect. Logs a click then 302s to the upstream URL.
// We use the service-role client so the click insert isn't blocked by RLS.

export async function GET(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;

  let svc;
  try {
    svc = createServiceRoleClient();
  } catch {
    // service role not configured (e.g. local dev without secret) — log and 404
    return NextResponse.redirect(new URL("/t/missing", req.url), 302);
  }

  const { data: link } = await svc
    .from("tracking_links")
    .select("id, destination_url")
    .eq("token", token)
    .maybeSingle();

  if (!link) {
    return NextResponse.redirect(new URL("/", req.url), 302);
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  await svc.from("clicks").insert({
    tracking_link_id: link.id,
    ip_hash: hashIp(ip),
    user_agent: req.headers.get("user-agent"),
    referer: req.headers.get("referer"),
    country: req.headers.get("x-vercel-ip-country"),
    region: req.headers.get("x-vercel-ip-country-region")
  });

  return NextResponse.redirect(link.destination_url, 302);
}
