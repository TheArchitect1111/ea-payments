import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const base = process.env.BRIDGE_PREVIEW_URL ?? 'https://ea-payments-git-poc-ama-b13cfd-the-architects-projects-cc813778.vercel.app';
const out = 'docs/audit/screenshots';
const classroom = '/portal/amanda-catherine/classroom-test';
test.beforeAll(async () => { await mkdir(out, {recursive: true}); });

test('unauthenticated classroom returns branded HTTP 403', async ({ browser }) => {
  const page = await browser.newPage();
  const r = await page.goto(base + classroom);
  expect(r?.status()).toBe(403);
  await expect(page.getByText('Classroom Access - Enrolled Students Only')).toBeVisible();
  await expect(page.getByText('This classroom is for verified Wood Therapy students')).toBeVisible();
  await page.screenshot({path: out + '/test2-403.png', fullPage: true});
  await page.close();
});

test('authorized synthetic student sees branded classroom desktop and mobile', async ({ browser }) => {
  test.skip(!process.env.EA_PORTAL_SESSION_COOKIE, 'Requires a genuine EA synthetic-user session, never a forged cookie');
  for (const [name, viewport] of [
    ['desktop', {width: 1440, height: 900}],
    ['mobile', {width: 390, height: 844}],
  ] as const) {
    const context = await browser.newContext({ viewport });
    await context.addCookies([{
      name: 'ea_portal_session', value: process.env.EA_PORTAL_SESSION_COOKIE!,
      url: base, httpOnly: true, sameSite: 'Lax',
    }]);
    const page = await context.newPage();
    const r = await page.goto(base + classroom);
    expect(r?.status()).toBe(200);
    await expect(page.getByText('Wood Therapy Test')).toBeVisible();
    await expect(page.getByText('Video placeholder')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Frappe');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({path: out + '/test1-' + name + '.png', fullPage: true});
    await context.close();
  }
});
