import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');

test('TB3 HQ serves a dedicated merchant setup page, not the EA reports surface', () => {
  const page = read('app/tarris/(payment-access)/future/payment-setup/page.tsx');
  const hq = read('app/tarris/future/page.tsx');
  assert.match(hq, /href="\/tarris\/future\/payment-setup"/);
  assert.match(page, /MerchantPaymentSetup/);
  assert.match(page, /tenantSlug="tarris"/);
  assert.doesNotMatch(page, /requireTb3MerchantSession/);
  assert.doesNotMatch(page, /notFound\(\)/);
});

test('TB3 Stripe return and refresh routes lead to the private HQ', () => {
  const stripe = read('app/api/portal/[slug]/payments/stripe/route.ts');
  assert.equal((stripe.match(/slug === 'tarris' \? '\/tarris\/future\/payment-setup'/g) ?? []).length, 2);
  assert.match(stripe, /slug === 'tarris'\) return requireTb3MerchantSession\(\)/);
  assert.match(stripe, /session\.slug !== slug/);
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

test('TB3 merchant onboarding requires active tenant membership and admin authority', () => {
  const access = read('lib/tb3/merchant-access.ts');
  assert.match(access, /requirePortalSession\(\{ realm: 'portal' \}\)/);
  assert.match(access, /hasTb3Identity\(session\)/);
  assert.match(access, /findMembership\(session\.email, TB3_ORGANIZATION_ID\)/);
  assert.match(access, /org\?\.status !== 'Active'/);
  assert.match(access, /member\?\.status !== 'active'/);
  assert.match(access, /normalizeRole\(member\.role\), 'admin'/);
  const page = read('app/tarris/(payment-access)/future/payment-setup/page.tsx');
  const api = read('app/api/portal/[slug]/payments/stripe/route.ts');
  assert.doesNotMatch(page, /requireTb3MerchantSession\(\)/);
  assert.match(api, /requireTb3MerchantSession\(\)/);
});

test('unauthenticated TB3 visitors reach the real portal login instead of a public-page loop', () => {
  const layout = read('app/tarris/future/layout.tsx');
  assert.match(layout, /redirect\('\/portal\/login\?next=%2Ftarris%2Ffuture'\)/);
  assert.doesNotMatch(layout, /redirect\('\/tarris\?hq=private'\)/);
});
