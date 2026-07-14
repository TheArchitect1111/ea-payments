// lib/catalog.ts
//
// One-time product catalog ? derived from @ea/payments-contract.
// Stripe Price IDs remain in env vars (stripePriceEnvKey).

import {
  listCommerceOffers,
  type AirtablePackageName,
  type FulfillmentType as ContractFulfillmentType,
  type PortalConfig as ContractPortalConfig,
  type PortalPlatform as ContractPortalPlatform,
} from '@ea/payments-contract';

export type PortalPlatform = ContractPortalPlatform;
export type PortalConfig = ContractPortalConfig;

export type PackageId =
  | 'landing_page'
  | 'client_portal'
  | 'website_portal_starter'
  | 'connect_profile'
  | 'capacity_assessment'
  | 'capacity_blueprint'
  | 'implementation_starter'
  | 'implementation_professional'
  | 'implementation_premium'
  | 'implementation_enterprise'
  | 'simplifi_early_access'
  | 'launch_verification';

export type FulfillmentType = ContractFulfillmentType;

export interface CatalogItem {
  id: PackageId;
  name: string;
  displayName: string;
  description: string;
  stripePriceEnvKey: string;
  airtablePackageName: AirtablePackageName;
  priceCents: number;
  allowInlineStripePrice?: boolean;
  portalConfig?: PortalConfig;
  portalLoginUrl?: string;
  fulfillmentType: FulfillmentType;
  fulfillmentLabel: string;
  reviewRequired?: boolean;
  intakePath?: string;
}

function toCatalogItem(
  offer: ReturnType<typeof listCommerceOffers>[number],
): CatalogItem | null {
  if (offer.kind !== 'one_time') return null;
  if (!offer.fulfillmentType || !offer.fulfillmentLabel) return null;
  return {
    id: offer.id as PackageId,
    name: offer.name,
    displayName: offer.displayName,
    description: offer.description,
    stripePriceEnvKey: offer.stripePriceEnvKey,
    airtablePackageName: offer.airtablePackageName,
    priceCents: offer.priceCents,
    allowInlineStripePrice: offer.allowInlineStripePrice,
    portalConfig: offer.portalConfig,
    fulfillmentType: offer.fulfillmentType,
    fulfillmentLabel: offer.fulfillmentLabel,
    reviewRequired: offer.reviewRequired,
    intakePath: offer.intakePath,
  };
}

export const CATALOG: CatalogItem[] = listCommerceOffers('one_time')
  .map(toCatalogItem)
  .filter((item): item is CatalogItem => Boolean(item));

export function getCatalogItem(id: string): CatalogItem | undefined {
  return CATALOG.find((item) => item.id === id);
}

export function getCatalogItemByPriceId(priceId: string): CatalogItem | undefined {
  return CATALOG.find((item) => process.env[item.stripePriceEnvKey] === priceId);
}

export function getEACatalog(): CatalogItem[] {
  return CATALOG.filter(
    (item) => item.portalConfig?.platform === 'efficiency-architects' || !item.portalConfig,
  );
}

/** True when checkout can create a Stripe session (inline price or configured Stripe Price ID). */
export function isCatalogItemPurchasable(item: CatalogItem): boolean {
  if (item.allowInlineStripePrice && item.priceCents > 0) return true;
  const priceId = process.env[item.stripePriceEnvKey];
  return item.priceCents > 0 && Boolean(priceId);
}

export function getPurchasableEACatalog(): CatalogItem[] {
  return getEACatalog().filter(isCatalogItemPurchasable);
}

export function formatPrice(priceCents: number): string {
  if (priceCents === 0) return 'Contact for pricing';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(priceCents / 100);
}
