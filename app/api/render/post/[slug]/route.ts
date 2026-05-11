/**
 * Programmatic FB Page seed-post image endpoint.
 *
 *   GET /api/render/post/<slug>.png  → 1080×1080 PNG of the page at
 *                                      /render/post/<slug>
 *
 * Used by `scripts/seed-fb-page.ts` (one-shot) to fetch image bytes for
 * upload to the Meta Pages API. Mirrors /api/render/creative/[slug] —
 * same Chromium renderer, same selector pattern, just a different
 * source page route.
 */

import { NextResponse, type NextRequest } from "next/server";
import { renderToPng } from "@/lib/optimizer/renderer";
import { SEED_POSTS } from "@/lib/fb-page/seed-content";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function siteOrigin(req: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("host") ?? "momfluence.app";
  return `${proto}://${host}`;
}

function sanitizeSlug(raw: string): string | null {
  const cleaned = raw.replace(/\.png$/i, "");
  return /^[a-z0-9-]{1,80}$/.test(cleaned) ? cleaned : null;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug: rawSlug } = await ctx.params;
  const slug = sanitizeSlug(rawSlug);
  if (!slug) return NextResponse.json({ error: "invalid slug" }, { status: 400 });

  if (!SEED_POSTS.some((p) => p.slug === slug)) {
    return NextResponse.json({ error: `post not found: ${slug}` }, { status: 404 });
  }

  const targetUrl = `${siteOrigin(req)}/render/post/${encodeURIComponent(slug)}`;

  try {
    const png = await renderToPng({
      url: targetUrl,
      selector: '[data-post-export="1"]',
      width: 1080,
      height: 1080,
      scale: 1,
    });
    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(png.length),
        // Posts are static content once authored — cache aggressively at the
        // edge so the seed script's fetch is fast on retry.
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[render/post]", slug, msg);
    return NextResponse.json({ error: "render failed", message: msg }, { status: 500 });
  }
}
