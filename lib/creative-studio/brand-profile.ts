import type { BrandProfile } from './types';

const DEFAULT_BRAND: Omit<BrandProfile, 'organizationId'> = {
  organizationName: 'Efficiency Architects',
  primaryColor: '#1B2B4D',
  secondaryColor: '#C9A844',
  typography: 'Inter, system-ui, sans-serif',
  photographyStyle: 'Warm, authentic, people-first',
  voice: 'Clear, confident, mission-first. Celebrate people. Remove friction.',
  missionStatement: 'Every mission deserves to be communicated clearly.',
  audience: 'Leaders, coaches, and organizations doing meaningful work',
  preferredHeadlines: ['Every mission deserves to be heard.', 'Create once. Publish everywhere.'],
  preferredCta: 'Learn more',
};

export function getDefaultBrandProfile(organizationId?: string): BrandProfile {
  const id = organizationId ?? 'ea';
  if (id !== 'ea') {
    return {
      ...DEFAULT_BRAND,
      organizationId: id,
      organizationName: id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    };
  }
  return { ...DEFAULT_BRAND, organizationId: id };
}
