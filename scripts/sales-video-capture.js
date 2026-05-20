#!/usr/bin/env node
/**
 * MomFluence sales-video frame capture (Path B)
 *
 * Drives the in-page render mode via puppeteer. For each scene (A/B/C),
 * walks the 15s timeline at 30fps and writes 450 PNGs at native 1080x1920.
 *
 * Usage:
 *   npm i puppeteer
 *   node capture.js                   # captures A, B, C → ./frames/
 *   node capture.js --scene A         # one scene only
 *   node capture.js --fps 30 --dur 15 # tweak rate / length
 *
 * Output layout:
 *   frames/sceneA/frame-0000.png ... frame-0449.png   (15s × 30fps)
 *   frames/sceneB/...
 *   frames/sceneC/...
 *
 * Then encode each with the included encode.sh.
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs/promises');

const args = process.argv.slice(2);
const flag = (k, def) => {
  const i = args.indexOf('--' + k);
  return i >= 0 ? args[i + 1] : def;
};

const FPS = parseInt(flag('fps', '30'), 10);
const DUR = parseFloat(flag('dur', '15'));
const ONLY = flag('scene', null);              // 'A' | 'B' | 'C' | null
const OUT  = flag('out', './frames');
const HTML_PATH = path.resolve(__dirname, 'index.html');
const URL = `file://${HTML_PATH}?render=1`;

const SCENES = ['A', 'B', 'C'].filter(s => !ONLY || s === ONLY);
const FRAMES = Math.round(DUR * FPS);

(async () => {
  console.log(`▸ MomFluence sales-video capture`);
  console.log(`  ${FRAMES} frames per scene, ${SCENES.join(' + ')}`);
  console.log(`  url: ${URL}`);
  console.log(`  out: ${OUT}\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1080, height: 1920, deviceScaleFactor: 1 },
    args: ['--font-render-hinting=none', '--disable-font-subpixel-positioning'],
  });
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'networkidle0' });

  // Wait for fonts + the in-page render API to be ready
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    let tries = 100;
    while (tries-- && !(window.captureFrame && window.__setTime && window.__videoApi)) {
      await new Promise(r => setTimeout(r, 50));
    }
  });

  for (const scene of SCENES) {
    const dir = path.join(OUT, `scene${scene}`);
    await fs.mkdir(dir, { recursive: true });

    console.log(`▸ scene ${scene}: switching variation`);
    await page.evaluate((v) => window.__videoApi.setVariation(v), scene);
    // Let React commit the new scene + initial paint
    await new Promise(r => setTimeout(r, 600));

    console.log(`  capturing ${FRAMES} frames @ ${FPS}fps`);
    const t0 = Date.now();
    for (let i = 0; i < FRAMES; i++) {
      const t = i / FPS;
      // Drive in-page render & get base64 PNG of the 1080x1920 canvas div
      const dataUrl = await page.evaluate((tt) => window.captureFrame(tt), t);
      if (!dataUrl) {
        console.warn(`  ! frame ${i} returned null`);
        continue;
      }
      const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
      const name = `frame-${String(i).padStart(4, '0')}.png`;
      await fs.writeFile(path.join(dir, name), buf);
      if (i % 30 === 0) {
        const pct = ((i / FRAMES) * 100).toFixed(0);
        process.stdout.write(`\r  ${pct}%  frame ${i}/${FRAMES}`);
      }
    }
    const took = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`\n  done in ${took}s → ${dir}\n`);
  }

  await browser.close();
  console.log('✓ all scenes captured. Next: bash encode.sh');
})().catch(e => { console.error(e); process.exit(1); });
