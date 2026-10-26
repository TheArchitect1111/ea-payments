import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');
const checkout = read('app/api/tb3/merch/checkout/route.ts');
const store = read('app/tarris/merch-store.tsx');
const existingDeposit = read('app/api/checkout/tarris-bouie/route.ts');

test('TB3 cannot collect customer payment while Printful funding is unverified', () => {
  assert.match(checkout, /TB3_MERCH_AUTO_FULFILLMENT_APPROVED === 'true'/);
  assert.match(checkout, /TB3_PRINTFUL_FUNDING_VERIFIED === 'true'/);
  assert.match(checkout, /Number\.isSafeInteger\(Number\(process\.env\.TB3_MERCH_MAX_PRINTFUL_COST_CENTS\)\)/);
});

test('TB3 checkout is isolated from EA payments and fail-closed', () => {
  assert.match(checkout, /EA_STRIPE_CONNECT_SECRET_KEY/);
  assert.match(checkout, /EA_STRIPE_CONNECT_WEBHOOK_SECRET/);
  assert.match(checkout, /getStripeMerchantStatus\('tarris', stripeMerchantStore\)/);
  assert.match(checkout, /stripeAccount: merchant.providerMerchantReference/);
  assert.doesNotMatch(checkout, /TB3_STRIPE_SECRET_KEY/);
  assert.match(checkout, /TB3_MERCH_DRAFT_FULFILLMENT_APPROVED/);
  assert.match(checkout, /process\.env\.VERCEL_ENV === 'production'/);
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
  assert.match(webhook, /EA_STRIPE_CONNECT_WEBHOOK_SECRET/);
  assert.match(webhook, /process\.env\.VERCEL_ENV !== 'production'/);
  assert.match(webhook, /event.account !== expected/);
  assert.match(webhook, /incoming.metadata.tenant_id !== 'tarris'/);
  assert.doesNotMatch(webhook, /TB3_STRIPE_WEBHOOK_SECRET/);
  assert.doesNotMatch(webhook, /getStripe\(/);
});
test('TB3 paid checkout must reconcile with trusted catalog before Printful draft', () => {
  assert.match(webhook, /expectedSubtotalCents/);
  assert.match(webhook, /session.amount_subtotal !== expectedSubtotalCents/);
  assert.match(webhook, /session.amount_total < expectedSubtotalCents/);
  assert.match(webhook, /TB3 Stripe payment does not match server catalog totals/);
});

test('Printful drafts use stable identity and confirm only when authorized and within cost ceiling', () => {
  assert.match(webhook, /createHash\('sha256'\)/);
  assert.match(webhook, /\/orders\?confirm=false/);
  assert.match(webhook, /sync_variant_id/);
  assert.match(webhook, /order\.external_id !== id/);
  assert.match(webhook, /TB3_MERCH_AUTO_FULFILLMENT_APPROVED/);
  assert.match(webhook, /TB3_PRINTFUL_FUNDING_VERIFIED/);
  assert.match(webhook, /TB3_MERCH_MAX_PRINTFUL_COST_CENTS/);
  assert.match(webhook, /costCents > cap/);
  assert.match(webhook, /costCents >= expectedSubtotalCents/);
  assert.match(webhook, /process.env.VERCEL_ENV === 'production'/);
  assert.match(webhook, /'\/orders\/' \+ order.id \+ '\/confirm'/);
});

const payments = read('app/api/tb3/merch/payments/route.ts');
const sales = read('app/portal/components/Tb3MerchSales.tsx');
test('TB3 Stripe report requires staff authorization and private credentials', () => {
  assert.match(payments, /authorize\(req, true\)/);
  assert.match(payments, /EA_STRIPE_CONNECT_SECRET_KEY/);
  assert.match(payments, /stripeMerchantStore.get\('tarris'\)/);
  assert.match(payments, /stripeAccount: accountId/);
  assert.doesNotMatch(payments, /TB3_STRIPE_SECRET_KEY/);
  assert.match(payments, /payment_status === 'paid'/);
  assert.match(payments, /metadata\?\.type === 'tb3_merch'/);
  assert.match(payments, /hasMore: response.has_more/);
  assert.doesNotMatch(payments, /process\.env\.STRIPE_SECRET_KEY/);
});
test('TB3 reserve plan does not invent loan deposits, profits or repayments', () => {
  assert.match(sales, /Fulfillment reserve/);
  assert.match(sales, /\$500\.00/);
  assert.match(sales, /Not yet recorded or verified/);
  assert.match(sales, /Not yet reconciled/);
  assert.match(sales, /does not automatically transfer or allocate money/);
});

test('Stripe fee reporting is tenant scoped and does not claim reserve cash', () => {
  assert.match(payments, /paymentIntents.retrieve/);
  assert.match(payments, /balance_transaction/);
  assert.match(payments, /stripeAccount: accountId/);
  assert.match(payments, /feeDetailsComplete: fullyReconciled/);
  assert.match(payments, /recentStripeNetCents/);
  assert.match(sales, /Reconciliation incomplete/);
});

test('Portal differentiates Printful fulfillment totals from verified gross', () => {
  assert.match(sales, /api\/tb3\/merch\/payments/);
  assert.match(sales, /Gross collected:/);
  assert.match(sales, /Retail totals and fulfillment costs alone do not establish settled revenue/);
});
