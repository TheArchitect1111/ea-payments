/** Source of truth for Amanda pricing. Existing storefront mappings must be migrated before certification. */
export const PRICE_CONTRACT = Object.freeze({ id: 'ea-amanda-cad-2026-10-14-v1', currency: 'CAD' as const, offers: Object.freeze({ 'strategy-call': 249 }) });
export function contractPrice(courseId: string): { amountCad: number; contractId: string } {
  const amountCad = (PRICE_CONTRACT.offers as Record<string, number>)[courseId];
  if (!Number.isSafeInteger(amountCad) || amountCad <= 0) throw new Error('Missing price contract for ' + courseId);
  return { amountCad, contractId: PRICE_CONTRACT.id };
}
