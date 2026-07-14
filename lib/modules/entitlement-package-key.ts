/**
 * Prefer commerce offer id over coarse Airtable Package Purchased so
 * Website + Portal Starter (and other offers sharing Implementation Package)
 * resolve lean module sets instead of the package-family fallback.
 */
export function resolveEntitlementPackageKey(input: {
  commerceOfferId?: string | null;
  packagePurchased?: string | null;
}): string {
  const offerId = input.commerceOfferId?.trim();
  if (offerId) return offerId;
  const pkg = input.packagePurchased?.trim();
  if (pkg) return pkg;
  return 'Capacity Assessment';
}
