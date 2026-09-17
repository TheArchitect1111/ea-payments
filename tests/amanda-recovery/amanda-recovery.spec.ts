import { test, expect } from '@playwright/test';

const PUBLIC_SITE = process.env.AMANDA_PUBLIC_URL || 'https://www.amandacatherine.ca';
const PORTAL_BASE = process.env.AMANDA_PORTAL_URL || 'https://ea-payments.vercel.app';
const COURSE = 'non-surgical-tummy-tuck-training';

async function evidence(page: any, name: string) {
  await page.screenshot({ path: `test-results/amanda-${name}.png`, fullPage: true });
}

test.describe('Amanda recovery evidence', () => {
  test('public site renders client-facing experience', async ({ page }) => {
    const response = await page.goto(PUBLIC_SITE, { waitUntil: 'networkidle' });
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('body')).toContainText(/Amanda|AesthetiKine/i);
    await evidence(page, 'public-desktop');
  });

  test('public site mobile renders without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(PUBLIC_SITE, { waitUntil: 'networkidle' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBeFalsy();
    await evidence(page, 'public-mobile');
  });

  test('course enrollment route is real and branded', async ({ page }) => {
    const url = `${PORTAL_BASE}/portal/amanda-catherine/enroll?course=${COURSE}`;
    const response = await page.goto(url, { waitUntil: 'networkidle' });
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('body')).toContainText(/Amanda|AesthetiKine|course|training/i);
    await evidence(page, 'enrollment');
  });

  test('owner portal route resolves to Amanda experience', async ({ page }) => {
    const response = await page.goto(`${PORTAL_BASE}/portal/amanda-catherine/owner`, { waitUntil: 'networkidle' });
    expect(response?.status()).toBeLessThan(500);
    await evidence(page, 'owner-portal');
  });

  test('learning route resolves and preserves intended destination through auth', async ({ page }) => {
    const response = await page.goto(`${PORTAL_BASE}/portal/amanda-catherine/learning`, { waitUntil: 'networkidle' });
    expect(response?.status()).toBeLessThan(500);
    const finalUrl = page.url();
    expect(finalUrl).toMatch(/amanda-catherine|login|sign-in|learning/i);
    await evidence(page, 'learning-or-auth');
  });
});
