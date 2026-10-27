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
  await page.goto('/tarris?utm_source=instagram&utm_medium=social&utm_campaign=tb3_merch#merch-tb3-signature-tee-black',{waitUntil:'domcontentloaded'});
  await expect(page.locator('[data-product-id]')).toHaveCount(14);
  const card=page.locator('#merch-tb3-signature-tee-black');
  await expect(card).toBeVisible();
  await expect(card.getByText('TB3 Signature Tee - Black')).toBeVisible();
  await expect(card.getByRole('link',{name:/Direct shopping link/}))
    .toHaveAttribute('href','/tarris?utm_source=instagram&utm_medium=social&utm_campaign=tb3_merch#merch-tb3-signature-tee-black');
});

test('all 14 TB3 merch images load and product share links remain unique', async ({page}) => {
  await page.goto('/tarris#merch',{waitUntil:'domcontentloaded'});
  const cards=page.locator('[data-product-id]');
  await expect(cards).toHaveCount(14);
  const links=await cards.getByRole('link',{name:/Direct shopping link/}).evaluateAll(
    nodes=>nodes.map(n=>n.getAttribute('href')));
  expect(new Set(links).size).toBe(14);
  for (let i=0;i<14;i++) {
    const img=cards.nth(i).locator('img');
    expect((await img.getAttribute('src'))?.startsWith('/tb3/merch/mockups/')).toBe(true);
    await img.scrollIntoViewIfNeeded();
    await expect.poll(async()=>img.evaluate((el:HTMLImageElement)=>el.complete && el.naturalWidth>0))
      .toBe(true);
  }
});
test('checkout remains fail-closed in test environment even after a product is added', async ({page}) => {
  await page.goto('/tarris#merch',{waitUntil:'domcontentloaded'});
  await page.locator('[data-product-id]').first().getByRole('button',{name:'Add to Cart'}).click();
  await expect(page.getByRole('heading',{name:'Your cart (1)'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Secure checkout'})).toHaveCount(0);
  await expect(page.getByText(/Online checkout is being connected/)).toBeVisible();
});

test('Meta Instagram catalog remains unpublished until real seller and Printful clearance', async ({request}) => {
  const result = await request.get('/api/tb3/merch/meta-catalog');
  expect(result.status()).toBe(503);
  const body=await result.json();
  expect(body.error).toMatch(/not yet eligible for public sales/);
});
test('private Printful catalog audit cannot be read by anonymous visitors', async ({request}) => {
  const result=await request.get('/api/tb3/printful/catalog-audit');
  expect([401,403]).toContain(result.status());
});
