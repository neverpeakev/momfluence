/**
 * Brand-mark PNG endpoint.
 *
 *   GET /api/render/logo/icon.png      → 1024×1024 navy + coral-M
 *   GET /api/render/logo/wordmark.png  → 1200×400 transparent-bg "Momfluence"
 *
 * Permalink-style URLs intended for use in Meta Brand Guidelines, Stripe
 * Dashboard, email signatures, Slack workspace icons, etc. If we ever evolve
 * the brand mark, the URLs stay stable — only the rendered pages change.
 *
 * Aggressive cache (7d edge, 1d browser) because the mark rarely changes.
 * Bust via a query param if needed: ?v=2026-05.
 */

import { NextResponse, type NextRequest } from "next/server";
import { renderToPng } from "@/lib/optimizer/renderer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const VARIANTS = {
  icon:     { width: 1024, height: 1024, omitBackground: false },
  wordmark: { width: 1200, height: 400,  omitBackground: true  },
} as const;

function siteOrigin(req: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("host") ?? "momfluence.app";
  return `${proto}://${host}`;
}

function sanitize(raw: string): keyof typeof VARIANTS | null {
  const cleaned = raw.replace(/\.png$/i, "");
  return cleaned === "icon" || cleaned === "wordmark" ? cleaned : null;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ variant: string }> }
) {
  const { variant: rawVariant } = await ctx.params;
  const variant = sanitize(rawVariant);
  if (!variant) {
    return NextResponse.json(
      { error: "invalid variant — must be 'icon' or 'wordmark'" },
      { status: 400 }
    );
  }

  const spec = VARIANTS[variant];
  const targetUrl = `${siteOrigin(req)}/render/logo/${variant}`;

  try {
    const png = await renderToPng({
      url: targetUrl,
      selector: '[data-logo-export="1"]',
      width: spec.width,
      height: spec.height,
      scale: 1,
      omitBackground: spec.omitBackground,
    });
    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(png.length),
        // 7d edge / 1d browser / 30d SWR. Bust with ?v=<rev> on the
        // consumer side if the mark changes.
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[render/logo]", variant, msg);
    return NextResponse.json({ error: "render failed", message: msg }, { status: 500 });
  }
}
