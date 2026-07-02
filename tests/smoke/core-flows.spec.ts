import { expect, test } from '@playwright/test';

test('homepage hero and primary CTA render', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', {
      name: /every coach starts with the same dream/i,
    }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /imagine yours/i }).first()).toBeVisible();
});

test('consider selena demo story is reachable', async ({ page }) => {
  await page.goto('/story/selena');
  await expect(page).toHaveURL(/\/consider\/selena|\/story\/selena/);
  await expect(page.locator('body')).not.toBeEmpty();
});

test('assessment page is reachable', async ({ page }) => {
  await page.goto('/assessment');
  await expect(page.getByRole('heading', { name: /ctp intake/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /submit my ctp intake/i })).toBeVisible();
});

test('admin dashboard route prompts auth', async ({ page }) => {
  await page.goto('/admin/dashboard');
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole('heading', { level: 1, name: /admin sign in/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /email me a login link/i })).toBeVisible();
});

test('experience lab journey is reachable', async ({ page }) => {
  await page.goto('/experience-lab');
  await expect(page.getByText(/every relationship begins with one conversation/i).first()).toBeVisible();
  const finaleCta = page.getByRole('link', { name: /consider the possibilities/i });
  await finaleCta.scrollIntoViewIfNeeded();
  await expect(finaleCta).toBeVisible();
  await expect(finaleCta).toHaveAttribute('href', '/possibilities');
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

test('amplifi social posting page is reachable', async ({ page }) => {
  await page.goto('/amplifi');
  await expect(page.getByRole('heading', { name: /search\. create\. store/i })).toBeVisible();
  await page.getByRole('button', { name: /try demo/i }).click();
  await expect(page.getByText(/amplifi story drafts/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /submit for approval/i })).toBeVisible();
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

test('portal billing route requires portal login', async ({ page }) => {
  await page.goto('/portal/demo-client/billing');
  await expect(page).toHaveURL(/\/portal\/login/);
});

test('mission control API requires admin auth', async ({ page }) => {
  const res = await page.request.get('/api/mission-control');
  expect(res.status()).toBe(401);
});

test('intent API requires admin auth', async ({ page }) => {
  const res = await page.request.post('/api/intent', {
    data: { intent: 'open proposals' },
  });
  expect(res.status()).toBe(401);
});

test('whoami API returns 401 when unauthenticated', async ({ page }) => {
  const res = await page.request.get('/api/auth/whoami');
  expect(res.status()).toBe(401);
  const data = (await res.json()) as { authenticated?: boolean };
  expect(data.authenticated).toBe(false);
});

test('auth session exchange rejects missing token', async ({ page }) => {
  const res = await page.request.post('/api/auth/session', { data: {} });
  expect(res.status()).toBe(400);
});

test('auth session exchange rejects invalid magic-link token', async ({ page }) => {
  const res = await page.request.post('/api/auth/session', {
    data: { token: 'not-a-real-token.signature' },
  });
  expect([401, 500]).toContain(res.status());
});

test('design system tokens load globally', async ({ page }) => {
  await page.goto('/');
  const tokens = await page.evaluate(() => ({
    navy: getComputedStyle(document.documentElement).getPropertyValue('--ea-navy').trim(),
    gold: getComputedStyle(document.documentElement).getPropertyValue('--ea-gold').trim(),
  }));
  expect(tokens.navy).toBe('#1b2b4d');
  expect(tokens.gold).toBe('#c9a844');
});

test('portal notifications API requires auth', async ({ page }) => {
  const res = await page.request.get('/api/portal/notifications');
  expect(res.status()).toBe(401);
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
  await expect(page.getByRole('heading', { name: /your opportunities, organized/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /capture now/i })).toBeVisible();
});

test('simplifi capture PWA page is reachable', async ({ page }) => {
  await page.goto('/simplifi/capture');
  await expect(page.getByText(/never lose an opportunity/i)).toBeVisible();
});

test('try tester hub is reachable', async ({ page }) => {
  await page.goto('/try');
  await expect(page.getByRole('heading', { name: /try every page/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /sign in with demo account/i })).toBeVisible();
});

test('simplifi settings page is reachable', async ({ page }) => {
  await page.goto('/simplifi/settings');
  await expect(page.getByRole('heading', { name: /^settings$/i })).toBeVisible();
});

test('simplifi workspace API requires auth', async ({ page }) => {
  const res = await page.request.get('/api/simplifi/workspace');
  expect(res.status()).toBe(401);
});

test('simplifi orb context API is public', async ({ page }) => {
  const res = await page.request.get('/api/simplifi/context?pathname=/simplifi/capture');
  expect(res.status()).toBe(200);
  const data = (await res.json()) as { ok?: boolean; orb?: { product?: string } };
  expect(data.ok).toBe(true);
  expect(data.orb?.product).toBe('simplifi');
});

test('simplifi me API requires auth', async ({ page }) => {
  const res = await page.request.get('/api/simplifi/me');
  expect(res.status()).toBe(401);
});

test('simplifi brief API requires auth', async ({ page }) => {
  const res = await page.request.get('/api/simplifi/brief');
  expect(res.status()).toBe(401);
});

test('auth logout JSON endpoint works', async ({ page }) => {
  const res = await page.request.post('/api/auth/logout');
  expect(res.status()).toBe(200);
  const data = (await res.json()) as { ok?: boolean };
  expect(data.ok).toBe(true);
});

test('extension bootstrap API requires auth', async ({ page }) => {
  const res = await page.request.get('/api/extension/bootstrap');
  expect(res.status()).toBe(401);
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

test('organizations API requires portal login', async ({ page }) => {
  const res = await page.request.get('/api/organizations');
  expect(res.status()).toBe(401);
});

test('admin connect setup POST requires admin manage role', async ({ page }) => {
  const res = await page.request.post('/api/admin/connect/setup');
  expect(res.status()).toBe(401);
});

test('portal modules API requires login', async ({ page }) => {
  const res = await page.request.get('/api/portal/modules');
  expect(res.status()).toBe(401);
});

test('portal connect route requires portal login', async ({ page }) => {
  await page.goto('/portal/demo-client/connect');
  await expect(page).toHaveURL(/\/portal\/login/);
});

test('public connect capture page is reachable', async ({ page }) => {
  await page.goto('/connect/demo-client');
  await expect(page.locator('body')).not.toBeEmpty();
});

test('connect nurture health endpoint is reachable', async ({ page }) => {
  const res = await page.request.get('/api/health/connect-nurture');
  expect(res.status()).toBe(200);
  const body = (await res.json()) as { cron?: { path?: string }; lastRun?: unknown; actions?: string[] };
  expect(body.cron?.path).toBe('/api/cron/connect-sequence');
  expect(body).toHaveProperty('lastRun');
  expect(body).toHaveProperty('actions');
});

test('admin connect nurture verify requires auth', async ({ page }) => {
  const res = await page.request.post('/api/admin/connect/nurture-verify', {
    data: { orgSlug: 'demo-client' },
  });
  expect(res.status()).toBe(401);
});

test('admin connect run-nurture requires auth', async ({ page }) => {
  const res = await page.request.post('/api/admin/connect/run-nurture');
  expect(res.status()).toBe(401);
});

test('admin connect test-matrix requires auth', async ({ page }) => {
  const res = await page.request.get('/api/admin/connect/test-matrix?org=demo-client');
  expect(res.status()).toBe(401);
});

test('portal connect copy API requires login', async ({ page }) => {
  const res = await page.request.post('/api/portal/connect/copy', {
    data: { offerHeadline: 'Test headline' },
  });
  expect(res.status()).toBe(401);
});

test('portal connect qr-pack requires login', async ({ page }) => {
  const res = await page.request.get('/api/portal/connect/qr-pack');
  expect(res.status()).toBe(401);
});

test('admin connect tenant patch requires auth', async ({ page }) => {
  const res = await page.request.patch('/api/admin/connect/tenants/demo-client', {
    data: { offerHeadline: 'Test' },
  });
  expect(res.status()).toBe(401);
});

test('admin connect refresh-memory requires auth', async ({ page }) => {
  const res = await page.request.post('/api/admin/connect/refresh-memory', {
    data: { orgSlug: 'demo-client' },
  });
  expect(res.status()).toBe(401);
});

test('admin connect delivery-log requires auth', async ({ page }) => {
  const res = await page.request.get('/api/admin/connect/delivery-log?org=demo-client');
  expect(res.status()).toBe(401);
});

test('portal connect tasks requires login', async ({ page }) => {
  const res = await page.request.get('/api/portal/connect/tasks');
  expect(res.status()).toBe(401);
});

test('admin connect tasks requires auth', async ({ page }) => {
  const res = await page.request.get('/api/admin/connect/tasks?org=demo-client');
  expect(res.status()).toBe(401);
});

test('admin connect matrix-run requires auth', async ({ page }) => {
  const res = await page.request.post('/api/admin/connect/matrix-run', {
    data: { orgSlug: 'demo-client' },
  });
  expect(res.status()).toBe(401);
});

test('admin connect launch requires auth', async ({ page }) => {
  const res = await page.request.get('/api/admin/connect/launch?org=demo-client');
  expect(res.status()).toBe(401);
});

test('portal documents requires login', async ({ page }) => {
  await page.goto('/portal/demo-client/documents');
  await expect(page).toHaveURL(/\/portal\/login/);
});
