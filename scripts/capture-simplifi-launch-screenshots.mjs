/**
 * Capture Simplifi launch readiness screenshots.
 * Usage: node scripts/capture-simplifi-launch-screenshots.mjs [baseUrl]
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const BASE = process.argv[2] || 'https://ea-payments.vercel.app';
const OUT = path.join('docs', 'screenshots', 'simplifi', 'launch-readiness');

const PAGES = [
  { name: 'capture-desktop', url: '/simplifi/capture', viewport: { width: 1280, height: 900 } },
  { name: 'capture-mobile', url: '/simplifi/capture', viewport: { width: 390, height: 844 } },
  { name: 'workspace-desktop', url: '/simplifi/workspace', viewport: { width: 1280, height: 900 } },
  { name: 'landing-desktop', url: '/simplifi', viewport: { width: 1280, height: 900 } },
];

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const meta = [];

  for (const page of PAGES) {
    const ctx = await browser.newPage({ viewport: page.viewport });
    await ctx.goto(`${BASE}${page.url}`, { waitUntil: 'networkidle' });
    const file = `${page.name}.png`;
    await ctx.screenshot({ path: path.join(OUT, file), fullPage: true });
    await ctx.close();
    meta.push({ ...page, file, url: `${BASE}${page.url}` });
    console.log('✓', file);
  }

  await browser.close();
  await writeFile(path.join(OUT, 'capture-meta.json'), JSON.stringify({ capturedAt: new Date().toISOString(), base: BASE, pages: meta }, null, 2));
  console.log('Saved to', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
