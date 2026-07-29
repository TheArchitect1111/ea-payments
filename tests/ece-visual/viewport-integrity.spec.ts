import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * ECE viewport integrity checks. Multimodal critic consumes screenshots separately.
 * Set ECE_PREVIEW_PATHS as comma-separated preview paths to capture.
 */
const previewPaths = (process.env.ECE_PREVIEW_PATHS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const outDir = path.join(process.cwd(), '.ece-screenshots');

test.describe('ECE viewport integrity', () => {
  test.skip(!previewPaths.length, 'Set ECE_PREVIEW_PATHS to run captures');

  for (const previewPath of previewPaths) {
    test(`render ${previewPath}`, async ({ page }, testInfo) => {
      fs.mkdirSync(outDir, { recursive: true });
      const response = await page.goto(previewPath, { waitUntil: 'networkidle' });
      expect(response?.ok() || response?.status() === 304).toBeTruthy();

      const overflowX = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
      });
      expect(overflowX, 'horizontal overflow').toBeFalsy();

      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      const broken: string[] = [];
      const links = page.locator('a[href]');
      const count = await links.count();
      for (let i = 0; i < Math.min(count, 20); i += 1) {
        const href = await links.nth(i).getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('mailto:')) continue;
        if (href.includes('/sites/')) broken.push(href);
      }
      expect(broken, 'unpublished /sites links').toEqual([]);

      const file = path.join(
        outDir,
        `${testInfo.project.name}__${previewPath.replace(/[^\w.-]+/g, '_')}.png`,
      );
      await page.screenshot({ path: file, fullPage: true });
    });
  }
});
