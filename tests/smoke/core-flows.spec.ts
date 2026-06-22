import { expect, test } from '@playwright/test';

test('homepage hero and primary CTA render', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', {
      name: /discover the possibilities/i,
    }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /discover what's possible/i }).first()).toBeVisible();
});

test('consider selena demo story is reachable', async ({ page }) => {
  await page.goto('/story/selena');
  await expect(page).toHaveURL(/\/consider\/selena|\/story\/selena/);
  await expect(page.locator('body')).not.toBeEmpty();
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

test('pulse route requires portal login', async ({ page }) => {
  await page.goto('/portal/demo-client/pulse');
  await expect(page).toHaveURL(/\/portal\/login/);
});

test('simplifi portal route requires portal login', async ({ page }) => {
  await page.goto('/portal/demo-client/simplifi');
  await expect(page).toHaveURL(/\/portal\/login/);
});

test('amplifi share page is reachable', async ({ page }) => {
  await page.goto('/amplifi/share');
  await expect(page.getByRole('heading', { name: /amplify what you see/i })).toBeVisible();
});

test('magnifi consider demo has opportunity content', async ({ page }) => {
  await page.goto('/consider/selena');
  await expect(page.getByRole('heading', { name: /opportunity scores/i })).toBeVisible();
});

test('checkout lists purchasable packages only', async ({ page }) => {
  await page.goto('/checkout');
  const options = page.locator('select option');
  await expect(options.filter({ hasText: /Simplifi Early Access/i })).toHaveCount(1);
  await expect(options.filter({ hasText: /Capacity Assessment/i })).toHaveCount(0);
});

test('assessment thank-you contact link works', async ({ page }) => {
  await page.goto('/assessment/thank-you');
  await expect(page.getByRole('link', { name: /contact our team/i })).toHaveAttribute(
    'href',
    'mailto:freedom@efficiencyarchitects.online',
  );
});

test('simplifi workspace is reachable', async ({ page }) => {
  await page.goto('/simplifi/workspace');
  await expect(page.getByRole('heading', { name: /what's worth exploring today/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /capture now/i })).toBeVisible();
});

test('app alias redirects to workspace', async ({ page }) => {
  await page.goto('/app');
  await expect(page).toHaveURL(/\/simplifi\/workspace/);
});

test('experience templates library is reachable', async ({ page }) => {
  await page.goto('/experience/templates');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/template library/i);
  await expect(page.getByText(/Executive Transformation/i)).toBeVisible();
});

test('health launch endpoint returns JSON', async ({ page }) => {
  const res = await page.request.get('/api/health/launch');
  expect(res.status()).toBe(200);
  const data = (await res.json()) as { ok?: boolean; checks?: { demoClient?: boolean } };
  expect(typeof data.ok).toBe('boolean');
  expect(data.checks).toBeTruthy();
});

test('portal documents requires login', async ({ page }) => {
  await page.goto('/portal/demo-client/documents');
  await expect(page).toHaveURL(/\/portal\/login/);
});
