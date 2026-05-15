/**
 * POST /api/funnel-lab/creatives
 *
 * Receives a rendered creative (PNG + metadata) from the design-system ad
 * exporter and stores it for the Funnel Lab to surface alongside per-creative
 * Stripe rollups.
 *
 * Zero-config auth — caller signs into app.momfluence.app once, this route
 * uses their existing Supabase session cookies. The exporter sends
 * `credentials: 'include'`; this route admits cookies via CORS.
 *
 * Three auth paths (any one of):
 *   1. Supabase session cookie + admin flag (preferred — zero-config for ops)
 *   2. Bearer <FUNNEL_LAB_PUSH_TOKEN>       (CLI / cron / external workers)
 *   3. Bearer <supabase service-role JWT>   (server-to-server)
 *
 * GET returns a healthcheck so the exporter can verify "are you signed in?"
 * without rendering anything.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createSsrClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// Origins allowed to send credentialed requests. Add deploy URLs as needed.
const ALLOWED_ORIGINS = new Set<string>([
  "https://momfluence.app",
  "https://app.momfluence.app",
  "https://momfluence-platform.vercel.app",
  // Design-system ad-exporter origin — fill in the actual host this runs on:
  "https://design-system.momfluence.app",
]);

function corsHeaders(origin: string | null): HeadersInit {
  const o = origin && ALLOWED_ORIGINS.has(origin) ? origin : "";
  if (!o) return {};
  return {
    "Access-Control-Allow-Origin": o,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
}

function withCors(res: NextResponse, origin: string | null): NextResponse {
  for (const [k, v] of Object.entries(corsHeaders(origin))) res.headers.set(k, v as string);
  return res;
}

export async function OPTIONS(req: NextRequest) {
  return withCors(new NextResponse(null, { status: 204 }), req.headers.get("origin"));
}

const Body = z.object({
  creative_id: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  label:       z.string().min(1).max(200),
  section:     z.enum(["polished", "screenshot", "ugly", "hook", "other"]).default("other"),
  lp_variant:  z.string().min(1).max(80).nullable().optional(),
  format:      z.string().min(1).max(20),
  mime:        z.literal("image/png"),
  filename:    z.string().min(1).max(120),
  png_base64:  z.string().min(100),
  source:      z.string().max(80).optional(),
  designed_at: z.string().max(20).optional(),
  rendered_at: z.string().max(20).optional(),
  ts:          z.string().datetime().optional(),
});

const STORAGE_BUCKET = "creatives";

function bearerFrom(req: NextRequest): string | null {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

type AuthResult = { ok: true; via: "cookie" | "push-secret" | "service-role" } | { ok: false; status: number; error: string };

async function authorize(req: NextRequest): Promise<AuthResult> {
  // (1) Cookie session — preferred. Caller is a signed-in admin on the platform.
  try {
    const sb = await createSsrClient();
    const { data: { user } } = await sb.auth.getUser();
    if (user) {
      const { data: me } = await sb.from("momfluencers").select("is_admin").eq("id", user.id).maybeSingle();
      if (me?.is_admin) return { ok: true, via: "cookie" };
      return { ok: false, status: 403, error: "signed in but not admin" };
    }
  } catch {
    // fall through to bearer paths
  }

  // (2) Shared push secret
  const token = bearerFrom(req);
  if (token) {
    const pushSecret = process.env.FUNNEL_LAB_PUSH_TOKEN;
    if (pushSecret && token === pushSecret) return { ok: true, via: "push-secret" };

    // (3) Service-role JWT — try to use it; if it lets us read a privileged table, accept.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (url) {
      try {
        const probe = createServiceClient(url, token, { auth: { persistSession: false } });
        const { error } = await probe.from("momfluencers").select("id").limit(1);
        if (!error) return { ok: true, via: "service-role" };
      } catch { /* nope */ }
    }
    return { ok: false, status: 401, error: "invalid bearer token" };
  }

  return { ok: false, status: 401, error: "not signed in — sign in at app.momfluence.app/login first" };
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  const auth = await authorize(req);
  if (!auth.ok) {
    return withCors(NextResponse.json({ ok: false, error: auth.error }, { status: auth.status }), origin);
  }
  return withCors(NextResponse.json({ ok: true, via: auth.via, endpoint: "/api/funnel-lab/creatives", method: "POST" }), origin);
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const auth = await authorize(req);
  if (!auth.ok) {
    return withCors(NextResponse.json({ error: auth.error }, { status: auth.status }), origin);
  }

  let parsed: z.infer<typeof Body>;
  try {
    const raw = await req.json();
    parsed = Body.parse(raw);
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ") : "invalid json";
    return withCors(NextResponse.json({ error: `bad request: ${msg}` }, { status: 400 }), origin);
  }

  // Decode base64 PNG
  let bytes: Buffer;
  try {
    bytes = Buffer.from(parsed.png_base64, "base64");
    if (bytes.length < 8 || bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4e || bytes[3] !== 0x47) {
      return withCors(NextResponse.json({ error: "png_base64 is not a PNG" }, { status: 400 }), origin);
    }
  } catch {
    return withCors(NextResponse.json({ error: "could not decode png_base64" }, { status: 400 }), origin);
  }

  // Service-role client for storage + db writes (bypasses RLS).
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !serviceKey) {
    return withCors(NextResponse.json({ error: "supabase env not configured" }, { status: 500 }), origin);
  }
  const admin = createServiceClient(url, serviceKey, { auth: { persistSession: false } });

  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const storagePath = `${yyyy}/${mm}/${parsed.creative_id}.png`;

  const { error: uploadErr } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, bytes, {
      contentType: "image/png",
      upsert: true,
      cacheControl: "31536000",
    });
  if (uploadErr) {
    return withCors(NextResponse.json({ error: `storage upload failed: ${uploadErr.message}` }, { status: 500 }), origin);
  }

  const { data: pub } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
  const public_url = pub?.publicUrl ?? null;

  const { data: row, error: dbErr } = await admin
    .from("creatives")
    .upsert(
      {
        creative_id: parsed.creative_id,
        label: parsed.label,
        section: parsed.section,
        lp_variant: parsed.lp_variant ?? null,
        format: parsed.format,
        mime: parsed.mime,
        filename: parsed.filename,
        storage_path: storagePath,
        public_url,
        source: parsed.source ?? "design-system-ad-exporter",
        designed_at: parsed.designed_at ?? null,
        rendered_at: parsed.rendered_at ?? null,
        pushed_at: parsed.ts ? new Date(parsed.ts).toISOString() : new Date().toISOString(),
      },
      { onConflict: "creative_id" }
    )
    .select("id")
    .single();

  if (dbErr) {
    return withCors(NextResponse.json({ error: `db upsert failed: ${dbErr.message}` }, { status: 500 }), origin);
  }

  return withCors(NextResponse.json({
    ok: true,
    via: auth.via,
    creative_id: parsed.creative_id,
    storage_path: storagePath,
    public_url,
    row_id: row?.id ?? null,
  }), origin);
}
