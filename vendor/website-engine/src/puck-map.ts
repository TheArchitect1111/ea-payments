import type { WebsiteSectionDefinition, WebsiteSectionKind } from './types.js';

/** Minimal block registry row from ea-payments experience-builder. */
export type ExperienceBlockInput = {
  id: string;
  category: string;
  label: string;
  description: string;
  aiPurpose?: string;
};

const BLOCK_KIND_MAP: Record<string, WebsiteSectionKind> = {
  EAHero: 'hero',
  EACtaBand: 'cta',
  EAFeatures: 'features',
  EABenefits: 'features',
  EATestimonials: 'testimonials',
  EALogoCloud: 'brand',
  EAMetrics: 'stats',
  EAFAQ: 'faq',
  EAGallery: 'gallery',
  EAImage: 'media',
  EAVideo: 'media',
  EAHeading: 'content',
  EARichText: 'content',
  EATextSection: 'content',
  EASection: 'content',
  EAContainer: 'content',
  EASpacer: 'other',
  EADivider: 'other',
  EAColumns: 'content',
  EATeam: 'team',
  EAPricing: 'pricing',
  EATimeline: 'timeline',
  EAContact: 'forms',
  EALocationMap: 'other',
  EAHours: 'other',
  EARegistrationForm: 'forms',
  EAApplicationForm: 'forms',
  EADonationForm: 'forms',
  EAEventSchedule: 'events',
  EASponsorGrid: 'brand',
  EAUpdateFeed: 'content',
  EACountdownTimer: 'other',
};

export function kindForExperienceBlockId(blockId: string): WebsiteSectionKind {
  return BLOCK_KIND_MAP[blockId] ?? 'other';
}

export function adaptExperienceBlocks(
  blocks: ExperienceBlockInput[],
): WebsiteSectionDefinition[] {
  return blocks.map((b) => ({
    id: `eb.${b.id}`,
    kind: kindForExperienceBlockId(b.id),
    name: b.label,
    description: b.description,
    source: 'experience-builder' as const,
    blockId: b.id,
    category: b.category,
    reusable: true,
    aiPurpose: b.aiPurpose,
  }));
}

/** Static seed when live BLOCK_REGISTRY is unavailable (docs / offline). */
export const EXPERIENCE_BUILDER_SEED_SECTIONS: WebsiteSectionDefinition[] = adaptExperienceBlocks([
  { id: 'EAHero', category: 'marketing', label: 'Hero', description: 'Primary hero with CTA.' },
  { id: 'EACtaBand', category: 'marketing', label: 'CTA Band', description: 'Conversion band.' },
  { id: 'EAFeatures', category: 'marketing', label: 'Features', description: 'Feature grid.' },
  { id: 'EATestimonials', category: 'marketing', label: 'Testimonials', description: 'Social proof.' },
  { id: 'EAFAQ', category: 'marketing', label: 'FAQ', description: 'Frequently asked questions.' },
  { id: 'EAGallery', category: 'content', label: 'Gallery', description: 'Image gallery.' },
  { id: 'EAMetrics', category: 'marketing', label: 'Metrics', description: 'Stats / proof numbers.' },
  { id: 'EATeam', category: 'business', label: 'Team', description: 'Team members.' },
  { id: 'EAPricing', category: 'business', label: 'Pricing', description: 'Pricing cards.' },
  { id: 'EARegistrationForm', category: 'platform', label: 'Registration Form', description: 'Registration form block.' },
  { id: 'EAApplicationForm', category: 'platform', label: 'Application Form', description: 'Application form block.' },
]);
