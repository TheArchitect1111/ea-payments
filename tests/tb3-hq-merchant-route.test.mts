import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');

test('TB3 HQ serves a dedicated merchant setup page, not the EA reports surface', () => {
  const page = read('app/tarris/future/payment-setup/page.tsx');
  const hq = read('app/tarris/future/page.tsx');
  assert.match(hq, /href="\/tarris\/future\/payment-setup"/);
  assert.match(page, /MerchantPaymentSetup/);
  assert.match(page, /tenantSlug="tarris"/);
  assert.match(page, /\['owner', 'admin'\]/);
  assert.match(page, /session\.slug !== 'tarris'/);
  assert.match(page, /notFound\(\)/);
});

test('TB3 Stripe return and refresh routes lead to the private HQ', () => {
  const stripe = read('app/api/portal/[slug]/payments/stripe/route.ts');
  assert.equal((stripe.match(/slug === 'tarris' \? '\/tarris\/future\/payment-setup'/g) ?? []).length, 2);
  assert.match(stripe, /session\.slug !== slug/);
  assert.match(stripe, /\['owner','admin'\]/);
  assert.match(stripe, /Origin mismatch/);
  assert.match(stripe, /Merchant onboarding not configured/);
});

test('merchant connection never bypasses live readiness gates', () => {
  const status = read('app/api/tb3/merch/readiness/route.ts');
  assert.match(status, /VERCEL_ENV/);
  const setup = read('lib/bricks/merchant-onboarding/MerchantPaymentSetup.tsx');
  assert.match(setup, /Connect Stripe securely/);
  assert.match(setup, /connect\.stripe\.com/);
});
