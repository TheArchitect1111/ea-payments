/** Generic price socket. Values are provided by each client's offer configuration. */
export interface PriceContract { amountCad: number; contractId: string }
export interface ClientPriceCatalog { readonly clientId: string; price(offerId: string): PriceContract }
export type NonPaymentPriceContract = { currency: 'CAD'; amount: 0; note: 'included with portal' };

export function assertPriceContract(value: any): any {
  if (!value) throw new Error('Invalid price contract: missing');
  // Non-payment bricks (auth, lms, catalog, menu, jane, amazon, preview, production-gate, chassis-cert, launch-certification)
  if (value.currency === 'CAD' && value.amount === 0 && value.note === 'included with portal') {
    return value as NonPaymentPriceContract;
  }
  // Paying bricks (billing, checkout, welcome, email, entitlement)
  if (Number.isFinite(value.amountCad) && value.amountCad >= 0 && typeof value.contractId === 'string' && value.contractId.trim()) {
    return value as PriceContract;
  }
  throw new Error('Invalid price contract: ' + JSON.stringify(value));
}
