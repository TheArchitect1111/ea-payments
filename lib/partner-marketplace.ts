import type { PartnerRecord } from './airtable';

export type MarketplaceCategory =
  | 'Referral Program'
  | 'Satellite Hub'
  | 'Implementation'
  | 'Assessment'
  | 'Partner Service';

export type MarketplaceTier = 'Starter' | 'Professional' | 'Enterprise' | 'Satellite';

export interface MarketplaceListing {
  id: string;
  title: string;
  category: MarketplaceCategory;
  tier: MarketplaceTier;
  description: string;
  products: string[];
  commission?: string;
  partner?: string;
  href: string;
  live: boolean;
  tags: string[];
}

export const MARKETPLACE_LISTINGS: MarketplaceListing[] = [
  {
    id: 'referral-standard',
    title: 'EA Partner Referral Program',
    category: 'Referral Program',
    tier: 'Professional',
    description:
      'Refer clients to Operational MRI, Capacity Blueprint, or Implementation packages. Earn commission on closed deals.',
    products: ['Simplifi', 'Mission Control'],
    commission: '20% default (configurable via DEFAULT_COMMISSION_PERCENTAGE)',
    href: '/admin/commissions',
    live: true,
    tags: ['referral', 'commission', 'partner'],
  },
  {
    id: 'hub-cpr',
    title: 'Canadian Prospects Recruitment (CPR)',
    category: 'Satellite Hub',
    tier: 'Satellite',
    description: 'Athlete development, camps, showcases, and recruiting exposure platform.',
    products: ['Amplifi', 'CPR', 'Magnifi'],
    partner: 'CPR Operations',
    href: 'https://cpr-site.vercel.app',
    live: true,
    tags: ['athlete', 'sports', 'recruiting'],
  },
  {
    id: 'hub-brotherhub',
    title: 'BrotherHub',
    category: 'Satellite Hub',
    tier: 'Satellite',
    description: 'Fraternity chapter coordination, membership, and community engagement.',
    products: ['Community Hub', 'BrotherHub', 'Update Hub'],
    href: 'https://brother-hub.vercel.app',
    live: true,
    tags: ['fraternity', 'community', 'chapter'],
  },
  {
    id: 'hub-sisterhub',
    title: 'SisterHub',
    category: 'Satellite Hub',
    tier: 'Satellite',
    description: 'Sorority chapter hub — engagement, communication, and legacy programs.',
    products: ['Community Hub', 'SisterHub', 'Update Hub'],
    href: 'https://sister-hub.vercel.app',
    live: true,
    tags: ['sorority', 'community', 'chapter'],
  },
  {
    id: 'mri-assessment',
    title: 'Operational MRI Assessment',
    category: 'Assessment',
    tier: 'Starter',
    description: 'Public funnel — capacity diagnostic that feeds proposals and Digital Twin signals.',
    products: ['Simplifi'],
    href: '/assessment',
    live: true,
    tags: ['assessment', 'mri', 'funnel'],
  },
  {
    id: 'impl-professional',
    title: 'Implementation Package — Professional',
    category: 'Implementation',
    tier: 'Professional',
    description: 'Full platform build with standard integrations and Mission Control onboarding.',
    products: ['Mission Control', 'Magnifi', 'Simplifi'],
    href: '/checkout?package=implementation_professional',
    live: true,
    tags: ['implementation', 'automation'],
  },
  {
    id: 'capture-engine',
    title: 'EA Capture Engine + Resource Radar',
    category: 'Partner Service',
    tier: 'Enterprise',
    description: 'Partners can deploy capture intelligence for portfolio companies and referral targets.',
    products: ['EA Capture Engine', 'Resource Radar', 'Knowledge Graph'],
    commission: 'Co-sell with EA team',
    href: '/admin/resource-radar',
    live: true,
    tags: ['capture', 'intelligence', 'radar'],
  },
  {
    id: 'partner-portal',
    title: 'Partner Portal',
    category: 'Partner Service',
    tier: 'Professional',
    description: 'External partner login for referral tracking and commission visibility.',
    products: ['Mission Control'],
    href: 'https://partner-portal.vercel.app',
    live: true,
    tags: ['portal', 'partner'],
  },
];

export function getMarketplaceListings(filters?: {
  category?: MarketplaceCategory;
  tag?: string;
  query?: string;
}): MarketplaceListing[] {
  let list = MARKETPLACE_LISTINGS.filter((l) => l.live);

  if (filters?.category) {
    list = list.filter((l) => l.category === filters.category);
  }

  if (filters?.tag) {
    const tag = filters.tag.toLowerCase();
    list = list.filter((l) => l.tags.some((t) => t.includes(tag)));
  }

  if (filters?.query) {
    const q = filters.query.toLowerCase();
    list = list.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.products.some((p) => p.toLowerCase().includes(q))
    );
  }

  return list;
}

export function enrichWithPartners(
  listings: MarketplaceListing[],
  partners: PartnerRecord[]
): MarketplaceListing[] {
  if (partners.length === 0) return listings;

  const partnerListings: MarketplaceListing[] = partners
    .filter((p) => p.status === 'Active')
    .slice(0, 10)
    .map((p) => ({
      id: `partner-${p.partnerName.toLowerCase().replace(/\s+/g, '-')}`,
      title: `${p.partnerName} — Referral Partner`,
      category: 'Referral Program' as const,
      tier: 'Professional' as const,
      description: `${p.referralCount} referrals · $${p.commissionOwed.toLocaleString()} commission owed · $${p.commissionPaid.toLocaleString()} paid.`,
      products: ['Simplifi', 'Mission Control'],
      commission: 'Per referral agreement',
      partner: p.partnerName,
      href: '/admin/commissions',
      live: true,
      tags: ['partner', 'referral', 'active'],
    }));

  return [...listings, ...partnerListings];
}

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  'Referral Program',
  'Satellite Hub',
  'Implementation',
  'Assessment',
  'Partner Service',
];
