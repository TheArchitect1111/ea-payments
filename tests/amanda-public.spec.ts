import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const base = 'https://amandacatherine.ca';
test.describe('Amanda public production checks (no credentials and no payments)', () => {
  test('homepage removes retired content and keeps Clinical Fat Loss waitlist-only', async ({ page }) => {
    await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Clinical Fat Loss Injectables for Face & Body Contouring/i })).toBeVisible();
    if (process.env.AMANDA_VERIFY_DEPLOYED === 'true') await expect(page.getByRole('heading', { name: /A note from Amanda/i })).toBeVisible();
    await expect(page.getByText(/BODY SCULPT(?:™)? NATIONAL TRAINING TOUR|Non-Surgical Tummy Sculpt & Tighten/i)).toHaveCount(0);
    await expect(page.getByRole('link', { name: /^Apply$|^Foundry$|^Update Hub$|^Calendar$|^Eva$/i })).toHaveCount(0);
    if (process.env.AMANDA_VERIFY_DEPLOYED === 'true') await expect(page.locator('.ac-course-grid').getByRole('heading', { name: /Firm Foundation|The Entrepreneurial Artist/i })).toHaveCount(0);

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

  test('Clinical Fat Loss waitlist persists and confirms without a Gmail configuration error', async ({ request }) => {
    test.skip(process.env.AMANDA_VERIFY_DEPLOYED !== 'true', 'Write-once QA is enabled only for EA-gated production promotion.');
    const email = `amanda-qa-${process.env.GITHUB_RUN_ID || Date.now()}@example.invalid`;
    const response = await request.post(base + '/api/public/amanda/waitlist', {
      headers: { Origin: base, 'Content-Type': 'application/json' },
      data: { courseId: 'clinical-fat-loss-injectables', name: 'Amanda Automated QA', email,
        phone: '', message: 'Automated acceptance: no enrollment, no charge.' },
    });
    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.ok).toBe(true);
    expect(result.warning || '').toBe('');
  });

  test('expired test learners see upgrade CTA without a login loop', async ({ page }) => {
    test.skip(process.env.AMANDA_VERIFY_DEPLOYED !== 'true', 'Run only after EA-GATED production promotion; PR preview is protected and not yet the live site.');
    await page.goto(base + '/portal/amanda-catherine/expired?courseId=aesthetikine-reset-training', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Your \$1 test access has expired/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Upgrade to full course access/i })).toBeVisible();
    expect(page.url()).not.toContain('/portal/login');
  });
});
