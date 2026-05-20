/**
 * POST /api/funnel-lab/post-video-organic
 *
 * Server-side organic posting of a sales-video MP4 to FB Page and/or
 * Instagram Reels. Sibling to /api/funnel-lab/push-video which handles
 * the paid ad path.
 *
 * Same flows as scripts/post-sales-videos-organic.ts, but runs in Vercel
 * where the Page-access-token exchange + Meta API calls have the right
 * IP / cookies / env. The script remains useful for ad-hoc CLI use; this
 * route is what the admin UI + cron call.
 *
 * Auth (any one of):
 *   - Supabase cookie session + momfluencers.is_admin
 *   - Bearer FUNNEL_LAB_PUSH_TOKEN
 *   - Bearer CRON_SECRET
 *
 * Source modes (mutually exclusive):
 *   - `storage_path`: path inside the `creatives` Supabase bucket
 *     (e.g. "videos/v-202605-a-group-chat.mp4"). For IG we use the
 *     bucket's public URL directly; for FB we download bytes and
 *     re-upload multipart.
 *   - `public_url`: direct public URL (e.g. an existing CDN). Used as-is
 *     for IG; for FB we GET the bytes and re-upload.
 *
 * Surfaces:
 *   { fb: boolean, ig: boolean } — defaults both true. Set fb:false or
 *   ig:false to target one surface only.
 *
 * Response: { fb_post_id, ig_media_id, ... } — each null if that surface
 * was skipped or failed. Errors per surface are non-fatal; the other surface
 * still runs.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createSsrClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const API_VERSION = "v20.0";
const BASE = `https://graph.facebook.com/${API_VERSION}`;

const Body = z.object({
  creative_id:  z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  caption:      z.string().min(1).max(2200), // IG hard limit
  // Source — exactly one
  storage_path: z.string().min(1).max(200).optional(),
  public_url:   z.string().url().optional(),
  // Surfaces
  fb:           z.boolean().default(true),
  ig:           z.boolean().default(true),
  filename:     z.string().min(1).max(120).optional(),
}).refine(
  (b) => Boolean(b.storage_path ?? b.public_url),
  { message: "one of `storage_path` or `public_url` is required" },
);

function bearerFrom(req: NextRequest): string | null {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

async function authorize(req: NextRequest): Promise<{ ok: true; via: string } | { ok: false; status: number; error: string }> {
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
    if (process.env.FUNNEL_LAB_PUSH_TOKEN && token === process.env.FUNNEL_LAB_PUSH_TOKEN) return { ok: true, via: "push-secret" };
    if (process.env.CRON_SECRET && token === process.env.CRON_SECRET) return { ok: true, via: "cron-secret" };
    return { ok: false, status: 401, error: "invalid bearer token" };
  }
  return { ok: false, status: 401, error: "missing auth" };
}

async function fetchPageAccessToken(userToken: string, pageId: string): Promise<string> {
  const url = `${BASE}/me/accounts?fields=id,access_token&limit=200&access_token=${encodeURIComponent(userToken)}`;
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) throw new Error(`GET /me/accounts → ${res.status}: ${text.slice(0, 400)}`);
  const { data } = JSON.parse(text) as { data?: Array<{ id: string; access_token: string }> };
  const page = (data ?? []).find((p) => p.id === pageId);
  if (!page?.access_token) {
    throw new Error(`Page ${pageId} not in /me/accounts; token may lack pages_show_list / pages_manage_posts`);
  }
  return page.access_token;
}

async function fetchInstagramAccountId(pageToken: string, pageId: string): Promise<string | null> {
  const url = `${BASE}/${pageId}?fields=instagram_business_account&access_token=${encodeURIComponent(pageToken)}`;
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) throw new Error(`GET ig_business_account → ${res.status}: ${text.slice(0, 400)}`);
  const data = JSON.parse(text) as { instagram_business_account?: { id: string } };
  return data.instagram_business_account?.id ?? null;
}

async function downloadFromBucket(storagePath: string): Promise<{ bytes: Uint8Array; publicUrl: string }> {
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supaUrl || !serviceKey) throw new Error("Supabase env not configured");
  const sb = createServiceClient(supaUrl, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await sb.storage.from("creatives").download(storagePath);
  if (error) throw new Error(`Supabase download failed: ${error.message}`);
  const ab = await data.arrayBuffer();
  const { data: { publicUrl } } = sb.storage.from("creatives").getPublicUrl(storagePath);
  return { bytes: new Uint8Array(ab), publicUrl };
}

async function postFbVideo(pageId: string, pageToken: string, bytes: Uint8Array, filename: string, caption: string): Promise<string> {
  const buf = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buf).set(bytes);
  const form = new FormData();
  form.append("source", new Blob([buf], { type: "video/mp4" }), filename);
  form.append("description", caption);
  form.append("access_token", pageToken);
  const res = await fetch(`${BASE}/${pageId}/videos`, { method: "POST", body: form });
  const text = await res.text();
  if (!res.ok) throw new Error(`POST /${pageId}/videos → ${res.status}: ${text.slice(0, 400)}`);
  const { id } = JSON.parse(text) as { id?: string };
  if (!id) throw new Error(`FB video post returned no id: ${text.slice(0, 200)}`);
  return id;
}

async function postIgReel(igUserId: string, pageToken: string, videoUrl: string, caption: string): Promise<string> {
  // Step 1: container
  const cp = new URLSearchParams();
  cp.append("media_type", "REELS");
  cp.append("video_url", videoUrl);
  cp.append("caption", caption);
  cp.append("share_to_feed", "true");
  cp.append("access_token", pageToken);
  const cr = await fetch(`${BASE}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: cp.toString(),
  });
  const crText = await cr.text();
  if (!cr.ok) throw new Error(`IG /media → ${cr.status}: ${crText.slice(0, 400)}`);
  const { id: containerId } = JSON.parse(crText) as { id?: string };
  if (!containerId) throw new Error(`IG /media returned no container id`);

  // Step 2: poll until FINISHED (cap ~90s)
  const t0 = Date.now();
  while (Date.now() - t0 < 90_000) {
    await new Promise((r) => setTimeout(r, 2000));
    const sr = await fetch(`${BASE}/${containerId}?fields=status_code&access_token=${encodeURIComponent(pageToken)}`);
    const sText = await sr.text();
    if (!sr.ok) throw new Error(`IG container status → ${sr.status}: ${sText.slice(0, 300)}`);
    const { status_code } = JSON.parse(sText) as { status_code?: string };
    if (status_code === "FINISHED") break;
    if (status_code === "ERROR" || status_code === "EXPIRED") {
      throw new Error(`IG container ${containerId} status=${status_code}`);
    }
  }

  // Step 3: publish
  const pp = new URLSearchParams();
  pp.append("creation_id", containerId);
  pp.append("access_token", pageToken);
  const pr = await fetch(`${BASE}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: pp.toString(),
  });
  const pText = await pr.text();
  if (!pr.ok) throw new Error(`IG /media_publish → ${pr.status}: ${pText.slice(0, 400)}`);
  const { id } = JSON.parse(pText) as { id?: string };
  if (!id) throw new Error(`IG publish returned no id`);
  return id;
}

export async function POST(req: NextRequest) {
  const auth = await authorize(req);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ") : "invalid json";
    return NextResponse.json({ ok: false, error: `bad request: ${msg}` }, { status: 400 });
  }

  const userToken = process.env.META_MARKETING_API_TOKEN;
  const pageId = process.env.META_FB_PAGE_ID;
  if (!userToken || !pageId) {
    return NextResponse.json(
      { ok: false, error: "META_MARKETING_API_TOKEN + META_FB_PAGE_ID required" },
      { status: 503 },
    );
  }

  // Resolve source: bucket bytes + public_url, OR public_url alone + fetched bytes.
  let bytes: Uint8Array;
  let publicUrl: string;
  try {
    if (parsed.storage_path) {
      const r = await downloadFromBucket(parsed.storage_path);
      bytes = r.bytes;
      publicUrl = r.publicUrl;
    } else {
      publicUrl = parsed.public_url!;
      const r = await fetch(publicUrl);
      if (!r.ok) throw new Error(`fetching public_url → ${r.status}`);
      bytes = new Uint8Array(await r.arrayBuffer());
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }

  const filename = parsed.filename ?? `${parsed.creative_id}.mp4`;
  const pageToken = await fetchPageAccessToken(userToken, pageId);
  const igUserId = parsed.ig ? await fetchInstagramAccountId(pageToken, pageId) : null;

  const out: { fb_post_id: string | null; ig_media_id: string | null; warnings: string[]; video_url: string } = {
    fb_post_id: null,
    ig_media_id: null,
    warnings: [],
    video_url: publicUrl,
  };

  if (parsed.fb) {
    try {
      out.fb_post_id = await postFbVideo(pageId, pageToken, bytes, filename, parsed.caption);
    } catch (e) {
      out.warnings.push(`FB Page: ${e instanceof Error ? e.message : e}`);
    }
  }

  if (parsed.ig) {
    if (!igUserId) {
      out.warnings.push("IG: no instagram_business_account linked to FB Page — skipped");
    } else {
      try {
        out.ig_media_id = await postIgReel(igUserId, pageToken, publicUrl, parsed.caption);
      } catch (e) {
        out.warnings.push(`IG: ${e instanceof Error ? e.message : e}`);
      }
    }
  }

  return NextResponse.json({ ok: true, via: auth.via, creative_id: parsed.creative_id, ...out });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/funnel-lab/post-video-organic",
    method: "POST",
    auth: "cookie (admin) | Bearer FUNNEL_LAB_PUSH_TOKEN | Bearer CRON_SECRET",
    body_schema: {
      creative_id: "string",
      caption: "string (≤2200 chars)",
      storage_path: "string (e.g. videos/<id>.mp4) — OR public_url",
      public_url: "string (URL) — OR storage_path",
      fb: "boolean (default true)",
      ig: "boolean (default true)",
      filename: "string (optional)",
    },
  });
}
