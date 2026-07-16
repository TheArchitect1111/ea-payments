import { expect, test } from '@playwright/test';

test('homepage routes to canonical CTP on cc', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/cc\.efficiencyarchitects\.online\/ctp/);
});

test('consider selena demo story is reachable', async ({ page }) => {
  await page.goto('/story/selena');
  await expect(page).toHaveURL(/\/consider\/selena|\/story\/selena/);
  await expect(page.locator('body')).not.toBeEmpty();
});

test('quarantined ctp-intake redirects to canonical CTP', async ({ page }) => {
  await page.goto('/ctp-intake');
  await expect(page).toHaveURL(/cc\.efficiencyarchitects\.online\/ctp/);
});

test('assessment aliases canonical CTP', async ({ page }) => {
  await page.goto('/assessment');
  await expect(page).toHaveURL(/cc\.efficiencyarchitects\.online\/ctp/);
});

test('admin dashboard route prompts auth', async ({ page }) => {
  await page.goto('/admin/dashboard');
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole('heading', { name: /admin sign in/i })).toBeVisible();
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

test('amplifi landing page is reachable', async ({ page }) => {
  await page.goto('/amplifi');
  await expect(page.getByRole('heading', { name: /search\. create\. store for approval/i })).toBeVisible();
});

test('magnifi consider demo has opportunity content', async ({ page }) => {
  await page.goto('/consider/selena');
  await expect(page.getByRole('heading', { name: /opportunity scores/i })).toBeVisible();
});

test('magnifi cinematic demo renders without airtable', async ({ page }) => {
  await page.goto('/consider/selena');
  await expect(page.getByRole('heading', { name: /selena executive coaching/i })).toBeVisible();
});

test('magnifi classic report demo renders', async ({ page }) => {
  await page.goto('/consider/selena');
  await expect(page.getByRole('heading', { name: /opportunity scores/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /selena executive coaching/i })).toBeVisible();
});

test('magnifi unknown id returns 404', async ({ page }) => {
  const res = await page.goto('/magnifi/does-not-exist-zzz');
  expect(res?.status()).toBe(404);
});

test('checkout lists purchasable packages only', async ({ page }) => {
  await page.goto('/checkout');
  const options = page.locator('select option');
  await expect(options.filter({ hasText: /Simplifi Early Access/i })).toHaveCount(1);
  await expect(options.filter({ hasText: /Website \+ Portal Starter/i })).toHaveCount(1);
  await expect(options.filter({ hasText: /Capacity Assessment/i })).toHaveCount(0);
});

test('buy path sells Website + Portal Starter into checkout', async ({ page }) => {
  await page.goto('/buy');
  await expect(page.getByRole('heading', { name: /website \+ portal starter/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /continue to checkout/i })).toHaveAttribute(
    'href',
    '/checkout?package=website_portal_starter',
  );
  await page.getByRole('link', { name: /continue to checkout/i }).click();
  await expect(page).toHaveURL(/\/checkout\?package=website_portal_starter/);
  const select = page.locator('select');
  await expect(select).toHaveValue('website_portal_starter', { timeout: 15_000 });
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
  await expect(page.getByRole('heading', { name: /what deserves your attention/i })).toBeVisible();
  await expect(page.locator('.sw-ambient-lead')).toBeVisible();
  await expect(page.locator('.sw-ambient-lead')).toContainText(/Nothing urgent|deserve/i);
  await expect(
    page.getByRole('navigation', { name: /Simplifi primary/i }).getByRole('link', { name: /^capture$/i }),
  ).toBeVisible();

  const orb = page.getByRole('button', { name: /SIMPLIFI Orb/i });
  await expect(orb).toBeVisible();
  await orb.click();
  await expect(page.getByRole('dialog', { name: /SIMPLIFI intelligence/i })).toBeVisible();
  // Ambient opener (Step 3) — grounded greeting / attention copy on first expand.
  await expect(page.locator('.global-orb-ambient')).toBeVisible();
  await expect(page.locator('.global-orb-ambient')).toContainText(/Good morning|Nothing urgent|deserve/i);
  await expect(page.getByRole('button', { name: /^close$/i })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  expect(
    await page
      .getByRole('dialog', { name: /SIMPLIFI intelligence/i })
      .evaluate((dialog) => dialog.contains(document.activeElement)),
  ).toBe(true);

  await page.getByRole('textbox', { name: /Ask Simplifi/i }).fill('open capture');
  await page.getByRole('button', { name: /^ask$/i }).click();
  // Capture is now a temporary session workspace over the Brief.
  await expect(page).toHaveURL(/\/simplifi\/workspace/);
  await expect(page.getByRole('dialog', { name: /capture workspace/i })).toBeVisible();
});

test('simplifi orb ask opens inbox session workspace in place', async ({ page }) => {
  await page.goto('/simplifi/workspace');
  await page.getByRole('button', { name: /SIMPLIFI Orb/i }).click();
  await page.getByRole('textbox', { name: /Ask Simplifi/i }).fill('show my inbox');
  await page.getByRole('button', { name: /^ask$/i }).click();

  // Inbox is now a temporary session workspace over the Brief, not a route change.
  await expect(page).toHaveURL(/\/simplifi\/workspace/);
  const session = page.getByRole('dialog', { name: /inbox workspace/i });
  await expect(session).toBeVisible();

  // Dismiss returns to the Brief underneath.
  await page.getByRole('button', { name: /^done$/i }).click();
  await expect(session).toBeHidden();
  await expect(page.getByRole('heading', { name: /what deserves your attention/i })).toBeVisible();
});

test('app alias redirects to workspace', async ({ page }) => {
  await page.goto('/app');
  await expect(page).toHaveURL(/\/simplifi\/workspace/);
});

test('experience templates library is reachable', async ({ page }) => {
  await page.goto('/experience/templates');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/template library/i);
  await expect(page.getByRole('heading', { name: /Executive Transformation/i })).toBeVisible();
});

test('health launch endpoint returns JSON', async ({ page }) => {
  const res = await page.request.get('/api/health/launch');
  expect(res.status()).toBe(200);
  const data = (await res.json()) as {
    ok?: boolean;
    status?: string;
    checks?: {
      demoClient?: boolean;
      revenueReady?: boolean;
      deliveryReady?: boolean;
      monitoringReady?: boolean;
      resilienceReady?: boolean;
      criticalReady?: boolean;
      fullLaunchReady?: boolean;
      missingByCategory?: unknown;
    };
  };
  expect(typeof data.ok).toBe('boolean');
  expect(typeof data.status).toBe('string');
  expect(data.checks).toBeTruthy();
  expect(typeof data.checks?.revenueReady).toBe('boolean');
  expect(typeof data.checks?.deliveryReady).toBe('boolean');
  expect(typeof data.checks?.monitoringReady).toBe('boolean');
  expect(typeof data.checks?.resilienceReady).toBe('boolean');
  expect(typeof data.checks?.criticalReady).toBe('boolean');
  expect(typeof data.checks?.fullLaunchReady).toBe('boolean');
  expect(data.checks?.missingByCategory).toBeTruthy();
});

test('health ops endpoint returns JSON', async ({ page }) => {
  const res = await page.request.get('/api/health/ops');
  expect([200, 503]).toContain(res.status());
  const data = (await res.json()) as {
    ok?: boolean;
    launchStatus?: string;
    readinessScore?: number;
    subsystems?: unknown[];
    monitoring?: { sentryConfigured?: boolean };
  };
  expect(typeof data.ok).toBe('boolean');
  expect(typeof data.launchStatus).toBe('string');
  expect(typeof data.readinessScore).toBe('number');
  expect(Array.isArray(data.subsystems)).toBe(true);
  expect(data.monitoring).toBeTruthy();
});

test('portal documents requires login', async ({ page }) => {
  await page.goto('/portal/demo-client/documents');
  await expect(page).toHaveURL(/\/portal\/login/);
});
