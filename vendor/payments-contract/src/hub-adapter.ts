import { moduleIdsToCapabilityIds } from '@ea/capability-registry';
import { COMMERCE_OFFERS } from './offers';
import { getCommerceOffer } from './resolve';
import type { CommerceOffer, EntitlementSnapshot } from './types';

export function snapshotFromOffer(offer: CommerceOffer): EntitlementSnapshot {
  const capabilityIds = moduleIdsToCapabilityIds(offer.moduleIds);
  return {
    offerId: offer.id,
    kind: offer.kind,
    airtablePackageName: offer.airtablePackageName,
    displayName: offer.displayName,
    moduleIds: [...offer.moduleIds],
    capabilityIds,
    includesBilling: offer.moduleIds.includes('billing'),
    includesConnect: offer.moduleIds.includes('connect'),
  };
}

export function toEntitlementSnapshot(offerId: string): EntitlementSnapshot | null {
  const offer = getCommerceOffer(offerId);
  if (!offer) return null;
  return snapshotFromOffer(offer);
}

export function offerDisplayForCheckout(offerId: string) {
  const offer = getCommerceOffer(offerId);
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
    interval: offer.interval,
    trialDays: offer.trialDays,
    portalConfig: offer.portalConfig,
    fulfillmentType: offer.fulfillmentType,
    fulfillmentLabel: offer.fulfillmentLabel,
    reviewRequired: offer.reviewRequired,
    intakePath: offer.intakePath,
  };
}

export function listEntitlementSnapshots(): EntitlementSnapshot[] {
  return COMMERCE_OFFERS.map(snapshotFromOffer);
}
