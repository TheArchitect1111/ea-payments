/**
 * Website Engine contracts - assemble marketing pages from reusable sections.
 * Unifies landing-chassis (config sections) and experience-builder (Puck blocks).
 */

export const WEBSITE_SECTION_KINDS = [
  'hero',
  'content',
  'testimonials',
  'gallery',
  'faq',
  'cta',
  'forms',
  'footer',
  'seo',
  'analytics',
  'brand',
  'nav',
  'stats',
  'features',
  'process',
  'team',
  'pricing',
  'timeline',
  'events',
  'media',
  'other',
] as const;

export type WebsiteSectionKind = (typeof WEBSITE_SECTION_KINDS)[number];

export type WebsiteSourceSystem = 'landing-chassis' | 'experience-builder' | 'shared';

export type WebsiteSectionDefinition = {
  id: string;
  kind: WebsiteSectionKind;
  name: string;
  description: string;
  source: WebsiteSourceSystem;
  /** landing-chassis LandingPageConfig key, when applicable */
  landingKey?: string;
  /** experience-builder / Puck block type id, when applicable */
  blockId?: string;
  category?: string;
  reusable: boolean;
  aiPurpose?: string;
};

export type WebsitePageSectionInstance = {
  sectionId: string;
  kind: WebsiteSectionKind;
  order: number;
  enabled: boolean;
  config?: Record<string, unknown>;
};

/**
 * Client editing policy for a website page.
 * `full-page` is the EA chassis standard. It gives authenticated tenant
 * owners/admins control of every section on their own page plus page-level
 * navigation, brand, SEO and structural controls.
 */
export type WebsiteEditMode = 'full-page';

export type WebsiteEditPolicy = {
  mode: WebsiteEditMode;
  editableSectionIds: 'all';
  allowSectionCreate: true;
  allowSectionDelete: true;
  allowSectionReorder: true;
  allowSectionToggle: true;
  allowPageSettings: true;
  allowNavigation: true;
  allowBrand: true;
  allowSeo: true;
  allowedRoles: Array<'client-owner' | 'client-admin' | 'ea-admin'>;
};

export type WebsitePageManifest = {
  id: string;
  name: string;
  themeId?: string;
  organizationId?: string;
  sections: WebsitePageSectionInstance[];
  /**
   * Optional for backward compatibility. When omitted, Website Engine resolves
   * the chassis-wide full-page client editing policy automatically.
   */
  editPolicy?: WebsiteEditPolicy;
  seo?: {
    title?: string;
    description?: string;
    ogImage?: string;
  };
};

export type WebsiteAssembly = {
  page: WebsitePageManifest;
  resolved: Array<{
    instance: WebsitePageSectionInstance;
    definition?: WebsiteSectionDefinition;
  }>;
  missingSectionIds: string[];
  editPolicy: WebsiteEditPolicy;
  editableSectionIds: string[];
};