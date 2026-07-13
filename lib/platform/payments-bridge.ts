/**
 * Payments contract bridge ? commerce offers ? entitlements + checkout metadata.
 */
import {
  COMMERCE_OFFERS,
  getCommerceOffer,
  listCommerceOffers,
  listEntitlementSnapshots,
  offerDisplayForCheckout,
  resolveCapabilityEntitlements,
  resolveModuleEntitlements,
  toEntitlementSnapshot,
  validateOffersIntegrity,
  type CommerceOffer,
  type CommerceOfferId,
  type CommerceOfferKind,
  type EntitlementSnapshot,
  type PortalConfig,
} from '@ea/payments-contract';
import type { ModuleId } from '@/lib/modules/registry';

export {
  COMMERCE_OFFERS,
  getCommerceOffer,
  listCommerceOffers,
  listEntitlementSnapshots,
  offerDisplayForCheckout,
  resolveCapabilityEntitlements,
  toEntitlementSnapshot,
  validateOffersIntegrity,
};
export type { CommerceOffer, CommerceOfferId, CommerceOfferKind, EntitlementSnapshot };

/** Resolved offer for checkout / webhook (contract-backed). */
export type ResolvedCheckoutOffer = {
  id: CommerceOfferId;
  kind: CommerceOfferKind;
  name: string;
  displayName: string;
  description: string;
  priceCents: number;
  stripePriceEnvKey: string;
  allowInlineStripePrice: boolean;
  airtablePackageName: string;
  moduleIds: string[];
  capabilityIds: string[];
  portalConfig?: PortalConfig;
  fulfillmentType?: string;
  fulfillmentLabel?: string;
  reviewRequired: boolean;
  intakePath?: string;
  interval?: 'month' | 'year';
  trialDays?: number;
};

export function resolveCheckoutOffer(id: string): ResolvedCheckoutOffer | null {
  const offer = getCommerceOffer(id);
  if (!offer) return null;
  return {
    id: offer.id,
    kind: offer.kind,
    name: offer.name,
    displayName: offer.displayName,
    description: offer.description,
    priceCents: offer.priceCents,
    stripePriceEnvKey: offer.stripePriceEnvKey,
    allowInlineStripePrice: offer.allowInlineStripePrice ?? false,
    airtablePackageName: offer.airtablePackageName,
    moduleIds: [...offer.moduleIds],
    capabilityIds: resolveCapabilityEntitlements(offer.id),
    portalConfig: offer.portalConfig,
    fulfillmentType: offer.fulfillmentType,
    fulfillmentLabel: offer.fulfillmentLabel,
    reviewRequired: offer.reviewRequired ?? false,
    intakePath: offer.intakePath,
    interval: offer.interval,
    trialDays: offer.trialDays,
  };
}

export function isCheckoutOfferPurchasable(offer: ResolvedCheckoutOffer): boolean {
  if (offer.allowInlineStripePrice && offer.priceCents > 0) return true;
  const priceId = process.env[offer.stripePriceEnvKey];
  return offer.priceCents > 0 && Boolean(priceId);
}

export function listPurchasableCheckoutOffers(kind?: CommerceOfferKind): ResolvedCheckoutOffer[] {
  return listCommerceOffers(kind)
    .map((o) => resolveCheckoutOffer(o.id)!)
    .filter((o) => isCheckoutOfferPurchasable(o));
}

/** Stripe session metadata fields sourced from the payments contract. */
export function buildCommerceCheckoutMetadata(
  offer: ResolvedCheckoutOffer,
  extra: Record<string, string> = {},
): Record<string, string> {
  const base: Record<string, string> = {
    commerceOfferId: offer.id,
    commerceOfferKind: offer.kind,
    packageName: offer.airtablePackageName,
    packageDisplayName: offer.displayName,
  };

  if (offer.kind === 'one_time') {
    base.packageId = offer.id;
  } else {
    base.planId = offer.id;
    base.checkoutType = 'subscription';
    if (offer.interval) base.interval = offer.interval;
  }

  if (offer.fulfillmentType) base.fulfillmentType = offer.fulfillmentType;
  if (offer.fulfillmentLabel) base.fulfillmentLabel = offer.fulfillmentLabel;
  if (offer.intakePath) base.intakePath = offer.intakePath;
  base.reviewRequired = String(offer.reviewRequired);
  base.moduleCount = String(offer.moduleIds.length);
  base.capabilityCount = String(offer.capabilityIds.length);

  return { ...base, ...extra };
}

/** Resolve portal ModuleId[] from offer id or Airtable Package Purchased name. */
export function resolvePortalModuleEntitlements(
  offerIdOrAirtablePackage: string,
  options?: { isDemo?: boolean },
): ModuleId[] {
  return resolveModuleEntitlements(offerIdOrAirtablePackage, options) as ModuleId[];
}

export function packageIncludesConnect(packagePurchased: string): boolean {
  return resolvePortalModuleEntitlements(packagePurchased).includes('connect');
}

export function packageIncludesBilling(packagePurchased: string): boolean {
  return resolvePortalModuleEntitlements(packagePurchased).includes('billing');
}

export function getPaymentsContractHealth() {
  const integrity = validateOffersIntegrity();
  return {
    ...integrity,
    snapshots: listEntitlementSnapshots().map((s) => ({
      offerId: s.offerId,
      kind: s.kind,
      airtablePackageName: s.airtablePackageName,
      moduleCount: s.moduleIds.length,
      capabilityCount: s.capabilityIds.length,
      includesBilling: s.includesBilling,
      includesConnect: s.includesConnect,
    })),
  };
}
