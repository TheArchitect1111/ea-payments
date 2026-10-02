import type Stripe from 'stripe';
import { recordAmandaKitOrder } from '../lib/amanda-catherine/practitioner-kit-orders';
import { AMANDA_PRACTITIONER_KIT } from '../lib/amanda-catherine/practitioner-kit-catalog';
import assert from 'node:assert/strict';
import { amandaKitCheckout } from '../lib/amanda-catherine/kit-fulfillment';

async function main() {
  const originalRates = process.env.AMANDA_KIT_SHIPPING_RATE_IDS_JSON;
  const originalVercelEnv = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = 'preview';
  try {
    // Obsolete paid config must not charge shipping or require a Stripe rate lookup.
    for (const config of [undefined, '{invalid', JSON.stringify({ CA: 'shr_old_paid', US: 'shr_old_paid' })]) {
      if (config === undefined) delete process.env.AMANDA_KIT_SHIPPING_RATE_IDS_JSON;
      else process.env.AMANDA_KIT_SHIPPING_RATE_IDS_JSON = config;
      const pickup = await amandaKitCheckout({ kitFulfillment: 'pickup' });
      assert.equal(pickup.metadata.kitShippingCents, '0');
      assert.deepEqual(pickup.shippingOptions, []);
      const address = { line1: '1 Test St', city: 'Test', state: 'ON', postal_code: 'A1A1A1', country: 'ca' };
      for (const country of ['ca', 'US', 'GB']) {
        const result = await amandaKitCheckout({ kitFulfillment: 'ship', shippingAddress: { ...address, country } });
        assert.equal(result.metadata.kitShippingCents, '0');
        assert.equal(JSON.parse(result.metadata.kitShippingAddress).country, country.toUpperCase());
        assert.deepEqual(result.shippingOptions, []);
        assert.equal(result.metadata.kitShippingRateId, undefined);
      }
    }
    await assert.rejects(amandaKitCheckout({ kitFulfillment: 'ship' }), /complete shipping address/);
    await assert.rejects(amandaKitCheckout({ kitFulfillment: 'ship', shippingAddress: { line1: '1 Test St', city: 'Test', state: 'ON', postal_code: 'A1A1A1', country: 'Canada' } }), /two-letter country code/);
    await assert.rejects(amandaKitCheckout({}), /Choose Free Pickup/);
    // Real order validation, preview mode: do not write a synthetic order to production.
    for (const kitFulfillment of ['pickup', 'ship'] as const) {
      const kit = await amandaKitCheckout({ kitFulfillment, shippingAddress: { line1: '1 Test St', city: 'Test', state: 'ON', postal_code: 'A1A1A1', country: 'CA' } });
      const session = {
        id: 'cs_test_shipping_fixture', payment_status: 'paid', currency: 'cad',
        amount_total: AMANDA_PRACTITIONER_KIT.priceCad * 100,
        shipping_cost: { amount_total: 0 },
        metadata: { checkoutType: 'amanda-practitioner-kit', amandaKitId: AMANDA_PRACTITIONER_KIT.id, portalSlug: 'amanda-catherine', ...kit.metadata },
      } as unknown as Stripe.Checkout.Session;
      assert.deepEqual(await recordAmandaKitOrder(session), { ok: true, preview: true });
      assert.deepEqual(await recordAmandaKitOrder(session, 'body-sculpt-practitioner-certification'), { ok: true, preview: true });
      assert.equal((await recordAmandaKitOrder({ ...session, metadata: { ...session.metadata, kitShippingCents: '2500' } })).ok, false);
      assert.equal((await recordAmandaKitOrder({ ...session, payment_status: 'unpaid' })).ok, false);
      assert.equal((await recordAmandaKitOrder({ ...session, amount_total: AMANDA_PRACTITIONER_KIT.priceCad * 100 + 1 })).ok, false);
      assert.equal((await recordAmandaKitOrder({ ...session, metadata: { ...session.metadata, portalSlug: 'other-tenant' } })).ok, false);
      if (kitFulfillment === 'ship') assert.equal((await recordAmandaKitOrder({ ...session, metadata: { ...session.metadata, kitShippingAddress: '' } })).ok, false);
    }
    console.log('Amanda v2.1 free pickup/shipping, address capture and obsolete-paid-config rejection tests passed.');
  } finally {
    if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = originalVercelEnv;
    if (originalRates === undefined) delete process.env.AMANDA_KIT_SHIPPING_RATE_IDS_JSON;
    else process.env.AMANDA_KIT_SHIPPING_RATE_IDS_JSON = originalRates;
  }
}
void main();
