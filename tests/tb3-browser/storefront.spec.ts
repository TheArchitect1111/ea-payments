import { test, expect } from '@playwright/test';
test('TB3 storefront cart can add and remove items while checkout remains disabled', async ({page}) => {
  await page.route('**/api/tb3/merch/checkout', route =>
    route.fulfill({status:200,contentType:'application/json',body:'{"available":false}'}));
  await page.goto('/tarris#merch', {waitUntil:'domcontentloaded'});
  await expect(page.locator('[data-product-id]')).toHaveCount(14);
  const first = page.locator('[data-product-id]').first();
  await expect(first.getByRole('combobox',{name:'Size'})).toBeVisible();
  await first.getByRole('button',{name:'Add to Cart'}).click();
  await expect(page.getByRole('heading',{name:'Your cart (1)'})).toBeVisible();
  await expect(page.getByText(/Online checkout is being connected/)).toBeVisible();
  await page.getByRole('button',{name:/Remove TB3/}).first().click();
  await expect(page.getByRole('heading',{name:'Your cart (0)'})).toBeVisible();
});
test('TB3 Instagram product link works on mobile with no real checkout', async ({page}) => {
  await page.setViewportSize({width:375,height:812});
  await page.route('**/api/tb3/merch/checkout', route =>
    route.fulfill({status:200,contentType:'application/json',body:'{"available":false}'}));
  await page.goto('/tarris#merch-tb3-signature-tee-black',{waitUntil:'domcontentloaded'});
  await expect(page.locator('[data-product-id]')).toHaveCount(14);
  const card=page.locator('#merch-tb3-signature-tee-black');
  await expect(card).toBeVisible();
  await expect(card.getByText('TB3 Signature Tee - Black')).toBeVisible();
  await expect(card.getByRole('link',{name:/Direct shopping link/}))
    .toHaveAttribute('href','/tarris#merch-tb3-signature-tee-black');
});
