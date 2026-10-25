import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');
const checkout = read('app/api/tb3/merch/checkout/route.ts');
const store = read('app/tarris/merch-store.tsx');
const existingDeposit = read('app/api/checkout/tarris-bouie/route.ts');

test('TB3 checkout is isolated from EA payments and fail-closed', () => {
  assert.match(checkout, /TB3_STRIPE_SECRET_KEY/);
  assert.match(checkout, /TB3_STRIPE_WEBHOOK_SECRET/);
  assert.match(checkout, /TB3_MERCH_FULFILLMENT_LEDGER_READY/);
  assert.doesNotMatch(checkout, /process\.env\.STRIPE_SECRET_KEY/);
  assert.match(checkout, /if \(!enabled\(\)\)/);
});

test('TB3 checkout re-resolves the server-side catalog and Printful shipping', () => {
  assert.match(checkout, /resolveTb3Cart\(input\.cart\)/);
  assert.match(checkout, /tb3Printful<ShippingRate\[]>\('\/shipping\/rates'/);
  assert.match(checkout, /automatic_tax: \{enabled: true\}/);
  assert.match(checkout, /stripe\.customers\.create/);
});

test('TB3 store sends only cart, email, and recipient to a dedicated route', () => {
  assert.match(store, /fetch\('\/api\/tb3\/merch\/checkout'/);
  assert.match(store, /JSON\.stringify\(\{cart, email, recipient\}\)/);
  assert.match(store, /checkoutAvailable/);
});

test('EA agreement deposit remains separate from merchandise', () => {
  assert.match(existingDeposit, /Tarris Bouie Project Deposit/);
  assert.match(existingDeposit, /unit_amount: 50000/);
});

const webhook = read('app/api/webhooks/stripe-tb3-merch/route.ts');
test('TB3 webhook verifies signature and paid status independently', () => {
  assert.match(webhook, /constructEvent\(/);
  assert.match(webhook, /payment_status !== 'paid'/);
  assert.match(webhook, /stripe\.checkout\.sessions\.retrieve/);
  assert.match(webhook, /TB3_STRIPE_WEBHOOK_SECRET/);
  assert.doesNotMatch(webhook, /getStripe\(/);
});
test('Printful drafts use stable unique identity and are never auto-confirmed', () => {
  assert.match(webhook, /createHash\('sha256'\)/);
  assert.match(webhook, /\/orders\?confirm=false/);
  assert.match(webhook, /sync_variant_id/);
  assert.match(webhook, /order\.external_id !== id/);
  assert.doesNotMatch(webhook, /\/orders\/.*\/confirm/);
});
