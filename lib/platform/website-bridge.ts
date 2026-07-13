/**
 * Bridge landing-chassis (+ experience-builder blocks) into @ea/website-engine.
 * Assembles marketing pages from the same PlatformClientConfig that drives portals.
 */
import {
  createDefaultWebsiteRegistry,
  assembleWebsitePage,
  landingChassisPageTemplate,
  listLandingChassisSections,
  type WebsiteAssembly,
  type WebsitePageManifest,
  type WebsitePageSectionInstance,
  type WebsiteSectionDefinition,
  type WebsiteSectionRegistry,
} from '@ea/website-engine';
import {
  getWorkspacePersonality,
  normalizeWorkspacePersonality,
} from '@ea/personality-engine';
import {
  getWorkspaceTheme,
  normalizeWorkspaceTheme,
  workspaceThemeToCssVars,
} from '@ea/theme-engine';
import {
  getPlatformClientConfig,
  type PlatformClientConfig,
  type PlatformClientLandingConfig,
} from './client-configs';

type ExperienceBlockMeta = {
  id: string;
  category: string;
  label: string;
  description: string;
  aiPurpose?: string;
};

let cachedRegistry: WebsiteSectionRegistry | undefined;

/**
 * Experience-builder BLOCK_REGISTRY is optional so this PR works without the full block tree.
 * When present on disk, blocks join the unified website section registry.
 */
function loadExperienceBuilderBlocks(): ExperienceBlockMeta[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@/lib/experience-builder/blocks/registry') as {
      BLOCK_REGISTRY?: Array<{
        id: string;
        category: string;
        label: string;
        description: string;
        aiPurpose?: string;
      }>;
    };
    return (mod.BLOCK_REGISTRY ?? []).map((b) => ({
      id: b.id,
      category: b.category,
      label: b.label,
      description: b.description,
      aiPurpose: b.aiPurpose,
    }));
  } catch {
    return [];
  }
}

export function getWebsiteSectionRegistry(): WebsiteSectionRegistry {
  if (cachedRegistry) return cachedRegistry;
  cachedRegistry = createDefaultWebsiteRegistry(
    loadExperienceBuilderBlocks().map((b) => ({
      id: b.id,
      category: b.category,
      label: b.label,
      description: b.description,
      aiPurpose: b.aiPurpose,
    })),
  );
  return cachedRegistry;
}

export function resetWebsiteSectionRegistry(): void {
  cachedRegistry = undefined;
}

export function listUnifiedWebsiteSections(): WebsiteSectionDefinition[] {
  return getWebsiteSectionRegistry().list();
}

export function listWebsiteSectionsBySource(source: WebsiteSectionDefinition['source']) {
  return getWebsiteSectionRegistry().listBySource(source);
}

export function assembleLandingTemplate(input: {
  id: string;
  name: string;
  organizationId?: string;
  themeId?: string;
}): WebsiteAssembly {
  const page = landingChassisPageTemplate(input);
  return assembleWebsitePage(page, getWebsiteSectionRegistry());
}

export function assembleCustomWebsitePage(page: WebsitePageManifest): WebsiteAssembly {
  return assembleWebsitePage(page, getWebsiteSectionRegistry());
}

/** Default chassis order including brand + nav (template omits them). */
const CLIENT_LANDING_SECTION_IDS = [
  'landing.brand',
  'landing.nav',
  'landing.possibility',
  'landing.socialProof',
  'landing.challenge',
  'landing.difference',
  'landing.process',
  'landing.portal',
  'landing.results',
  'landing.founder',
  'landing.finalCta',
  'landing.footer',
] as const;

function kindForSectionId(sectionId: string): WebsitePageSectionInstance['kind'] {
  if (sectionId.includes('brand')) return 'brand';
  if (sectionId.includes('nav')) return 'nav';
  if (sectionId.includes('possibility')) return 'hero';
  if (sectionId.includes('socialProof')) return 'testimonials';
  if (sectionId.includes('finalCta')) return 'cta';
  if (sectionId.includes('footer')) return 'footer';
  if (sectionId.includes('results')) return 'stats';
  if (sectionId.includes('process')) return 'process';
  if (sectionId.includes('founder')) return 'team';
  if (sectionId.includes('difference') || sectionId.includes('portal')) return 'features';
  return 'content';
}

