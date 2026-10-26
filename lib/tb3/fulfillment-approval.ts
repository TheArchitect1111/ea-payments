/** TB3 fulfillment approval is intentionally pure so sandbox tests run the
 * exact gate used by the real Stripe webhook. No network or charging here. */
export type FulfillmentApproval = {
  isProduction: boolean;
  ownerApproved: boolean;
  fundingVerified: boolean;
  capCents: number;
  cost: string | number | null | undefined;
  currency: string | undefined;
  merchandiseSubtotalCents: number;
};
export function canConfirmTb3PrintfulOrder(x: FulfillmentApproval): boolean {
  if (!x.isProduction || !x.ownerApproved || !x.fundingVerified) return false;
  if (!Number.isSafeInteger(x.capCents) || x.capCents <= 0) return false;
  if (x.currency?.toUpperCase() !== 'USD' || x.cost == null ||
      typeof x.cost !== 'string' && typeof x.cost !== 'number') return false;
  const raw = typeof x.cost === 'number' ? String(x.cost) : x.cost;
  // Reject exponent notation, negatives and fractions of a cent.
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(raw)) return false;
  const [dollars, fraction = ''] = raw.split('.');
  const costCents = Number(dollars) * 100 + Number(fraction.padEnd(2,'0'));
  return Number.isSafeInteger(costCents) && costCents > 0 &&
    costCents <= x.capCents && costCents < x.merchandiseSubtotalCents;
}
