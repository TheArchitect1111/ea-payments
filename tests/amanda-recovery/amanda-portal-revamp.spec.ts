import { test, expect } from '@playwright/test';

const base = process.env.AMANDA_PORTAL_REVAMP_URL || process.env.PORTAL_BASE || 'http://127.0.0.1:3000';
const owner = '/portal/amanda-catherine/owner';

test.describe('Amanda portal revamp evidence', () => {
  test('owner shell is Amanda-specific and coherent', async ({ page }) => {
    const response = await page.goto(base + owner);
    expect(response?.status() || 0).toBeLessThan(500);
    await expect(page.getByText('Welcome, Amanda.')).toBeVisible();
    await expect(page.getByText('AesthetiKine', { exact: true })).toBeVisible();
    await expect(page.getByText('One calm workspace for your studio, academy, creative work and business.')).toBeVisible();
    for (const label of ['Home','Appointments','Clients','Academy','LIFELINE','Documents','Marketing','Insights','Messages','Update Hub','Eva','Settings']) {
      await expect(page.getByRole('link', { name: label, exact: true })).toBeVisible();
    }
    await page.screenshot({ path: 'test-results/amanda-owner-desktop.png', fullPage: true });
  });

  test('owner portal has no mobile horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const response = await page.goto(base + owner);
    expect(response?.status() || 0).toBeLessThan(500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.screenshot({ path: 'test-results/amanda-owner-mobile.png', fullPage: true });
  });

  for (const path of ['appointments','clients','academy','lifeline','documents','marketing','insights','messages','updates','eva','settings']) {
    test(path + ' stays inside Amanda owner workspace', async ({ page }) => {
      const response = await page.goto(base + owner + '/' + path);
      expect(response?.status() || 0).toBeLessThan(400);
      await expect(page.getByText('AesthetiKine', { exact: true })).toBeVisible();
    });
  }
});
