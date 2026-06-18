/**
 * Daily branded-post generator cron.
 *
 * Vercel cron fires this once a day at 14:00 UTC (10am ET).
 *
 * Flow:
 *   1. Auth: Vercel Cron sends Authorization: Bearer <CRON_SECRET>.
 *   2. Pull last 30 generated_posts' angle_tags + displays from Supabase.
 *   3. Call Claude Opus 4.7 with that context → get one new post spec.
 *   4. Insert pending row in generated_posts.
 *   5. Pre-warm the render endpoint (avoids IG fetch timeout later).
 *   6. Resolve Page Access Token from system-user token via /me/accounts.
 *   7. Fetch the rendered PNG, upload to FB Page as published photo with caption.
 *   8. Mark row fb_published with the returned post_id.
 *
 * The IG mirror cron (/api/social/ig-mirror) picks up from here 15 min later.
 * Failure handling depends on whether a row was created:
 *   - After insertPending: mark the row fb_failed and return 200. The row is
 *     the durable record; a non-200 could trigger a retry that double-publishes.
 *   - Before insertPending (context/generation error): no row exists, so the
 *     failure would otherwise be invisible (table empty, cron green). Return
 *     500 so the failed run shows up in Vercel's cron dashboard and alerting.
 *
 * Manual run for testing:
 *   curl -X POST https://momfluence.app/api/social/fb-daily-generate \
 *        -H "Authorization: Bearer $CRON_SECRET"
 */

import { NextResponse, type NextRequest } from "next/server";
import { generateDailyPost, generateSlug } from "@/lib/social/post-generator";
import {
  recentForContext,
  insertPending,
  markFbPublished,
  markFailed,
  type GeneratedPostRow,
} from "@/lib/social/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

const META_API_VERSION = "v20.0";
const META_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

function authorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const got = req.headers.get("authorization");
  return got === `Bearer ${expected.trim()}`;
}

function siteOrigin(req: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("host") ?? "momfluence.app";
  return `${proto}://${host}`;
}

interface FbPageInfo { token: string; name: string }

async function fetchPageAccessToken(userToken: string, pageId: string): Promise<FbPageInfo> {
  const url = `${META_BASE}/me/accounts?fields=id,name,access_token&limit=200&access_token=${encodeURIComponent(userToken)}`;
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) throw new Error(`GET /me/accounts → ${res.status}: ${text.slice(0, 400)}`);
  const data = JSON.parse(text) as { data?: Array<{ id: string; name: string; access_token: string }> };
  const page = (data.data ?? []).find((p) => p.id === pageId);
  if (!page) throw new Error(`Page ${pageId} not in manageable list`);
  if (!page.access_token) throw new Error(`No page access_token returned — check pages_show_list scope`);
  return { token: page.access_token, name: page.name };
}

