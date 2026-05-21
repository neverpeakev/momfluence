/**
 * POST /api/funnel-lab/push-video
 *
 * Server-side variant of `scripts/push-sales-videos-to-meta.ts`. Runs in
 * Vercel where META_AD_ACCOUNT_ID / META_AD_SET_ID / META_FB_PAGE_ID /
 * META_MARKETING_API_TOKEN are populated — letting us trigger the
 * video-into-ad-set pipeline from a curl, the admin UI, or a cron job
 * without needing those secrets on a laptop.
 *
 * Two ways to point at the MP4:
 *
 *   (1) `storage_path: "videos/v-202605-a-group-chat.mp4"` — read from the
 *       Supabase `creatives` storage bucket. Recommended when the video is
 *       already in our bucket (uploaded via /api/funnel-lab/creatives or
 *       scripts/upload-sales-videos.ts).
 *
 *   (2) `data_base64: "<base64 MP4 bytes>"` — for one-off / dev pushes
 *       where the video lives only on a laptop. Capped at 30MB encoded
 *       (~22MB binary), which is comfortably above our 1-2MB sales-video
 *       clips but below Meta's 1GB ad-video limit. For anything larger,
 *       use storage_path.
 *
 * Authentication (any one of):
 *   - Supabase session cookie + `momfluencers.is_admin` (preferred for
 *     UI clicks)
 *   - Bearer FUNNEL_LAB_PUSH_TOKEN (CLI / cron / external workers)
 *   - Bearer CRON_SECRET (for scheduled / Vercel cron callers)
 *
 * Idempotency: this route always creates a NEW Meta video + ad. If you
 * call it twice with the same creative_id you'll get two parallel paused
 * ads. The optimizer's tick handler will see the most recent one (Meta
 * lists by creation time). If you want strict idempotency, pause/delete
 * the prior ad in Ads Manager first.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createSsrClient } from "@/lib/supabase/server";
import { z } from "zod";

import { pushVideoCreativeToAdSet } from "@/lib/optimizer/video-ad-builder";
import { isConfigured } from "@/lib/optimizer/meta-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Encoding + Meta polling can take 60-180s for the 15s clips we ship today.
// Bump above the default 10s timeout — Vercel max is 300s on the current plan.
export const maxDuration = 300;

const Body = z.object({
  creative_id: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  lp_variant:  z.string().min(1).max(80),
  label:       z.string().min(1).max(200),
  message:     z.string().min(1).max(2000),
  title:       z.string().max(200).optional(),
  cta_type:    z.string().max(40).optional(),
  // Thumbnail (one of) — Meta now REQUIRES a thumbnail for video creatives
  // (error 1443226 "Your ad needs a video thumbnail"). One of three modes:
  //   1. thumbnail_url   — direct public URL we pass straight through
  //   2. thumbnail_data_base64 — base64 PNG/JPEG we upload to /adimages first
  //                              to get an image_hash (the resilient path)
  //   3. neither         — request fails. The auto-frame-0 fallback Meta
  //                        used to provide is gone as of late 2025.
  thumbnail_url:         z.string().url().optional(),
  thumbnail_data_base64: z.string().min(100).optional(),
  // Source — exactly one required.
  storage_path: z.string().min(1).max(200).optional(),
  data_base64:  z.string().min(100).optional(),
  // Optional filename for Meta's asset library; default falls back to creative_id.mp4
  filename:     z.string().min(1).max(120).optional(),
  // Optional override of the destination ad set — defaults to env META_AD_SET_ID.
  // Needed when pushing into experiment ad sets spawned by /meta-spawn-experiment.
  target_ad_set_id: z.string().optional(),
}).refine(
  (b) => Boolean(b.storage_path ?? b.data_base64),
  { message: "one of `storage_path` or `data_base64` is required" },
).refine(
  (b) => Boolean(b.thumbnail_url ?? b.thumbnail_data_base64),
  { message: "one of `thumbnail_url` or `thumbnail_data_base64` is required (Meta requires a video thumbnail)" },
);

function bearerFrom(req: NextRequest): string | null {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

type AuthResult = { ok: true; via: "cookie" | "push-secret" | "cron-secret" } | { ok: false; status: number; error: string };

async function authorize(req: NextRequest): Promise<AuthResult> {
  try {
    const sb = await createSsrClient();
    const { data: { user } } = await sb.auth.getUser();
    if (user) {
      const { data: me } = await sb.from("momfluencers").select("is_admin").eq("id", user.id).maybeSingle();
      if (me?.is_admin) return { ok: true, via: "cookie" };
      return { ok: false, status: 403, error: "signed in but not admin" };
    }
  } catch { /* fall through */ }

  const token = bearerFrom(req);
  if (token) {
    if (process.env.FUNNEL_LAB_PUSH_TOKEN && token === process.env.FUNNEL_LAB_PUSH_TOKEN) {
      return { ok: true, via: "push-secret" };
    }
    if (process.env.CRON_SECRET && token === process.env.CRON_SECRET) {
      return { ok: true, via: "cron-secret" };
    }
    return { ok: false, status: 401, error: "invalid bearer token" };
  }
  return { ok: false, status: 401, error: "missing auth (cookie or bearer required)" };
}

