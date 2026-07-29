import { expect, test } from '@playwright/test';

const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1440, height: 900 },
  { name: 'desktop', width: 1920, height: 1080 },
] as const;

async function assertNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    return {
      docScrollWidth: doc.scrollWidth,
      docClientWidth: doc.clientWidth,
      bodyScrollWidth: body.scrollWidth,
      bodyClientWidth: body.clientWidth,
    };
  });
  expect(overflow.docScrollWidth).toBeLessThanOrEqual(overflow.docClientWidth + 1);
  expect(overflow.bodyScrollWidth).toBeLessThanOrEqual(overflow.bodyClientWidth + 1);
}

for (const vp of VIEWPORTS) {
  test(`quick-launch auth gate usable at ${vp.name} ${vp.width}x${vp.height}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/admin/ea-factory/quick-launch');
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByRole('heading', { name: /admin sign in/i })).toBeVisible();
    await assertNoHorizontalOverflow(page);
    // Login control must remain usable on phone
    const email = page.getByRole('textbox').first();
    await expect(email).toBeVisible();
    const box = await email.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      expect(box.width).toBeGreaterThan(120);
      expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 2);
    }
    expect(errors.filter((e) => !/favicon|third-party/i.test(e))).toEqual([]);
  });
}
