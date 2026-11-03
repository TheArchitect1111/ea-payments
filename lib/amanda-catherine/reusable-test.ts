import type Stripe from 'stripe';
export const WOOD_TEST_FLOW = 'wood-therapy-reusable-test-v1';
export const WOOD_TEST_COURSE = 'wood-therapy-certification';
export function requireTestKey(key = process.env.STRIPE_SECRET_KEY) {
  if (!key?.startsWith('sk_test_')) throw new Error('Test checkout blocked: STRIPE_SECRET_KEY is not a test key. Will not use live key.');
  return key;
}
/** Only use on sessions retrieved from Stripe or a signed webhook. */
export function isVerifiedWoodTest(session: Stripe.Checkout.Session) {
  if (session.metadata?.enrollmentFlow !== WOOD_TEST_FLOW) return false;
  if (session.livemode !== false || !session.id.startsWith('cs_test_') || session.mode !== 'payment' ||
      session.payment_status !== 'paid' || session.amount_total !== 100 || session.currency !== 'cad' ||
      session.metadata.portalSlug !== 'amanda-catherine' || session.metadata.amandaOfferId !== WOOD_TEST_COURSE ||
      session.metadata.amandaCourseId !== WOOD_TEST_COURSE || session.metadata.paymentOption !== 'test' ||
      session.metadata.privateTestCheckout !== 'true') throw new Error('A verified CAD $1 Wood Therapy TEST payment is required.');
  return true;
}
export function woodTestOrigin(origin: string) {
  const url = new URL(origin);
  if (url.protocol !== 'https:' || !(url.hostname === 'amandacatherine.ca' ||
      /^ea-payments-[a-z0-9-]+\.vercel\.app$/.test(url.hostname))) throw new Error('Invalid test return address.');
  return url.origin;
}
