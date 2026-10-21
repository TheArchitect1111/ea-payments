import { moduleIdsToCapabilityIds } from '@ea/capability-registry';
import { COMMERCE_OFFERS } from './offers';
import { AIRTABLE_PACKAGE_MODULES, DEMO_MODULE_IDS } from './presets';
import type {
  AirtablePackageName,
  CommerceOffer,
  CommerceOfferId,
  CommerceOfferKind,
} from './types';

const BY_ID = new Map(COMMERCE_OFFERS.map((o) => [o.id, o]));

export function listCommerceOffers(kind?: CommerceOfferKind): CommerceOffer[] {
  if (!kind) return [...COMMERCE_OFFERS];
  return COMMERCE_OFFERS.filter((o) => o.kind === kind);
}

export function getCommerceOffer(id: string): CommerceOffer | undefined {
  return BY_ID.get(id as CommerceOfferId);
}

export function resolveModuleEntitlements(
  offerIdOrAirtablePackage: string,
  options?: { isDemo?: boolean },
): string[] {
  const offer = getCommerceOffer(offerIdOrAirtablePackage);
  if (offer) {
    const ids = new Set(offer.moduleIds);
    if (options?.isDemo) DEMO_MODULE_IDS.forEach((id) => ids.add(id));
    return [...ids];
  }

  const fromAirtable = AIRTABLE_PACKAGE_MODULES[offerIdOrAirtablePackage];
  if (fromAirtable) {
    const ids = new Set<string>([...fromAirtable]);
    if (options?.isDemo) DEMO_MODULE_IDS.forEach((id) => ids.add(id));
    // Launch Verification stays narrow (matches legacy special-case)
    if (offerIdOrAirtablePackage === 'Launch Verification') {
      return [...AIRTABLE_PACKAGE_MODULES['Launch Verification']];
    }
    return [...ids];
  }

  return [];
}

export function resolveCapabilityEntitlements(
  offerIdOrAirtablePackage: string,
  options?: { isDemo?: boolean },
): string[] {
  return moduleIdsToCapabilityIds(
    resolveModuleEntitlements(offerIdOrAirtablePackage, options),
  );
}

export function resolveAirtablePackageName(
  offerId: string,
): AirtablePackageName | undefined {
  return getCommerceOffer(offerId)?.airtablePackageName;
}

export function listOffersByAirtablePackage(
  airtablePackageName: AirtablePackageName,
): CommerceOffer[] {
  return COMMERCE_OFFERS.filter((o) => o.airtablePackageName === airtablePackageName);
}
