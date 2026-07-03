import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const catalog = readFileSync(join(root, 'lib/catalog.ts'), 'utf8');
const checkout = readFileSync(join(root, 'app/api/checkout/route.ts'), 'utf8');
const webhook = readFileSync(join(root, 'app/api/webhooks/stripe/route.ts'), 'utf8');
const makeWebhooks = readFileSync(join(root, 'lib/make-webhooks.ts'), 'utf8');

for (const id of ['landing_page', 'client_portal', 'connect_profile']) {
  assert.match(catalog, new RegExp(`id: '${id}'`), `${id} should be in the catalog`);
}

for (const key of ['STRIPE_PRICE_LANDING_PAGE', 'STRIPE_PRICE_CLIENT_PORTAL', 'STRIPE_PRICE_CONNECT_PROFILE']) {
  assert.match(catalog, new RegExp(key), `${key} should be available as an override`);
}

assert.match(catalog, /allowInlineStripePrice: true/, 'Productized packages should be purchasable without Stripe Price IDs');
assert.match(checkout, /fulfillmentMetadata/, 'Checkout should pass fulfillment metadata into Stripe');
assert.match(webhook, /buildPackageFulfillmentPlan/, 'Webhook should resolve fulfillment plan');
assert.match(webhook, /fulfillment\.reviewRequired/, 'Webhook should queue review-gated fulfillment');
assert.match(makeWebhooks, /fulfillmentType/, 'Onboarding webhook should include fulfillment metadata');
assert.equal(existsSync(join(root, 'app/api/health/package-fulfillment/route.ts')), true, 'Package fulfillment health route should exist');

console.log('Productized package automation checks passed.');
