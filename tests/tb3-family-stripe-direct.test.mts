import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const api=readFileSync('app/api/tb3/family-stripe-setup/route.ts','utf8');
const page=readFileSync('app/admin/tb3-family-stripe/page.tsx','utf8');
const ui=readFileSync('app/admin/tb3-family-stripe/client.tsx','utf8');
const returnPage=readFileSync('app/tarris/stripe-setup-complete/page.tsx','utf8');
test('family setup requires real EA admin authorization and same origin',()=>{
  assert.match(api,/parseAdminSession/);
  assert.match(api,/admin\.email === 'admin'/);
  assert.match(api,/Origin mismatch/);
  assert.match(api,/VERCEL_ENV !== 'preview'/);
  assert.match(page,/parseAdminSession/);
  assert.match(page,/notFound\(\)/);
});
test('Bouie family receives Stripe-hosted link without TB3 portal login',()=>{
  assert.match(api,/startStripeOnboarding/);
  assert.match(api,/tenantId: 'tarris'/);
  assert.match(api,/familyEmail/);
  assert.match(api,/ea_merchant|stripeMerchantStore/);
  assert.match(ui,/connect\.stripe\.com/);
  assert.doesNotMatch(ui,/\/portal\/login/);
});
test('Stripe return page does not claim connected status or expose payouts',()=>{
  assert.match(returnPage,/administrator must verify/);
  assert.doesNotMatch(returnPage,/stripe_account_id|accountId/);
});
