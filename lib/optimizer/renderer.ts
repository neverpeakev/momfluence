/**
 * Headless Chromium renderer for funnel-lab ad creatives.
 *
 * Strategy: launch chromium in the Vercel function, navigate to
 * /render/creative/<slug> on the same deployment, screenshot the
 * data-creative-export div (clean 1080×1080 PNG).
 *
 * Why @sparticuz/chromium (full) + puppeteer-core?
 *   - Full (not -min) bundles libs inside the npm package — no runtime download
 *   - puppeteer-core is the Sparticuz-supported launcher
 *
 * Defensive env handling: Sparticuz sets process.env.LD_LIBRARY_PATH internally
 * during executablePath(), but on Vercel's runtime that doesn't always
 * propagate to the chromium child process spawned by puppeteer. We re-assert
 * it explicitly and pass it via the launch `env` option as belt-and-braces.
 */

import "server-only";
import chromium from "@sparticuz/chromium";
import puppeteer, { type Browser } from "puppeteer-core";
import { readdirSync } from "fs";

let cachedBrowser: Browser | null = null;
let cachedAt = 0;
const BROWSER_REUSE_MS = 5 * 60 * 1000;

function ensureLibraryPath(): string {
  // Sparticuz extracts libs to subdirs of /tmp. The dir name depends on the
  // runtime: /tmp/al2 (Amazon Linux 2) or /tmp/al2023 (Amazon Linux 2023).
  // Vercel's serverless runtime is currently AL2023 for Node 20/22 builds.
  // We include both so we cover whichever runtime is active.
  const sparticuzPaths = [
    "/tmp",
    "/tmp/al2",
    "/tmp/al2023",
    "/tmp/swiftshader",
  ];
  const merged = [
    ...sparticuzPaths,
    process.env.LD_LIBRARY_PATH,
  ].filter(Boolean).join(":");
  process.env.LD_LIBRARY_PATH = merged;
  return merged;
}

function debugTmpListing(): string {
  try {
    const top = readdirSync("/tmp");
    const interesting: Record<string, string[]> = { "/tmp": top };
    for (const sub of ["al2023", "al2", "swiftshader"]) {
      try {
        interesting[`/tmp/${sub}`] = readdirSync(`/tmp/${sub}`);
      } catch {
        interesting[`/tmp/${sub}`] = ["<missing>"];
      }
    }
    return JSON.stringify(interesting);
  } catch (e) {
    return `<unable to read /tmp: ${e instanceof Error ? e.message : String(e)}>`;
  }
}

async function getBrowser(): Promise<Browser> {
  if (cachedBrowser && Date.now() - cachedAt < BROWSER_REUSE_MS && cachedBrowser.connected) {
    return cachedBrowser;
  }
  if (cachedBrowser) {
    try { await cachedBrowser.close(); } catch { /* ignore */ }
    cachedBrowser = null;
  }

  const executablePath = await chromium.executablePath();
  const libPath = ensureLibraryPath();

  try {
    cachedBrowser = await puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: true,
      env: {
        ...process.env,
        LD_LIBRARY_PATH: libPath,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `${msg} | LD_LIBRARY_PATH=${libPath} | executablePath=${executablePath} | /tmp contents=${debugTmpListing()}`
    );
  }

  cachedAt = Date.now();
  return cachedBrowser;
}

export interface RenderOptions {
  url: string;
  selector?: string;
  width?: number;
  height?: number;
  scale?: number;
  selectorTimeoutMs?: number;
}

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

    await page.evaluate(() => (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts?.ready);

    if (opts.selector) {
      await page.waitForSelector(opts.selector, {
        timeout: opts.selectorTimeoutMs ?? 10_000,
      });
    }

    const buf = await page.screenshot({
      type: "png",
      omitBackground: opts.omitBackground ?? false,
      fullPage: false,
      clip: { x: 0, y: 0, width, height },
    });

    return Buffer.from(buf as Uint8Array);
  } finally {
    await page.close().catch(() => { /* ignore */ });
  }
}

export function publicCreativeUrl(siteOrigin: string, slug: string): string {
  return `${siteOrigin}/api/render/creative/${encodeURIComponent(slug)}.png`;
}
