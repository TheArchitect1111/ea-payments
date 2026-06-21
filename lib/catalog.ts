// lib/catalog.ts
//
// Product/package catalog for EA Payments.
// Stripe Price IDs are stored in env vars (stripePriceEnvKey). Once Stripe
// Products/Prices are created, set the corresponding env vars and redeploy.

export type PortalPlatform =
  | 'efficiency-architects'
  | 'cpr'
  | 'brotherhub'
  | 'sisterhub'
  | 'partner';

export interface PortalConfig {
  platform: PortalPlatform;
  loginPath: string;
}

export type PackageId =
  | 'capacity_assessment'
  | 'capacity_blueprint'
  | 'implementation_starter'
  | 'implementation_professional'
  | 'implementation_premium'
  | 'implementation_enterprise'
  | 'simplifi_early_access';

export interface CatalogItem {
  id: PackageId;
  name: string;
  displayName: string;
  description: string;
  stripePriceEnvKey: string;
  airtablePackageName: 'Capacity Assessment' | 'Capacity Blueprint' | 'Implementation Package' | 'Simplifi';
  priceCents: number;
  allowInlineStripePrice?: boolean;
  portalConfig?: PortalConfig;
  portalLoginUrl?: string;
}

export const CATALOG: CatalogItem[] = [
  {
    id: 'simplifi_early_access',
    name: 'Simplifi Early Access',
    displayName: 'Simplifi Early Access',
    description:
      'Personal Opportunity Intelligence for capturing, analyzing, and acting on opportunities before they disappear.',
    stripePriceEnvKey: 'STRIPE_PRICE_SIMPLIFI_EARLY_ACCESS',
    airtablePackageName: 'Simplifi',
    priceCents: 14900,
    allowInlineStripePrice: true,
    portalConfig: { platform: 'efficiency-architects', loginPath: '/portal/login' },
  },
  {
    id: 'capacity_assessment',
    name: 'Capacity Assessment',
    displayName: 'Capacity Assessment',
    description: 'Initial diagnostic to identify automation opportunities and bottlenecks.',
    stripePriceEnvKey: 'STRIPE_PRICE_CAPACITY_ASSESSMENT',
    airtablePackageName: 'Capacity Assessment',
    priceCents: 0,
    portalConfig: { platform: 'efficiency-architects', loginPath: '/portal/login' },
  },
  {
    id: 'capacity_blueprint',
    name: 'Capacity Blueprint',
    displayName: 'Capacity Blueprint',
    description: 'Detailed roadmap and implementation plan based on the assessment.',
    stripePriceEnvKey: 'STRIPE_PRICE_CAPACITY_BLUEPRINT',
    airtablePackageName: 'Capacity Blueprint',
    priceCents: 0,
    portalConfig: { platform: 'efficiency-architects', loginPath: '/portal/login' },
  },
  {
    id: 'implementation_starter',
    name: 'Implementation Package - Starter',
    displayName: 'Implementation Package - Starter',
    description: 'Entry-level build and automation setup.',
    stripePriceEnvKey: 'STRIPE_PRICE_IMPL_STARTER',
    airtablePackageName: 'Implementation Package',
    priceCents: 0,
    portalConfig: { platform: 'efficiency-architects', loginPath: '/portal/login' },
  },
  {
    id: 'implementation_professional',
    name: 'Implementation Package - Professional',
    displayName: 'Implementation Package - Professional',
    description: 'Full platform build with standard integrations.',
    stripePriceEnvKey: 'STRIPE_PRICE_IMPL_PROFESSIONAL',
    airtablePackageName: 'Implementation Package',
    priceCents: 0,
    portalConfig: { platform: 'efficiency-architects', loginPath: '/portal/login' },
  },
  {
    id: 'implementation_premium',
    name: 'Implementation Package - Premium',
    displayName: 'Implementation Package - Premium',
    description: 'Full platform build plus extended automation and reporting.',
    stripePriceEnvKey: 'STRIPE_PRICE_IMPL_PREMIUM',
    airtablePackageName: 'Implementation Package',
    priceCents: 0,
    portalConfig: { platform: 'efficiency-architects', loginPath: '/portal/login' },
  },
  {
    id: 'implementation_enterprise',
    name: 'Implementation Package - Enterprise',
    displayName: 'Implementation Package - Enterprise',
    description: 'Custom multi-platform build with full instance factory rollout.',
    stripePriceEnvKey: 'STRIPE_PRICE_IMPL_ENTERPRISE',
    airtablePackageName: 'Implementation Package',
    priceCents: 0,
    portalConfig: { platform: 'efficiency-architects', loginPath: '/portal/login' },
  },
];

export function getCatalogItem(id: string): CatalogItem | undefined {
  return CATALOG.find((item) => item.id === id);
}

export function getCatalogItemByPriceId(priceId: string): CatalogItem | undefined {
  return CATALOG.find((item) => process.env[item.stripePriceEnvKey] === priceId);
}

export function getEACatalog(): CatalogItem[] {
  return CATALOG.filter(
    (item) => item.portalConfig?.platform === 'efficiency-architects'
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
