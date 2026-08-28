/**
 * Instagram mirror cron.
 *
 * Vercel cron fires this at 14:15 UTC daily — 15 minutes after
 * /api/social/fb-daily-generate so the FB post and rendered PNG are fully
 * settled at the edge cache.
 *
 * Flow:
 *   1. Auth: Vercel Cron Bearer.
 *   2. Pull generated_posts WHERE fb_published_at IS NOT NULL AND
 *      ig_published_at IS NULL (cap at 10 — defensive against backlog).
 *   3. Resolve Page Access Token + linked Instagram Business Account.
 *   4. For each row:
 *      a. POST /{ig-id}/media with image_url + caption → creation_id
 *      b. Poll /{creation-id}?fields=status_code until FINISHED (max ~12s)
 *      c. POST /{ig-id}/media_publish with creation_id → ig_media_id
 *      d. Mark generated_posts.ig_published_at + ig_media_id
 *
 * Resilient: if a single row fails, the others still process. Failed rows
 * are marked ig_failed with the error message and will NOT be retried by
 * future runs (would need manual reset).
 *
 * Why daily and not faster: IG rate-limits media publishes to 25 per
 * 24-hour rolling window per account. Daily cron with ~1 mirror per day
 * is well under the limit.
 */

import { NextResponse, type NextRequest } from "next/server";
import {
  listPendingIgMirror,
  markIgPublished,
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

async function fetchPageContext(userToken: string, pageId: string): Promise<{ pageToken: string; igId: string }> {
  // Page access token
  const accountsRes = await fetch(
    `${META_BASE}/me/accounts?fields=id,access_token&limit=200&access_token=${encodeURIComponent(userToken)}`
  );
  const accountsText = await accountsRes.text();
  if (!accountsRes.ok) throw new Error(`/me/accounts → ${accountsRes.status}: ${accountsText.slice(0, 300)}`);
  const accountsData = JSON.parse(accountsText) as { data?: Array<{ id: string; access_token: string }> };
  const page = (accountsData.data ?? []).find((p) => p.id === pageId);
  if (!page?.access_token) throw new Error(`Page ${pageId} access_token unavailable`);
  // Linked IG account
  const igRes = await fetch(
    `${META_BASE}/${pageId}?fields=instagram_business_account&access_token=${encodeURIComponent(page.access_token)}`
  );
  const igText = await igRes.text();
  if (!igRes.ok) throw new Error(`/${pageId} ig lookup → ${igRes.status}: ${igText.slice(0, 300)}`);
  const igData = JSON.parse(igText) as { instagram_business_account?: { id: string } };
  const igId = igData.instagram_business_account?.id;
  if (!igId) throw new Error(`No Instagram Business Account linked to FB Page ${pageId}`);
  return { pageToken: page.access_token, igId };
}

async function publishToIg(
  pageToken: string,
  igId: string,
  imageUrl: string,
  caption: string,
  slug: string
): Promise<string> {
  // Step 1: create media container
  const containerParams = new URLSearchParams();
  containerParams.append("image_url", imageUrl);
  containerParams.append("caption", caption);
  containerParams.append("access_token", pageToken);
  const cRes = await fetch(`${META_BASE}/${igId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: containerParams.toString(),
  });
  const cText = await cRes.text();
  if (!cRes.ok) throw new Error(`IG /media (container) → ${cRes.status}: ${cText.slice(0, 400)}`);
  const creationId = (JSON.parse(cText) as { id?: string }).id;
  if (!creationId) throw new Error(`IG /media returned no creation_id: ${cText.slice(0, 200)}`);

  // Step 2: poll until FINISHED (image fetched + processed)
  for (let i = 0; i < 8; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const sRes = await fetch(
      `${META_BASE}/${creationId}?fields=status_code&access_token=${encodeURIComponent(pageToken)}`
    );
    const sText = await sRes.text();
    if (!sRes.ok) throw new Error(`IG status check → ${sRes.status}: ${sText.slice(0, 200)}`);
    const { status_code } = JSON.parse(sText) as { status_code?: string };
    if (status_code === "FINISHED") break;
    if (status_code === "ERROR" || status_code === "EXPIRED") {
      throw new Error(`IG container ${creationId} status=${status_code} for ${slug}`);
    }
  }

  // Step 3: publish
  const pParams = new URLSearchParams();
  pParams.append("creation_id", creationId);
  pParams.append("access_token", pageToken);
  const pRes = await fetch(`${META_BASE}/${igId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: pParams.toString(),
  });
  const pText = await pRes.text();
  if (!pRes.ok) throw new Error(`IG /media_publish → ${pRes.status}: ${pText.slice(0, 400)}`);
  const mediaId = (JSON.parse(pText) as { id?: string }).id;
  if (!mediaId) throw new Error(`IG /media_publish returned no id: ${pText.slice(0, 200)}`);
  return mediaId;
}

interface MirrorResult {
  ok: boolean;
  mirrored: number;
  failed: number;
  details: Array<{ slug: string; ig_media_id?: string; error?: string }>;
  duration_ms: number;
  message?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<MirrorResult>> {
  const started = Date.now();
  if (!authorized(req)) {
    return NextResponse.json(
      { ok: false, mirrored: 0, failed: 0, details: [], duration_ms: 0, message: "unauthorized" },
      { status: 401 }
    );
  }

  const userToken = process.env.META_MARKETING_API_TOKEN;
  const pageId = process.env.META_FB_PAGE_ID;
  if (!userToken || !pageId) {
    console.error("[ig-mirror] env missing", {
      hasToken: !!userToken,
      hasPageId: !!pageId,
    });
    return NextResponse.json({
      ok: false,
      mirrored: 0,
      failed: 0,
      details: [],
      duration_ms: Date.now() - started,
      message: "META_MARKETING_API_TOKEN or META_FB_PAGE_ID not set",
    });
  }

  const pending = await listPendingIgMirror(10);
  console.log(`[ig-mirror] pending rows: ${pending.length}`, {
    slugs: pending.map((p) => p.slug),
  });
  if (pending.length === 0) {
    return NextResponse.json({
      ok: true,
      mirrored: 0,
      failed: 0,
      details: [],
      duration_ms: Date.now() - started,
      message: "nothing to mirror",
    });
  }

  let pageToken: string;
  let igId: string;
  try {
    const ctx = await fetchPageContext(userToken, pageId);
    pageToken = ctx.pageToken;
    igId = ctx.igId;
    console.log(`[ig-mirror] page context resolved, igId=${igId}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[ig-mirror] fetchPageContext failed: ${msg}`);
    // Mark every pending row as ig_failed so the state reflects reality
    // and a human sees the error_message in the DB (previously the endpoint
    // returned 200 with the error only in the response body, which is not
    // captured anywhere).
    for (const row of pending) {
      try {
        await markFailed(row.id, "ig", `auth/page-context: ${msg}`);
      } catch (markErr) {
        console.error(`[ig-mirror] also failed to mark row failed:`, markErr);
      }
    }
    return NextResponse.json({
      ok: false,
      mirrored: 0,
      failed: pending.length,
      details: pending.map((r) => ({ slug: r.slug, error: `auth/page-context: ${msg}` })),
      duration_ms: Date.now() - started,
      message: `auth/page-context: ${msg}`,
    });
  }

  // Pre-warm the render endpoint for each pending slug. IG often fails
  // when fetching a cold-Chromium render (~5-8s) due to its own timeout.
  // Warming once before the loop adds ~2s but makes each IG fetch <1s.
  for (const row of pending) {
    fetch(`${siteOrigin(req)}/api/render/post/${row.slug}.png`).catch(() => {});
  }
  // Small delay so the warm requests have a head start
  await new Promise((r) => setTimeout(r, 2000));

  const details: MirrorResult["details"] = [];
  let mirrored = 0;
  let failed = 0;
  for (const row of pending) {
    const imageUrl = `${siteOrigin(req)}/api/render/post/${row.slug}.png`;
    try {
      const mediaId = await publishToIg(pageToken, igId, imageUrl, row.caption, row.slug);
      await markIgPublished(row.id, mediaId);
      mirrored++;
      details.push({ slug: row.slug, ig_media_id: mediaId });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      failed++;
      details.push({ slug: row.slug, error: msg });
      try {
        await markFailed(row.id, "ig", msg);
      } catch (markErr) {
        console.error(`[ig-mirror] also failed to mark row failed:`, markErr);
      }
    }
  }

  return NextResponse.json({
    ok: failed === 0,
    mirrored,
    failed,
    details,
    duration_ms: Date.now() - started,
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
