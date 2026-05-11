/**
 * Programmatic creative image endpoint.
 *
 *   GET /api/render/creative/<slug>.png  → 1080×1080 PNG of the variant's
 *                                          /_render/creative/<slug> page.
 *
 * Used by the Meta Marketing API (passed as image_url on ad creative creation),
 * and by any other downstream consumer that needs the PNG.
 *
 * Cached aggressively: 7 days at the edge, 1 day in browser. Creative copy is
 * static once a variant is launched, so this lets Meta + every CDN hit fetch
 * the cached bytes instead of re-rendering.
 *
 * Accepts `.png` suffix on the slug for nice URLs (Meta API + most tools want
 * a file extension); we strip it server-side.
 */

import { NextResponse, type NextRequest } from "next/server";
import { renderToPng } from "@/lib/optimizer/renderer";
import { findVariant } from "@/lib/funnel-lab/variants";
import { findRuntimeVariant } from "@/lib/funnel-lab/runtime-variants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function siteOrigin(req: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  // Fallback: derive from request (works in preview deploys too).
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
  if (!slug) {
    return NextResponse.json({ error: "invalid slug" }, { status: 400 });
  }

  // Verify variant exists in either source before spinning up Chromium.
  const exists =
    Boolean(findVariant(slug)) || Boolean(await findRuntimeVariant(slug));
  if (!exists) {
    return NextResponse.json({ error: `variant not found: ${slug}` }, { status: 404 });
  }

  const targetUrl = `${siteOrigin(req)}/_render/creative/${encodeURIComponent(slug)}`;

  try {
    const png = await renderToPng({
      url: targetUrl,
      selector: '[data-creative-export="1"]',
      width: 1080,
      height: 1080,
      scale: 1,
    });

    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(png.length),
        // Aggressive cache: 7d edge, 1d browser, stale-while-revalidate 30d.
        // Bust by promoting a new variant with a new slug.
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[render/creative]", slug, msg);
    return NextResponse.json({ error: "render failed", message: msg }, { status: 500 });
  }
}
