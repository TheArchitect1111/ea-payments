export type FactoryOpportunity = {
  id: string;
  label: string;
  href: string;
};

export const FACTORY_OPPORTUNITIES: FactoryOpportunity[] = [
  { id: 'new-client', label: 'A new client', href: '/admin/factory/capacity-discovery' },
  { id: 'nonprofit', label: 'A nonprofit', href: '/admin/factory/capacity-discovery' },
  { id: 'sports-organization', label: 'A sports organization', href: '/admin/factory/capacity-discovery' },
  { id: 'school', label: 'A school', href: '/admin/factory/capacity-discovery' },
  { id: 'conference', label: 'A conference', href: '/admin/factory/registration' },
  { id: 'fundraiser', label: 'A fundraiser', href: '/admin/factory/campaign' },
  { id: 'business-transformation', label: 'A business transformation', href: '/admin/factory/operational-mri' },
  { id: 'marketing-campaign', label: 'A marketing campaign', href: '/admin/factory/campaign' },
  { id: 'training-program', label: 'A training program', href: '/admin/factory/training-portal' },
  { id: 'other', label: 'Something else', href: '/admin/factory?stage=Understand' },
];

const IDS = new Set(FACTORY_OPPORTUNITIES.map((item) => item.id));

export function normalizeFactoryOpportunity(value: string | undefined | null) {
  const trimmed = value?.trim() ?? '';
  return IDS.has(trimmed) ? trimmed : undefined;
}

export function factoryOpportunityLabel(id: string | undefined | null) {
  return FACTORY_OPPORTUNITIES.find((item) => item.id === id)?.label;
}

export function withFactoryOpportunity(href: string, opportunity: string | undefined | null) {
  const normalized = normalizeFactoryOpportunity(opportunity);
  if (!normalized) return href;

  const [path, query = ''] = href.split('?');
  const params = new URLSearchParams(query);
  params.set('opportunity', normalized);
  const serialized = params.toString();
  return serialized ? `${path}?${serialized}` : path;
}
