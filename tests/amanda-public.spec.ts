import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const base = 'https://amandacatherine.ca';
test.describe('Amanda public production checks (no credentials and no payments)', () => {
  test('homepage removes retired content and keeps Clinical Fat Loss waitlist-only', async ({ page }) => {
    await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Clinical Fat Loss Injectables for Face & Body Contouring/i })).toBeVisible();
    await expect(page.getByText(/Non-Surgical Tummy Sculpt & Tighten|Non-Surgical Tummy Tuck/i)).toHaveCount(0);
    await expect(page.getByText(/BODY SCULPT(?:™)? NATIONAL TRAINING TOUR/i)).toHaveCount(0);
    const clinicalCard = page.locator('article, section, li, div').filter({
      has: page.getByRole('heading', { name: /Clinical Fat Loss Injectables for Face & Body Contouring/i }),
    }).last();
    await expect(clinicalCard.getByRole('link', { name: /Join Waitlist/i })).toBeVisible();
    await expect(clinicalCard.getByRole('link', { name: /Enroll|Pay|Purchase/i })).toHaveCount(0);
  });

  test('RIMAN uses kit visual and a single Canadian destination in site and owner source', async ({ page }) => {
    await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
    const kit = page.getByRole('img', { name: /RIMAN Incellderm ICD Expert Experience Kit/i });
    await expect(kit).toBeVisible();
    await expect(kit).toHaveAttribute('src', /ICDExpertExperienceKit/);
    const publicCta = page.getByRole('link', { name: /Shop RIMAN Canada/i });
    await expect(publicCta).toHaveAttribute('href', 'https://riman.com/amandacatherine/en-CA/home');
    const owner = readFileSync('app/portal/amanda-catherine/owner/[section]/page.tsx', 'utf8');
    expect(owner).toContain("riman: 'https://riman.com/amandacatherine/en-CA/home'");
  });

  test('Amanda-branded returning learner login renders', async ({ page }) => {
    await page.goto(base + '/portal/login?next=%2Fportal%2Famanda-catherine%2Flearning', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('AesthetiKine Academy').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Amanda Catherine Courses & Learning/i })).toBeVisible();
  });

  test('expired test learners see upgrade CTA without a login loop', async ({ page }) => {
    await page.goto(base + '/portal/amanda-catherine/expired?courseId=aesthetikine-reset-training', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Your \$1 test access has expired/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Upgrade to full course access/i })).toBeVisible();
    expect(page.url()).not.toContain('/portal/login');
  });
});