export function buildClientLandingManifest(
  client: PlatformClientConfig,
  landing: PlatformClientLandingConfig = {},
): WebsitePageManifest {
  const disabled = new Set(landing.disabledSectionIds ?? client.landing?.disabledSectionIds ?? []);
  const pageId = landing.pageId ?? client.landing?.pageId ?? `${client.id}-home`;

  return {
    id: pageId,
    name: `${client.name} Home`,
    organizationId: client.organizationId,
    themeId: client.themeId,
    seo: {
      title: landing.seoTitle ?? client.landing?.seoTitle ?? `${client.name} | ${client.workspaceName}`,
      description:
        landing.seoDescription ??
        client.landing?.seoDescription ??
        client.terminology.startPrompt ??
        `${client.name} — ${client.workspaceName}`,
    },
    sections: CLIENT_LANDING_SECTION_IDS.map((sectionId, order) => ({
      sectionId,
      kind: kindForSectionId(sectionId),
      order,
      enabled: !disabled.has(sectionId),
    })),
  };
}

export type LandingPreviewCopy = {
  brandName: string;
  workspaceName: string;
  heroHeadline: string;
  heroLede: string;
  ctaLabel: string;
  membersLabel: string;
  startPrompt: string;
  seoTitle: string;
  seoDescription: string;
};

export type AssembledClientWebsite = {
  clientId: string;
  clientName: string;
  themeId: string;
  personalityId: string;
  personalityName: string;
  cssVars: Record<string, string>;
  theme: {
    id: string;
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    surfaceColor: string;
    textColor: string;
    mutedTextColor: string;
    borderColor: string;
    fontHeading: string;
    fontBody: string;
  };
  terminology: Record<string, string>;
  copy: LandingPreviewCopy;
  assembly: WebsiteAssembly;
  sections: Array<{
    sectionId: string;
    kind: string;
    order: number;
    name: string;
    description: string;
    source: string;
    landingKey: string | null;
  }>;
  missingSectionIds: string[];
};

function buildLandingPreviewCopy(
  client: PlatformClientConfig,
  terminology: Record<string, string>,
  landing: PlatformClientLandingConfig,
): LandingPreviewCopy {
  const merged = { ...client.landing, ...landing };
  return {
    brandName: client.name,
    workspaceName: client.workspaceName,
    heroHeadline:
      merged.heroHeadline || `Welcome to ${client.name}`,
    heroLede:
      merged.heroLede ||
      terminology.startPrompt ||
      `A branded home for ${terminology.members || 'members'} in ${client.workspaceName}.`,
    ctaLabel: merged.ctaLabel || terminology.start || 'Get started',
    membersLabel: terminology.members || 'Members',
    startPrompt: terminology.startPrompt || '',
    seoTitle: merged.seoTitle || `${client.name} | ${client.workspaceName}`,
    seoDescription:
      merged.seoDescription ||
      terminology.startPrompt ||
      `${client.name} landing assembled from ClientConfig.`,
  };
}

/** Assemble marketing landing from the same ClientConfig as the portal shell. */
export function assembleWebsiteForClient(
  clientId: string,
  landingOverrides: PlatformClientLandingConfig = {},
): AssembledClientWebsite | null {
  const client = getPlatformClientConfig(clientId);
  if (!client) return null;

  const theme = normalizeWorkspaceTheme(getWorkspaceTheme(client.themeId));
  const personality = normalizeWorkspacePersonality(getWorkspacePersonality(client.personalityId));
  const terminology = { ...personality.terminology, ...client.terminology };
  const manifest = buildClientLandingManifest(client, landingOverrides);
  const assembly = assembleWebsitePage(manifest, getWebsiteSectionRegistry());
  const copy = buildLandingPreviewCopy(client, terminology, landingOverrides);

  return {
    clientId: client.id,
    clientName: client.name,
    themeId: client.themeId,
    personalityId: client.personalityId,
    personalityName: personality.name,
    cssVars: workspaceThemeToCssVars(theme),
    theme: {
      id: theme.id,
      primaryColor: theme.primaryColor,
      accentColor: theme.accentColor,
      backgroundColor: theme.backgroundColor,
      surfaceColor: theme.surfaceColor,
      textColor: theme.textColor,
      mutedTextColor: theme.mutedTextColor,
      borderColor: theme.borderColor,
      fontHeading: theme.fontHeading,
      fontBody: theme.fontBody,
    },
    terminology,
    copy,
    assembly,
    sections: assembly.resolved.map((r) => ({
      sectionId: r.instance.sectionId,
      kind: r.instance.kind,
      order: r.instance.order,
      name: r.definition?.name ?? r.instance.sectionId,
      description: r.definition?.description ?? '',
      source: r.definition?.source ?? 'unknown',
      landingKey: r.definition?.landingKey ?? null,
    })),
    missingSectionIds: assembly.missingSectionIds,
  };
}

export function getWebsiteEngineSummary() {
  const registry = getWebsiteSectionRegistry();
  const all = registry.list();
  return {
    totalSections: all.length,
    landingChassis: listLandingChassisSections().length,
    experienceBuilder: registry.listBySource('experience-builder').length,
    kinds: [...new Set(all.map((s) => s.kind))].sort(),
  };
}
