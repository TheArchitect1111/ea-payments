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
  | 'landing_page'
  | 'client_portal'
  | 'connect_profile'
  | 'capacity_assessment'
  | 'capacity_blueprint'
  | 'implementation_starter'
  | 'implementation_professional'
  | 'implementation_premium'
  | 'implementation_enterprise'
  | 'simplifi_early_access'
  | 'launch_verification';

export type FulfillmentType =
  | 'landing-page'
  | 'client-portal'
  | 'connect-profile'
  | 'assessment'
  | 'blueprint'
  | 'implementation'
  | 'simplifi'
  | 'launch-verification';

export interface CatalogItem {
  id: PackageId;
  name: string;
  displayName: string;
  description: string;
  stripePriceEnvKey: string;
  airtablePackageName: 'Capacity Assessment' | 'Capacity Blueprint' | 'Implementation Package' | 'Simplifi' | 'Launch Verification';
  priceCents: number;
  allowInlineStripePrice?: boolean;
  portalConfig?: PortalConfig;
  portalLoginUrl?: string;
  fulfillmentType: FulfillmentType;
  fulfillmentLabel: string;
  reviewRequired?: boolean;
  intakePath?: string;
}

export const CATALOG: CatalogItem[] = [
  {
    id: 'launch_verification',
    name: 'EA Launch Verification',
    displayName: 'EA Launch Verification',
    description:
      'One-time $1 payment to verify the complete production checkout, Airtable, email, and webhook workflow before live customers.',
    stripePriceEnvKey: 'STRIPE_PRICE_LAUNCH_VERIFICATION',
    airtablePackageName: 'Launch Verification',
    priceCents: 100,
    allowInlineStripePrice: true,
    fulfillmentType: 'launch-verification',
    fulfillmentLabel: 'Verify checkout, Airtable, email, webhook, and portal access.',
  },
  {
    id: 'connect_profile',
    name: 'EA Connect Profile',
    displayName: 'EA Connect Profile',
    description:
      'A focused profile that helps people understand who you serve, what you offer, why they can trust you, and what to do next.',
    stripePriceEnvKey: 'STRIPE_PRICE_CONNECT_PROFILE',
    airtablePackageName: 'Implementation Package',
    priceCents: 49700,
    allowInlineStripePrice: true,
    portalConfig: { platform: 'efficiency-architects', loginPath: '/portal/login' },
    fulfillmentType: 'connect-profile',
    fulfillmentLabel: 'Create a guided Connect profile with trust builders, offer clarity, and one primary next action.',
    reviewRequired: true,
    intakePath: '/discover',
  },
  {
    id: 'landing_page',
    name: 'EA Landing Page',
    displayName: 'EA Landing Page',
    description:
      'A premium landing page that clarifies the offer, audience, proof, and one primary action so people know exactly what is possible.',
    stripePriceEnvKey: 'STRIPE_PRICE_LANDING_PAGE',
    airtablePackageName: 'Implementation Package',
    priceCents: 149700,
    allowInlineStripePrice: true,
    portalConfig: { platform: 'efficiency-architects', loginPath: '/portal/login' },
    fulfillmentType: 'landing-page',
    fulfillmentLabel: 'Build a conversion-ready landing page with offer clarity, trust sections, and a review gate before launch.',
    reviewRequired: true,
    intakePath: '/discover',
  },
  {
    id: 'client_portal',
    name: 'EA Client Portal',
    displayName: 'EA Client Portal',
    description:
      'A focused client portal with resources, communication, updates, training, and guided next steps shaped around the people you serve.',
    stripePriceEnvKey: 'STRIPE_PRICE_CLIENT_PORTAL',
    airtablePackageName: 'Implementation Package',
    priceCents: 299700,
    allowInlineStripePrice: true,
    portalConfig: { platform: 'efficiency-architects', loginPath: '/portal/login' },
    fulfillmentType: 'client-portal',
    fulfillmentLabel: 'Provision a client portal foundation with resources, updates, training signals, and guided review before launch.',
    reviewRequired: true,
    intakePath: '/discover',
  },
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
    fulfillmentType: 'simplifi',
    fulfillmentLabel: 'Provision Simplifi access and client portal entry.',
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
    fulfillmentType: 'assessment',
    fulfillmentLabel: 'Schedule and complete capacity assessment.',
    reviewRequired: true,
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
    fulfillmentType: 'blueprint',
    fulfillmentLabel: 'Build and review capacity blueprint.',
    reviewRequired: true,
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
    fulfillmentType: 'implementation',
    fulfillmentLabel: 'Scope and deliver starter implementation.',
    reviewRequired: true,
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
    fulfillmentType: 'implementation',
    fulfillmentLabel: 'Scope and deliver professional implementation.',
    reviewRequired: true,
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
    fulfillmentType: 'implementation',
    fulfillmentLabel: 'Scope and deliver premium implementation.',
    reviewRequired: true,
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
    fulfillmentType: 'implementation',
    fulfillmentLabel: 'Scope and deliver enterprise implementation.',
    reviewRequired: true,
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
