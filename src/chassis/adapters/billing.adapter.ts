import { sourceAdapter } from './sourceAdapter';
import type { PriceContract } from '../priceContract';
import type { BrickHealth } from '../BrickInterface';

/** Price values belong to the client, never to the chassis. Values are in cents. */
export function createBillingAdapter(prices: Record<string, number>) {
  const offers = Object.entries(prices);
  const [offerId, cents] = offers[0] ?? [];
  const valid = Boolean(offerId) && Number.isSafeInteger(cents) && cents > 0;
  const price = (): PriceContract => ({
    amountCad: valid ? cents / 100 : 0,
    contractId: valid ? offerId : 'unconfigured-client',
  });
  const health = async (): Promise<BrickHealth> => ({
    status: valid ? 200 : 503,
    evidence: valid
      ? 'Client-injected billing price contract present; no provider transaction verified'
      : 'Client billing price contract missing or invalid',
  });
  return sourceAdapter({ id: 'billing', files: [], price, verify: health });
}
export const billingAdapter = createBillingAdapter({});
