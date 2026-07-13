/**
 * Bridge landing-chassis (+ optional experience-builder blocks) into @ea/website-engine.
 * Experience-builder BLOCK_REGISTRY is optional so CI works without the full block tree.
 */
import {
  createDefaultWebsiteRegistry,
  assembleWebsitePage,
  landingChassisPageTemplate,
  listLandingChassisSections,
  type WebsiteAssembly,
  type WebsitePageManifest,
  type WebsiteSectionDefinition,
  type WebsiteSectionRegistry,
} from '@ea/website-engine';

type ExperienceBlockMeta = {
  id: string;
  category: string;
  label: string;
  description: string;
  aiPurpose?: string;
};

let cachedRegistry: WebsiteSectionRegistry | undefined;

/** Experience-builder blocks land in a separate PR; landing-chassis sections still register. */
function loadExperienceBuilderBlocks(): ExperienceBlockMeta[] {
  return [];
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