async function fetchRenderedPng(req: NextRequest, slug: string): Promise<Buffer> {
  const url = `${siteOrigin(req)}/api/render/post/${slug}.png`;
  // The row was inserted moments ago; any non-2xx here is almost certainly
  // a transient blip (Supabase lookup hiccup, cold Chromium boot, edge cache).
  // Retry a couple times with backoff before giving up.
  const delays = [0, 1500, 4000];
  let lastErr: Error | null = null;
  for (const wait of delays) {
    if (wait) await new Promise((r) => setTimeout(r, wait));
    try {
      const res = await fetch(url);
      if (!res.ok) {
        lastErr = new Error(`Render fetch ${url} → ${res.status}`);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 1000) {
        lastErr = new Error(`Render returned suspiciously small image: ${buf.length} bytes`);
        continue;
      }
      return buf;
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr ?? new Error(`Render fetch ${url} failed after retries`);
}

async function postPhotoToFb(
  pageToken: string,
  pageId: string,
  pngBuf: Buffer,
  caption: string,
  slug: string
): Promise<string> {
  const form = new FormData();
  form.append("source", new Blob([new Uint8Array(pngBuf)], { type: "image/png" }), `${slug}.png`);
  form.append("message", caption);
  form.append("published", "true");
  form.append("access_token", pageToken);
  const res = await fetch(`${META_BASE}/${pageId}/photos`, { method: "POST", body: form });
  const text = await res.text();
  if (!res.ok) throw new Error(`POST /${pageId}/photos → ${res.status}: ${text.slice(0, 400)}`);
  const data = JSON.parse(text) as { id?: string; post_id?: string };
  const id = data.post_id ?? data.id;
  if (!id) throw new Error(`FB photo POST returned no id: ${text.slice(0, 200)}`);
  return id;
}

interface CronResult {
  ok: boolean;
  slug?: string;
  fb_post_id?: string;
  angle_tag?: string;
  content_format?: string;
  attempts?: number;
  duration_ms: number;
  error?: string;
  stage?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<CronResult>> {
  const started = Date.now();
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized", duration_ms: 0 }, { status: 401 });
  }

  const userToken = process.env.META_MARKETING_API_TOKEN;
  const pageId = process.env.META_FB_PAGE_ID;
  if (!userToken || !pageId) {
    return NextResponse.json({
      ok: false,
      error: "META_MARKETING_API_TOKEN or META_FB_PAGE_ID not set",
      duration_ms: Date.now() - started,
    });
  }

  let row: GeneratedPostRow | null = null;
  let stage = "init";

  try {
    // 1. Pull recent context for Claude
    stage = "recent_context";
    const ctx = await recentForContext(30);

    // 2. Generate post via Claude (with retries on JSON / schema / blocklist)
    stage = "generate";
    const result = await generateDailyPost({
      recentAngleTags: ctx.angle_tags,
      recentDisplays: ctx.displays,
    });

    // 3. Insert pending row
    stage = "insert_pending";
    const slug = generateSlug();
    row = await insertPending({
      slug,
      post: result.post,
      claudeModel: result.model,
      promptVersion: result.promptVersion,
      // content_format goes into metadata so the weekly audit + dashboard can
      // roll up performance by format (anecdote / direct / math / brand-callout /
      // objection-reframe). See docs/product-thesis.md "Content formats".
      metadata: {
        attempts: result.attempts,
        content_format: result.post.content_format,
        rationale: result.post.rationale,
      },
    });

    // 4. Pre-warm render endpoint (avoid IG-fetch cold-render timeouts later)
    //    by fetching it once now and caching it.
    stage = "render";
    const pngBuf = await fetchRenderedPng(req, slug);

    // 5. Resolve page access token + post to FB
    stage = "fb_token";
    const { token: pageToken } = await fetchPageAccessToken(userToken, pageId);

    stage = "fb_publish";
    const fbPostId = await postPhotoToFb(pageToken, pageId, pngBuf, result.post.caption, slug);

    // 6. Mark fb_published
    stage = "mark_published";
    await markFbPublished(row.id, fbPostId);

    return NextResponse.json({
      ok: true,
      slug,
      fb_post_id: fbPostId,
      angle_tag: result.post.angle_tag,
      content_format: result.post.content_format,
      attempts: result.attempts,
      duration_ms: Date.now() - started,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[fb-daily-generate] failed at stage=${stage}:`, msg);
    if (row) {
      try {
        await markFailed(row.id, "fb", `${stage}: ${msg}`);
      } catch (markErr) {
        console.error(`[fb-daily-generate] also failed to mark row failed:`, markErr);
      }
    }
    // No row means we failed before insertPending — nothing is recorded in
    // generated_posts, so surface a non-200 to keep the failure visible rather
    // than letting the cron report green with no post for the day.
    return NextResponse.json({
      ok: false,
      error: msg,
      stage,
      duration_ms: Date.now() - started,
    }, { status: row ? 200 : 500 });
  }
}

/** GET is convenience for manual testing in browser (same auth, same logic). */
export async function GET(req: NextRequest) {
  return POST(req);
}
