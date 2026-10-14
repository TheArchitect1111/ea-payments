import { readFile } from 'node:fs/promises';
import type { Brick, CheckoutRequest, CheckoutResult } from '../BrickInterface';
import { sourceAdapter } from './sourceAdapter';

/** Contract-only checkout adapter. No provider request, payment, or entitlement mutation. */
function makeCheckout(opts: CheckoutRequest): CheckoutResult {
  if (!opts.courseId?.trim()) throw new Error('courseId required');
  if (opts.type !== 'stripe-test' && opts.type !== 'square-full') throw new Error('Unsupported checkout type');
  const courseId = opts.courseId.trim();
  const sessionId = 'cs_test_' + Date.now() + '_' + courseId;
  const entitlement = courseId + ':' + (opts.type === 'stripe-test' ? '72h:test' : 'lifetime:square-full');
  return { sessionId, entitlement };
}

const base = sourceAdapter({
  id: 'checkout',
  files: [
    { path: 'lib/amanda-catherine/payment-fulfillment.ts', contains: 'fulfillAmandaCheckout' },
    { path: 'app/api/amanda-catherine/square-checkout/route.ts', contains: 'SQUARE_ACCESS_TOKEN' },
    { path: 'app/api/webhooks/square-amanda/route.ts', contains: 'timingSafeEqual' },
  ],
  verify: async () => {
    const webhook = await readFile('app/api/webhooks/square-amanda/route.ts', 'utf8');
    if (!webhook.includes('createHmac') || !webhook.includes('verified(raw,')) {
      return { status: 503, evidence: 'Square webhook signature verification missing' };
    }
    for (const type of ['stripe-test', 'square-full'] as const) {
      const courseId = 'test-course';
      const result = makeCheckout({ type, courseId });
      const expectedEntitlement = type === 'stripe-test' ? courseId + ':72h:test' : courseId + ':lifetime:square-full';
      if (!result.sessionId.startsWith('cs_test_') || result.entitlement !== expectedEntitlement) {
        return { status: 503, evidence: type + ' checkout contract shape invalid' };
      }
    }
    return { status: 200, evidence: 'Stripe fulfillment and Square endpoint present; signed webhook validation found; cs_test_ contract outputs include courseId and 72h/test or lifetime/square-full. Synthetic contract test, no live charge.' };
  },
});

export const checkoutAdapter: Brick = {
  ...base,
  checkout: async (opts) => makeCheckout(opts),
};
