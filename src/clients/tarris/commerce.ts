import type { ClientConfig } from '../../chassis/runClickTest';
import { createPaidCheckout, fulfillPaidAccess, paidAccessConfigured, TB3_PRICE_CENTS } from '@/lib/tb3/paid-access';

export const tarrisCommerce: NonNullable<ClientConfig['commerce']> = {
  async health() {
    return { status: paidAccessConfigured() ? 200 : 503, evidence: 'Live provider configuration check only; completed purchase and delivery require verification' };
  },
  async checkout(request) {
    if (request.type !== 'stripe-live' || !request.returnOrigin) throw Error('Live checkout requires a server-selected origin');
    return createPaidCheckout({ email: request.email, courseId: request.courseId, origin: request.returnOrigin, priceCents: TB3_PRICE_CENTS });
  },
  async welcome({ sessionId }) { return fulfillPaidAccess(sessionId, process.env.TB3_PUBLIC_ORIGIN || 'https://tb3.online'); },
};
