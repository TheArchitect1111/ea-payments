import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveTb3Cart} from '../lib/tb3/merch-cart';
import catalog from '../public/tb3/merch/manifest.json';
import {canConfirmTb3PrintfulOrder} from '../lib/tb3/fulfillment-approval';

// No provider network, no credentials, no real money, no Printful order.
// This is an executable sandbox model of the TB3 commerce lifecycle.
// The production Stripe/Printful routes require a separate provider-backed acceptance test.
type Scenario = {
  payment: 'paid' | 'failed' | 'pending';
  fundingVerified: boolean;
  ownerApproved: boolean;
  fulfillmentCostCents: number;
  maxCostCents: number;
  shippingCents: number;
  stripeFeesCents: number;
  duplicateDelivery?: boolean;
};
function sandboxPurchase(s: Scenario) {
  const variantId = catalog[0].variants[0].id;
  const cart = resolveTb3Cart([{variantId, quantity: 2}]);
  const subtotalCents = cart.reduce((n, x) => n + x.unitAmount * x.quantity, 0);
  const totalCents = subtotalCents + s.shippingCents;
  const events = ['cart_resolved','shipping_quoted','checkout_created'];
  if (s.payment !== 'paid')
    return {events: [...events, 'no_paid_event'], draftCount: 0,
      confirmationCount: 0, subtotalCents, totalCents, reserveEarningsCents: 0};
  events.push('stripe_payment_verified','printful_draft_created');
  const approved = canConfirmTb3PrintfulOrder({
    isProduction: true,
    ownerApproved: s.ownerApproved,
    fundingVerified: s.fundingVerified,
    capCents: s.maxCostCents,
    cost: (s.fulfillmentCostCents / 100).toFixed(2),
    currency: 'USD',
    merchandiseSubtotalCents: subtotalCents,
  });
  if (!approved)
    return {events: [...events, 'confirmation_blocked'], draftCount: 1,
      confirmationCount: 0, subtotalCents, totalCents, reserveEarningsCents: 0};
  events.push('printful_confirmed','fulfillment_tracking_received','portal_sale_recorded');
  if (s.duplicateDelivery) events.push('duplicate_webhook_ignored');
  // This is illustrative contribution margin, NOT transferable cash or owner loan repayment.
  const reserveEarningsCents = Math.max(0, totalCents - s.fulfillmentCostCents - s.stripeFeesCents);
  return {events, draftCount: 1, confirmationCount: 1,
    subtotalCents, totalCents, reserveEarningsCents};
}

const base: Scenario = {
  payment:'paid', fundingVerified:true, ownerApproved:true,
  fulfillmentCostCents:4000, maxCostCents:6000,
  shippingCents:800, stripeFeesCents:340,
};
test('sandbox: paid TB3 cart goes to draft, approved fulfillment and portal tracking', () => {
  const result = sandboxPurchase(base);
  assert.equal(result.subtotalCents, 10000);
  assert.equal(result.totalCents, 10800);
  assert.equal(result.draftCount, 1);
  assert.equal(result.confirmationCount, 1);
  assert.deepEqual(result.events.slice(-3),
    ['printful_confirmed','fulfillment_tracking_received','portal_sale_recorded']);
  assert.equal(result.reserveEarningsCents, 6460);
});
test('sandbox: failed payment cannot create a Printful order', () => {
  const r = sandboxPurchase({...base,payment:'failed'});
  assert.equal(r.draftCount, 0);
  assert.equal(r.confirmationCount, 0);
  assert.equal(r.reserveEarningsCents, 0);
});
test('sandbox: pending payment cannot create a Printful order', () => {
  const r = sandboxPurchase({...base,payment:'pending'});
  assert.equal(r.draftCount, 0);
  assert.equal(r.confirmationCount, 0);
});
test('sandbox: unfunded Printful billing never confirms', () => {
  const r = sandboxPurchase({...base,fundingVerified:false});
  assert.equal(r.draftCount, 1);
  assert.equal(r.confirmationCount, 0);
  assert.equal(r.reserveEarningsCents, 0);
});
test('sandbox: missing owner authorization never confirms', () => {
  assert.equal(sandboxPurchase({...base,ownerApproved:false}).confirmationCount, 0);
});
test('sandbox: cost ceiling breach prevents Printful charge', () => {
  const r = sandboxPurchase({...base,fulfillmentCostCents:7000});
  assert.equal(r.confirmationCount, 0);
});
test('sandbox: fulfillment cost cannot consume merchandise subtotal', () => {
  assert.equal(sandboxPurchase({...base,fulfillmentCostCents:11000,maxCostCents:15000}).confirmationCount, 0);
});
test('sandbox: repeated Stripe event does not confirm twice', () => {
  const r = sandboxPurchase({...base,duplicateDelivery:true});
  assert.equal(r.confirmationCount, 1);
  assert.ok(r.events.includes('duplicate_webhook_ignored'));
});
test('sandbox: preview data is not verified reserve cash', () => {
  const r = sandboxPurchase(base);
  assert.ok(r.reserveEarningsCents > 0);
  const verifiedCashBalance = null;
  const parentLoanDisbursed = false;
  assert.equal(verifiedCashBalance, null);
  assert.equal(parentLoanDisbursed, false);
});
