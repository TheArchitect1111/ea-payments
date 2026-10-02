import { test, expect } from '@playwright/test';
const original = '/portal/amanda-catherine/learning/body-sculpt-practitioner-certification?view=progress';
test('logged-out course portal link preserves original return URL', async ({ page }) => {
  await page.goto('/amanda-catherine');
  await page.evaluate((href) => {
    const link = document.createElement('a'); link.href = href; link.textContent = 'QA purchased course'; document.body.append(link);
  }, original);
  await page.getByRole('link', { name: 'QA purchased course' }).click();
  await expect(page).toHaveURL(/\/portal\/login\?/);
  expect(new URL(page.url()).searchParams.get('next')).toBe(original);
});
test('purchased READY learner returns to original course after password login', async ({ page }) => {
  test.skip(!process.env.AMANDA_QA_EMAIL || !process.env.AMANDA_QA_PASSWORD, 'Requires approved QA learner with this READY course purchased.');
  await page.goto(`/portal/login?next=${encodeURIComponent(original)}`);
  const response = await page.request.post('/api/portal/login', { data: {
    email: process.env.AMANDA_QA_EMAIL, password: process.env.AMANDA_QA_PASSWORD, next: original,
  }});
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data.requires2FA).not.toBeTruthy();
  expect(data.next).toBe(original);
  await page.goto(data.next);
  await expect(page).toHaveURL(new RegExp('/portal/amanda-catherine/learning/body-sculpt-practitioner-certification'));
  await expect(page.getByRole('heading', { name: 'Body Sculpt' }).first()).toBeVisible();
});
