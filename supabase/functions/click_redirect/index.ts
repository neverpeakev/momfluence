// click_redirect: public endpoint that logs a click and 302-redirects to the
// upstream affiliate URL with the subID already injected.
//
// Path shape: /functions/v1/click_redirect/<token>  (or ?t=<token>)
// Fail-open: any logging error is swallowed; the click always redirects.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const CLICK_HASH_SALT = "momfluence-v1-click-salt";

let cached: SupabaseClient | null = null;
function getServiceClient(): SupabaseClient {
  if (cached) return cached;
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars are required");
  cached = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return cached;
}

interface TrackingLink { id: string; destination_url: string; }

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/").filter(Boolean);
  const pathToken = pathSegments[pathSegments.length - 1] || "";
  const queryToken = url.searchParams.get("t") || url.searchParams.get("token") || "";
  const token = (pathToken && pathToken !== "click_redirect" ? pathToken : queryToken).trim();

  if (!token) return new Response("Missing tracking token.", { status: 400 });

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("tracking_links")
    .select("id, destination_url")
    .eq("token", token)
    .maybeSingle();

  const link = data as TrackingLink | null;
  if (error || !link) return new Response("Link not found.", { status: 404 });

  logClick(link.id, token, req).catch((e) => console.error("click log failed:", e));

  return Response.redirect(link.destination_url, 302);
});

async function logClick(trackingLinkId: string, token: string, req: Request): Promise<void> {
  const supabase = getServiceClient();
  const ipHash = await hashIp(req);
  const ua = req.headers.get("user-agent") || null;
  const referer = req.headers.get("referer") || req.headers.get("referrer") || null;
  const country = req.headers.get("cf-ipcountry") || req.headers.get("x-vercel-ip-country") || null;
  const region = req.headers.get("x-vercel-ip-country-region") || req.headers.get("cf-region-code") || null;
  const device = parseDevice(ua);

  await supabase.from("clicks").insert({
    tracking_link_id: trackingLinkId,
    ip_hash: ipHash,
    user_agent: ua ? ua.slice(0, 1000) : null,
    referer: referer ? referer.slice(0, 1000) : null,
    country,
    region,
    device,
    subid: token,
    source: "redirect_endpoint",
  });
}

async function hashIp(req: Request): Promise<string | null> {
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    null;
  if (!ip) return null;
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(ip + ":" + CLICK_HASH_SALT),
  );
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function parseDevice(ua: string | null): string | null {
  if (!ua) return null;
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/iPhone|Android.*Mobile|Mobile|webOS|BlackBerry/i.test(ua)) return "mobile";
  if (/Android/i.test(ua)) return "tablet";
  return "desktop";
}
