import {test,expect} from '@playwright/test';
import catalog from '../public/tb3/merch/manifest.json';
import type {Page} from '@playwright/test';

async function enter(page:Page) {
  await page.goto('/tarris',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'ENTER SITE'}).click();
  await expect(page.locator('#tarris-splash-intro')).toBeHidden();
}

test('public navigation and CTAs resolve on each device',async({page})=>{
  await enter(page);
  for(const section of ['home','athlete','story','brand','nil','community','media','merch','future']){
    const a=page.locator('nav[aria-label="Public navigation"] a[href="#'+section+'"]');
    await expect(a).toHaveCount(1);
    await expect(page.locator('#'+section)).toHaveCount(1);
  }
  await page.locator('nav[aria-label="Public navigation"] a[href="#merch"]').click();
  await expect(page).toHaveURL(/#merch$/);
  await expect(page.locator('#merch-store')).toBeVisible();
});
test('14 product prices, artwork and Coming Soon controls',async({page,request})=>{
  await enter(page);
  await expect(page.locator('#merch-store article[data-product-id]')).toHaveCount(14);
  for(const item of catalog){
    const card=page.locator('#merch-store article[data-product-id="'+item.id+'"]');
    await expect(card).toContainText(item.name);
    await expect(card).toContainText('$'+item.price.toFixed(2)+' USD');
    await expect(card.locator('[aria-label="Merchandise ordering coming soon"]')).toBeVisible();
    const artwork=await request.head(item.image);
    expect(artwork.status(),item.image).toBe(200);
    expect(artwork.headers()['content-type']).toMatch(/^image\//);
  }
  await expect(page.locator('#merch')).toContainText('COMING SOON');
  await expect(page.locator('#merch')).toContainText('Online checkout is not open yet');
  await expect(page.getByRole('button',{name:/buy now|secure checkout|pay now/i})).toHaveCount(0);
});
test('item-specific inquiry follows existing booking tracking contract',async({page})=>{
  const product=catalog[0];
  let received:any=null;
  await page.route('**/api/opportunities/create',async r=>{
    received=r.request().postDataJSON();
    await r.fulfill({status:201,contentType:'application/json',body:'{"ok":true,"result":{"id":"fixture"}}'});
  });
  await page.goto('/tarris/book?type=merch&product='+product.id);
  await expect(page.getByRole('heading',{name:'TB3 MERCHANDISE INQUIRY'})).toBeVisible();
  await expect(page.locator('textarea[name="message"]')).toHaveValue(new RegExp(product.name));
  await page.locator('input[name="name"]').fill('Phase Two Buyer');
  await page.locator('input[name="email"]').fill('buyer@example.org');
  await page.getByRole('button',{name:'Submit Inquiry →'}).click();
  await expect(page.getByRole('status')).toContainText('request was received');
  expect(received).toMatchObject({contact_name:'Phase Two Buyer',contact_email:'buyer@example.org',company_name:'Individual customer',type:'Other',budget_range:'$0-1k',date_requested:null});
  expect(received.message).toContain(product.name);
  expect(received.request_id).toMatch(/^[\da-f-]{36}$/i);
});
test('normal partnership booking submits independently',async({page})=>{
  let received:any=null;
  await page.route('**/api/opportunities/create',async r=>{
    received=r.request().postDataJSON();
    await r.fulfill({status:201,contentType:'application/json',body:'{"ok":true,"result":{"id":"fixture"}}'});
  });
  await page.goto('/tarris/book');
  await page.locator('input[name="name"]').fill('Coach Example');
  await page.locator('input[name="company"]').fill('Youth Education Group');
  await page.locator('input[name="email"]').fill('coach@example.org');
  await page.locator('select[name="type"]').selectOption('Camp/Clinic');
  await page.locator('textarea[name="vision"]').fill('Education and community for young athletes.');
  await page.getByRole('button',{name:'Submit Inquiry →'}).click();
  await expect(page.getByRole('status')).toContainText('request was received');
  expect(received).toMatchObject({company_name:'Youth Education Group',type:'Camp/Clinic',contact_email:'coach@example.org'});
});
test('blank inquiry does not call backend',async({page})=>{
  let calls=0;
  await page.route('**/api/opportunities/create',async r=>{calls++;await r.fulfill({status:201,body:'{"ok":true}'});});
  await page.goto('/tarris/book?type=merch');
  await page.getByRole('button',{name:'Submit Inquiry →'}).click();
  expect(calls).toBe(0);
  await expect(page.locator('input[name="name"]')).toHaveAttribute('required','');
});
test('approved 3-asset film gallery supports playback and closing',async({page,request})=>{
  await enter(page);
  await expect(page.locator('#tb3-film article')).toHaveCount(3);
  await expect(page.getByRole('button',{name:/DUNK|JUMBOTRON/})).toHaveCount(0);
  for(const path of ['/videos/tb3-film/TB3-FILM-003-DRIVE-FINISH-HD.mp4','/videos/tb3-film/TB3-FILM-004-DEFENSE-BATTLE-HD.mp4','/videos/tb3-film/TB3-FILM-005-SCOREBOARD-PROOF.jpg']){
    expect((await request.head(path)).status(),path).toBe(200);
  }
  await page.getByRole('button',{name:'Play FILM 01 - DRIVE'}).click();
  await expect(page.getByRole('dialog',{name:'FILM 01 - DRIVE'})).toBeVisible();
  await page.getByRole('button',{name:'Close film'}).click();
  await expect(page.getByRole('dialog',{name:'FILM 01 - DRIVE'})).toHaveCount(0);
  await page.getByRole('button',{name:'View SCOREBOARD PROOF - 18/8/3/1'}).click();
  await expect(page.getByRole('dialog',{name:'SCOREBOARD PROOF - 18/8/3/1'})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('signed-out HQ redirects to login with return URL',async({page})=>{
  await page.goto('/tarris/future');
  await expect(page).toHaveURL(/\/portal\/login\?next=%2Ftarris%2Ffuture/);
  await enter(page);
  await page.getByRole('link',{name:/ENTER TB3 HQ/}).first().click();
  await expect(page).toHaveURL(/\/portal\/login\?next=%2Ftarris%2Ffuture/);
});
test('anonymous private tracking and payment routes fail closed',async({request})=>{
  expect([401,403]).toContain((await request.get('/api/tarris/workspace')).status());
  expect((await request.get('/api/tb3/merch/checkout')).status()).toBe(404);
});
test('HQ tracking panels and all 14 products render in isolated local UI fixture',async({page,context})=>{
  // This tests UI only, not real owner authentication or actual database writes.
  await context.addCookies([{name:'_vercel_jwt',value:'local-ui-fixture',url:'http://127.0.0.1:3219'}]);
  await page.route('**/api/calendar/events',r=>r.fulfill({contentType:'application/json',body:'{"ok":true,"events":[]}'}));
  await page.route('**/api/opportunities/list',r=>r.fulfill({contentType:'application/json',body:'{"ok":true,"opportunities":[]}'}));
  await page.route('**/api/tarris/workspace',r=>r.fulfill({contentType:'application/json',body:'{"ok":true,"logs":[],"impact":[],"documents":[],"contacts":[],"academic":[],"notifications":[]}'}));
  await page.route('**/api/tb3/paypal/report',r=>r.fulfill({contentType:'application/json',headers:{'Cache-Control':'private, no-store'},body:JSON.stringify({source:'paypal-ledger+printful',summary:{orderCount:1,capturedOrderCount:1,grossCapturedCents:5500,refundedCents:0,netAfterRefundsCents:5500,reconciliation:'ledger totals reconciled'},orders:[{orderReference:'PAYPAL-FIXTURE',paymentStatus:'captured',capturedCents:5500,refundStatus:'none',refundedCents:0,fulfillmentStatus:'shipped',tracking:[{status:'shipped',trackingNumber:'TRACK-FIXTURE',trackingUrl:'https://carrier.example/fixture'}],items:[{name:'TB3 Tee',size:'M',quantity:1,unitAmountCents:5000}],createdAt:'2026-11-09T12:00:00.000Z'}]})}));
  await page.goto('/tarris/future',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#hq-home')).toBeVisible();
  await expect(page.locator('#nil-brand-module')).toHaveCount(1);
  await expect(page.locator('#earnings-tracker')).toHaveCount(1);
  await expect(page.locator('#tb3-store article')).toHaveCount(14);
  await expect(page.locator('#tb3-store')).toContainText('Online checkout stays disabled');
  await page.getByRole('button',{name:'Merchandise orders'}).click();
  await expect(page.locator('#tb3-store')).toContainText('PAYPAL-FIXTURE');
  await expect(page.locator('#tb3-store')).toContainText('TRACK-FIXTURE');
  await expect(page.locator('#recent-media')).toContainText('Drive and Defense');
});
test('no horizontal page overflow',async({page})=>{
  await enter(page);
  const widths=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
  expect(widths.document-widths.viewport,'Horizontal overflow').toBeLessThanOrEqual(2);
});
