/**
 * Headless Chromium renderer for funnel-lab ad creatives.
 *
 * Strategy: launch chromium-min in the Vercel function, navigate to
 * /_render/creative/<slug> on the same deployment, screenshot the
 * data-creative-export div at deviceScaleFactor=2 (retina-clean 1080×1080 PNG).
 *
 * Why @sparticuz/chromium-min not @sparticuz/chromium?
 *   The -min variant excludes the bundled chromium binary; we download it
 *   on-demand from the configured CHROMIUM_BINARY_URL (or chromium.executablePath
 *   resolves a CDN'd binary). Keeps the function bundle <60MB.
 *
 * Cold start ~3-4s. Warm ~1s. Both fit Vercel's 60s function budget.
 */

import "server-only";
import chromium from "@sparticuz/chromium-min";
import { chromium as playwrightChromium, type Browser } from "playwright-core";

const CHROMIUM_REMOTE_BINARY =
  process.env.CHROMIUM_BINARY_URL ??
  "https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar";

let cachedBrowser: Browser | null = null;
let cachedAt = 0;
const BROWSER_REUSE_MS = 5 * 60 * 1000; // 5 min — Vercel keeps lambdas warm ~10 min

async function getBrowser(): Promise<Browser> {
  if (cachedBrowser && Date.now() - cachedAt < BROWSER_REUSE_MS) {
    return cachedBrowser;
  }
  if (cachedBrowser) {
    try { await cachedBrowser.close(); } catch { /* ignore */ }
    cachedBrowser = null;
  }

  const executablePath = await chromium.executablePath(CHROMIUM_REMOTE_BINARY);

  cachedBrowser = await playwrightChromium.launch({
    args: chromium.args,
    executablePath,
    headless: true,
  });
  cachedAt = Date.now();
  return cachedBrowser;
}

export interface RenderOptions {
  /** Internal URL of the page that hosts the data-creative-export element. */
  url: string;
  /** CSS selector for the element to capture. */
  selector?: string;
  /** Output dimensions. Default 1080×1080 (Meta feed). */
  width?: number;
  height?: number;
  /** deviceScaleFactor — keep at 1 for native pixels; 2 for retina-quality. */
  scale?: number;
  /** Max wait for selector in ms. */
  selectorTimeoutMs?: number;
}

/**
 * Render a URL → PNG buffer.
 *
 * Strategy: full viewport screenshot at exact dimensions, NOT element-screenshot,
 * because element-screenshot trips on parent transforms. The renderable page sets
 * body to 1080×1080 explicitly so a viewport screenshot captures only the creative.
 */
export async function renderToPng(opts: RenderOptions): Promise<Buffer> {
  const width = opts.width ?? 1080;
  const height = opts.height ?? 1080;
  const scale = opts.scale ?? 1;

  const browser = await getBrowser();
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: scale,
    userAgent:
      "Mozilla/5.0 (compatible; MomFluence-CreativeRenderer/1.0; +https://momfluence.app)",
  });

  try {
    const page = await ctx.newPage();
    const res = await page.goto(opts.url, {
      waitUntil: "networkidle",
      timeout: 25_000,
    });
    if (!res || res.status() >= 400) {
      throw new Error(`Render target ${opts.url} returned ${res?.status() ?? "no response"}`);
    }

    // Wait for fonts (Google Fonts loaded via <link> in layout.tsx)
    await page.evaluate(() => (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts?.ready);

    if (opts.selector) {
      await page.waitForSelector(opts.selector, {
        timeout: opts.selectorTimeoutMs ?? 10_000,
      });
    }

    const buf = await page.screenshot({
      type: "png",
      omitBackground: false,
      fullPage: false,
      clip: { x: 0, y: 0, width, height },
    });

    return buf as Buffer;
  } finally {
    await ctx.close();
  }
}

/** Public-facing creative URL the Meta Marketing API can fetch. */
export function publicCreativeUrl(siteOrigin: string, slug: string): string {
  return `${siteOrigin}/api/render/creative/${encodeURIComponent(slug)}.png`;
}
