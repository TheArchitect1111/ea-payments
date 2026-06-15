export type ProductLine = 'EA' | 'NSP' | 'BrotherHub' | 'SisterHub' | 'CPR' | 'EventHub';
export type PortalRole = 'client' | 'partner' | 'athlete' | 'parent' | 'attendee';
export type PackageCategory = 'assessment' | 'blueprint' | 'implementation';
export type ImplementationTier = 'starter' | 'standard' | 'premier';

export interface CatalogItem {
  id: string;
  productLine: ProductLine;
  name: string;
  displayName: string;
  description: string;
  priceCents: number;
  stripePriceEnvKey: string;
  airtablePackageName: 'Capacity Assessment' | 'Capacity Blueprint' | 'Implementation Package';
  portalRole: PortalRole;
  category: PackageCategory;
  tier?: ImplementationTier;
}

export const CATALOG: CatalogItem[] = [
  {
    id: 'ea-capacity-assessment',
    productLine: 'EA',
    name: 'Capacity Assessment',
    displayName: 'Capacity Assessment',
    description:
      'A diagnostic evaluation of your organization\'s operational capacity, constraints, and growth readiness. Delivered as a structured report with key findings and prioritized recommendations.',
    priceCents: 0,
    stripePriceEnvKey: 'STRIPE_PRICE_CAPACITY_ASSESSMENT',
    airtablePackageName: 'Capacity Assessment',
    portalRole: 'client',
    category: 'assessment',
  },
  {
    id: 'ea-capacity-blueprint',
    productLine: 'EA',
    name: 'Capacity Blueprint',
    displayName: 'Capacity Blueprint',
    description:
      'A tailored operational roadmap built from your assessment findings. Includes prioritized implementation milestones, resource allocation guidance, and measurable outcome targets.',
    priceCents: 0,
    stripePriceEnvKey: 'STRIPE_PRICE_CAPACITY_BLUEPRINT',
    airtablePackageName: 'Capacity Blueprint',
    portalRole: 'client',
    category: 'blueprint',
  },
  {
    id: 'ea-implementation-starter',
    productLine: 'EA',
    name: 'Implementation Package (Starter)',
    displayName: 'Implementation Package - Starter',
    description:
      'Hands-on implementation support for organizations beginning their operational transformation. Includes structured onboarding, milestone tracking, and monthly check-ins.',
    priceCents: 0,
    stripePriceEnvKey: 'STRIPE_PRICE_IMPLEMENTATION_STARTER',
    airtablePackageName: 'Implementation Package',
    portalRole: 'client',
    category: 'implementation',
    tier: 'starter',
  },
  {
    id: 'ea-implementation-standard',
    productLine: 'EA',
    name: 'Implementation Package (Standard)',
    displayName: 'Implementation Package - Standard',
    description:
      'Full-scope implementation support with dedicated advisor access, bi-weekly strategy sessions, and hands-on process redesign throughout.',
    priceCents: 0,
    stripePriceEnvKey: 'STRIPE_PRICE_IMPLEMENTATION_STANDARD',
    airtablePackageName: 'Implementation Package',
    portalRole: 'client',
    category: 'implementation',
    tier: 'standard',
  },
  {
    id: 'ea-implementation-premier',
    productLine: 'EA',
    name: 'Implementation Package (Premier)',
    displayName: 'Implementation Package - Premier',
    description:
      'High-touch implementation with priority advisor access, weekly sessions, custom toolkits, and ongoing operational review for 12 months.',
    priceCents: 0,
    stripePriceEnvKey: 'STRIPE_PRICE_IMPLEMENTATION_PREMIER',
    airtablePackageName: 'Implementation Package',
    portalRole: 'client',
    category: 'implementation',
    tier: 'premier',
  },
];

export function getCatalogItem(id: string): CatalogItem | undefined {
  return CATALOG.find((item) => item.id === id);
}

export function getEACatalog(): CatalogItem[] {
  return CATALOG.filter((item) => item.productLine === 'EA');
}

export function formatPrice(priceCents: number): string {
  if (priceCents === 0) return 'Contact for pricing';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(priceCents / 100);
}
