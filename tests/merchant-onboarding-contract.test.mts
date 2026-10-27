import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  merchantCanTakePayments, selectMerchantConnection, canOfferCustomerMethod, SUPPORTED_METHODS,
  type MerchantConnection,
} from '../lib/bricks/merchant-onboarding/contract';

const ready: MerchantConnection = {
  tenantId: 'tarris', provider: 'paypal', status: 'ready',
  providerMerchantReference: 'provider-owned-merchant-id',
  verifiedAt: '2026-10-25T00:00:00Z',
  chargesEnabled: true, payoutsEnabled: true,
};

test('allows only verified same-tenant payout-ready provider', () => {
  assert.equal(merchantCanTakePayments(ready, 'tarris'), true);
  assert.equal(merchantCanTakePayments(ready, 'amanda'), false);
  assert.equal(merchantCanTakePayments({...ready, payoutsEnabled: false}, 'tarris'), false);
  assert.equal(merchantCanTakePayments({...ready, chargesEnabled: false}, 'tarris'), false);
  assert.equal(merchantCanTakePayments({...ready, status: 'pending_provider'}, 'tarris'), false);
  assert.equal(merchantCanTakePayments({...ready, verifiedAt: null}, 'tarris'), false);
  assert.equal(merchantCanTakePayments(null, 'tarris'), false);
});

test('tenant and provider selection never falls back to another account', () => {
  assert.equal(selectMerchantConnection([ready], 'amanda', 'paypal'), null);
  assert.equal(selectMerchantConnection([ready], 'tarris', 'stripe'), null);
  assert.deepEqual(selectMerchantConnection([ready], 'tarris', 'paypal'), ready);
});

test('customer payment methods require provider capability verification', () => {
  assert.deepEqual(SUPPORTED_METHODS.paypal, ['card','paypal_wallet','venmo']);
  assert.deepEqual(SUPPORTED_METHODS.stripe, ['card','cash_app_pay','ach_bank']);
  assert.equal(canOfferCustomerMethod(ready, 'tarris', 'venmo', ['venmo']), true);
  assert.equal(canOfferCustomerMethod(ready, 'tarris', 'venmo', []), false);
  assert.equal(canOfferCustomerMethod(ready, 'amanda', 'venmo', ['venmo']), false);
  assert.equal(canOfferCustomerMethod(ready, 'tarris', 'cash_app_pay', ['cash_app_pay']), false);
  assert.equal(canOfferCustomerMethod({...ready, status: 'pending_provider'}, 'tarris', 'venmo', ['venmo']), false);
});
