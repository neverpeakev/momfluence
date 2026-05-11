/**
 * Headless Chromium renderer for funnel-lab ad creatives.
 *
 * Strategy: launch chromium in the Vercel function, navigate to
 * /_render/creative/<slug> on the same deployment, screenshot the
 * data-creative-export div at deviceScaleFactor=1 (clean 1080×1080 PNG).
 *
 * Why @sparticuz/chromium (full, not -min) + puppeteer-core?
 *   The -min variant relies on extracting libs to /tmp and resolving them
 *   via LD_LIBRARY_PATH, which is unreliable on Vercel's runtime — the
 *   libnss3.so resolution fails on first launch with both playwright AND
 *   puppeteer launchers. The full @sparticuz/chromium package ships the
 *   binary AND shared libraries inside the npm package itself, resolved by
 *   the binary's baked-in rpath. No download, no env-var setup, no race.
 *   Bundle adds ~52MB unzipped (well within Vercel's 250MB function limit).
 *
 * Cold start ~3-4s. Warm ~1s. Both fit Vercel's 60s function budget.
 */

import "server-only";
import chromium from "@sparticuz/chromium";
import puppeteer, { type Browser } from "puppeteer-core";

let cachedBrowser: Browser | null = null;
let cachedAt = 0;
const BROWSER_REUSE_MS = 5 * 60 * 1000; // 5 min — Vercel keeps lambdas warm ~10 min

async function getBrowser(): Promise<Browser> {
  if (cachedBrowser && Date.now() - cachedAt < BROWSER_REUSE_MS && cachedBrowser.connected) {
    return cachedBrowser;
  }
  if (cachedBrowser) {
    try { await cachedBrowser.close(); } catch { /* ignore */ }
    cachedBrowser = null;
  }

  cachedBrowser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
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
  const page = await browser.newPage();

  try {
    await page.setViewport({ width, height, deviceScaleFactor: scale });
    await page.setUserAgent(
      "Mozilla/5.0 (compatible; MomFluence-CreativeRenderer/1.0; +https://momfluence.app)"
    );

    const res = await page.goto(opts.url, {
      waitUntil: "networkidle0",
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

    return Buffer.from(buf as Uint8Array);
  } finally {
    await page.close().catch(() => { /* ignore */ });
  }
}

/** Public-facing creative URL the Meta Marketing API can fetch. */
export function publicCreativeUrl(siteOrigin: string, slug: string): string {
  return `${siteOrigin}/api/render/creative/${encodeURIComponent(slug)}.png`;
}
