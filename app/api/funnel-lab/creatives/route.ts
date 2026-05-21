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
// The exporter runs inside the Claude web UI at https://claude.ai. Note:
// some browsers (Safari ITP, Brave strict, Firefox ETP) block third-party
// cookies on cross-origin POSTs even with credentials: 'include' — if the
// exporter's "↗ Push all" button fails despite this origin being whitelisted,
// fall back to the exporter's ⬇ Download all as ZIP and upload manually.
// Permanent fix: host the exporter as a sub-route under app.momfluence.app
// so it's same-origin (no third-party cookie blockers can interfere).
const ALLOWED_ORIGINS = new Set<string>([
  "https://momfluence.app",
  "https://app.momfluence.app",
  "https://momfluence-platform.vercel.app",
  "https://claude.ai",
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

// 2026-05-20: opened up to video. `mime` was `z.literal("image/png")` and the
// upload field was `png_base64`. We now accept image/png (legacy), image/jpeg,
// video/mp4, video/webm, video/quicktime — matching the bucket's allowed MIMEs
// (see migration 20260514000000_creatives_table.sql + the SQL amend on the
// `creatives` storage bucket on 2026-05-19). New uploads should send the
// generic `data_base64` field; `png_base64` stays as an alias so existing
// Claude Design exporters keep working without changes.
const Body = z.object({
  creative_id: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  label:       z.string().min(1).max(200),
  section:     z.enum(["polished", "screenshot", "ugly", "hook", "other"]).default("other"),
  lp_variant:  z.string().min(1).max(80).nullable().optional(),
  format:      z.string().min(1).max(20),
  mime:        z.enum([
    "image/png",
    "image/jpeg",
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ]),
  filename:    z.string().min(1).max(120),
  // Either field accepted. New callers should use `data_base64`. `png_base64`
  // kept as alias so existing Claude Design exporter scripts don't break.
  data_base64: z.string().min(100).optional(),
  png_base64:  z.string().min(100).optional(),
  source:      z.string().max(80).optional(),
  designed_at: z.string().max(20).optional(),
  rendered_at: z.string().max(20).optional(),
  ts:          z.string().datetime().optional(),
}).refine(
  (b) => Boolean(b.data_base64 ?? b.png_base64),
  { message: "one of `data_base64` or `png_base64` is required" },
);

/** Per-mime: signature bytes (first N bytes) we expect for a sane upload,
 *  plus the file extension we use when writing to storage. */
const MIME_HINT: Record<string, { ext: string; magic?: number[][] }> = {
  "image/png":        { ext: "png",  magic: [[0x89, 0x50, 0x4e, 0x47]] }, // \x89PNG
  "image/jpeg":       { ext: "jpg",  magic: [[0xff, 0xd8, 0xff]] },
  "image/webp":       { ext: "webp", magic: [[0x52, 0x49, 0x46, 0x46]] }, // RIFF (full webp check needs offset 8-11=WEBP)
  // Videos: ISO BMFF (mp4/mov/m4v) all start with `....ftyp` — bytes 4..7 = "ftyp".
  // Some encoders pad with leading zeros (e.g. \0\0\0 length prefix); we check
  // bytes 4..7 rather than 0..3.
  "video/mp4":        { ext: "mp4",  magic: [[0x66, 0x74, 0x79, 0x70]] }, // "ftyp" at offset 4
  "video/quicktime":  { ext: "mov",  magic: [[0x66, 0x74, 0x79, 0x70]] }, // QuickTime is also ftyp-based
  "video/webm":       { ext: "webm", magic: [[0x1a, 0x45, 0xdf, 0xa3]] }, // EBML
};

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

  // (2) Shared push secret OR CRON_SECRET (added 2026-05-20 so the same
  // token that authorizes /api/optimizer/tick + /api/funnel-lab/push-video
  // also works for the creatives ingest endpoint — keeps the agentic push
  // flow auth-uniform).
  const token = bearerFrom(req);
  if (token) {
    const pushSecret = process.env.FUNNEL_LAB_PUSH_TOKEN;
    if (pushSecret && token === pushSecret) return { ok: true, via: "push-secret" };
    if (process.env.CRON_SECRET && token === process.env.CRON_SECRET) return { ok: true, via: "push-secret" };

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

  // Decode base64 payload. Accept either `data_base64` (generic) or `png_base64`
  // (legacy alias). The Zod refinement above guarantees at least one is set.
  const dataField = parsed.data_base64 ?? parsed.png_base64!;
  let bytes: Buffer;
  try {
    bytes = Buffer.from(dataField, "base64");
  } catch {
    return withCors(NextResponse.json({ error: "could not decode payload" }, { status: 400 }), origin);
  }

  // Sanity-check the magic bytes per MIME so callers can't lie about content
  // type. The check is at byte-offset 0 for images and offset 4 for ftyp-based
  // video containers — see MIME_HINT comments.
  const hint = MIME_HINT[parsed.mime];
  if (!hint) {
    return withCors(NextResponse.json({ error: `unsupported mime: ${parsed.mime}` }, { status: 400 }), origin);
  }
  if (hint.magic && bytes.length >= 12) {
    const offset = parsed.mime.startsWith("video/mp4") || parsed.mime === "video/quicktime" ? 4 : 0;
    const matched = hint.magic.some((sig) =>
      sig.every((b, i) => bytes[offset + i] === b),
    );
    if (!matched) {
      return withCors(
        NextResponse.json({ error: `payload doesn't match magic bytes for ${parsed.mime}` }, { status: 400 }),
        origin,
      );
    }
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
  // Storage path uses the actual file extension derived from the mime type
  // (e.g. .png for images, .mp4 for videos). The bucket was opened up to
  // video/* MIMEs on 2026-05-19; see migration history.
  const isVideo = parsed.mime.startsWith("video/");
  const storagePath = isVideo
    ? `videos/${parsed.creative_id}.${hint.ext}`
    : `${yyyy}/${mm}/${parsed.creative_id}.${hint.ext}`;

  const { error: uploadErr } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, bytes, {
      contentType: parsed.mime,
      upsert: true,
      // Videos: shorter cache (1d) so we can roll a v2 without cache-busting
      // every endpoint. Images: 1-year immutable (creative_id is content-addressed).
      cacheControl: isVideo ? "86400" : "31536000",
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
