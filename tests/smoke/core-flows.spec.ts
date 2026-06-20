import { expect, test } from '@playwright/test';

test('homepage hero and primary CTA render', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', {
      name: /what would become possible if more got done and more of your time belonged to you/i,
    }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /take the assessment/i }).first()).toBeVisible();
});

test('assessment page is reachable', async ({ page }) => {
  await page.goto('/assessment');
  await expect(page.getByRole('button', { name: /submit my assessment/i })).toBeVisible();
});

test('admin dashboard route prompts auth', async ({ page }) => {
  await page.goto('/admin/dashboard');
  await expect(page.getByRole('heading', { name: /admin access/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
});

test('unsubscribe page is reachable', async ({ page }) => {
  await page.goto('/unsubscribe');
  await expect(page.getByRole('heading', { name: /^unsubscribe$/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /email unsubscribe request/i })).toBeVisible();
});

test('scorecard download asset is available', async ({ page }) => {
  const res = await page.request.get('/downloads/visibility-assessment-scorecard.docx');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('wordprocessingml');
});

test('simplifi landing page is reachable', async ({ page }) => {
  await page.goto('/simplifi');
  await expect(page.getByRole('heading', { name: /never lose an opportunity again/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /^simplifi$/i })).toBeVisible();
});