async function fetchFromBucket(storagePath: string): Promise<Uint8Array> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase env not configured");
  }
  const sb = createServiceClient(url, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await sb.storage.from("creatives").download(storagePath);
  if (error) {
    throw new Error(`Supabase storage download failed: ${error.message}`);
  }
  const ab = await data.arrayBuffer();
  return new Uint8Array(ab);
}

export async function POST(req: NextRequest) {
  const auth = await authorize(req);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const cfg = isConfigured();
  if (!cfg.ok) {
    return NextResponse.json(
      { ok: false, error: `Meta env missing: ${cfg.missing.join(", ")}` },
      { status: 503 },
    );
  }
  if (!process.env.META_FB_PAGE_ID) {
    return NextResponse.json({ ok: false, error: "META_FB_PAGE_ID not set" }, { status: 503 });
  }

  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ") : "invalid json";
    return NextResponse.json({ ok: false, error: `bad request: ${msg}` }, { status: 400 });
  }

  // Resolve MP4 bytes from one of the two source modes.
  let bytes: Uint8Array;
  try {
    if (parsed.storage_path) {
      bytes = await fetchFromBucket(parsed.storage_path);
    } else {
      const buf = Buffer.from(parsed.data_base64!, "base64");
      // Cap raw decoded size at 30MB so a misconfigured caller can't OOM the function.
      if (buf.byteLength > 30 * 1024 * 1024) {
        return NextResponse.json({ ok: false, error: "data_base64 exceeds 30MB cap; use storage_path for larger files" }, { status: 413 });
      }
      bytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }

  // Sanity-check the MP4 magic (ftyp at offset 4) before paying for Meta API calls.
  if (bytes.byteLength < 12 || bytes[4] !== 0x66 || bytes[5] !== 0x74 || bytes[6] !== 0x79 || bytes[7] !== 0x70) {
    return NextResponse.json({ ok: false, error: "payload doesn't look like MP4 (ftyp magic missing at offset 4)" }, { status: 400 });
  }

  const filename = parsed.filename ?? `${parsed.creative_id}.mp4`;

  // If a thumbnail blob was provided, upload it to Meta /adimages first to get
  // an image_hash, then pass that into pushVideoCreativeToAdSet via the new
  // `thumbnailImageHash` field on the builder. Meta requires either
  // image_hash or image_url on video_data; we prefer image_hash for stability
  // (image_url can hit fetch rate-limits when Meta tries to download it).
  let thumbnailImageHash: string | undefined;
  if (parsed.thumbnail_data_base64) {
    const thumbBuf = Buffer.from(parsed.thumbnail_data_base64, "base64");
    if (thumbBuf.byteLength < 100 || thumbBuf.byteLength > 8 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: `thumbnail_data_base64 decoded size ${thumbBuf.byteLength}B outside [100B, 8MB]` },
        { status: 400 },
      );
    }
    try {
      // Same flow as campaign-builder.uploadAdImage but inline here so we
      // don't have to import + restructure.
      const formBody = new URLSearchParams();
      formBody.append("bytes", thumbBuf.toString("base64"));
      const accountId = (process.env.META_AD_ACCOUNT_ID ?? "").startsWith("act_")
        ? process.env.META_AD_ACCOUNT_ID!
        : `act_${process.env.META_AD_ACCOUNT_ID}`;
      const res = await fetch(`https://graph.facebook.com/v20.0/${accountId}/adimages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.META_MARKETING_API_TOKEN}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody.toString(),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`/adimages → ${res.status}: ${text.slice(0, 400)}`);
      const data = JSON.parse(text) as { images: Record<string, { hash: string }> };
      const first = Object.values(data.images ?? {})[0];
      if (!first?.hash) throw new Error(`/adimages returned no hash: ${text.slice(0, 300)}`);
      thumbnailImageHash = first.hash;
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: `thumbnail upload failed: ${e instanceof Error ? e.message : e}` },
        { status: 502 },
      );
    }
  }

  try {
    const result = await pushVideoCreativeToAdSet({
      creativeId: parsed.creative_id,
      lpVariant: parsed.lp_variant,
      label: parsed.label,
      mp4Bytes: bytes,
      filename,
      message: parsed.message,
      title: parsed.title,
      ctaType: parsed.cta_type,
      thumbnailUrl: parsed.thumbnail_url,
      thumbnailImageHash,
      targetAdSetId: parsed.target_ad_set_id,
    });
    return NextResponse.json({
      ok: true,
      via: auth.via,
      creative_id: parsed.creative_id,
      ad_id: result.adId,
      ad_creative_id: result.adCreativeId,
      video_id: result.videoId,
      destination_url: result.destinationUrl,
      encoding_status: result.encodingStatus.video_status,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}

export async function GET() {
  const cfg = isConfigured();
  return NextResponse.json({
    ok: true,
    endpoint: "/api/funnel-lab/push-video",
    method: "POST",
    auth: "cookie (admin) | Bearer FUNNEL_LAB_PUSH_TOKEN | Bearer CRON_SECRET",
    meta_configured: cfg.ok,
    meta_missing: cfg.missing,
  });
}
