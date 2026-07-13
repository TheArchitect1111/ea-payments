/**
 * Bridge live experience-builder BLOCK_REGISTRY into @ea/website-engine.
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
import { BLOCK_REGISTRY } from '@/lib/experience-builder/blocks/registry';

let cachedRegistry: WebsiteSectionRegistry | undefined;

export function getWebsiteSectionRegistry(): WebsiteSectionRegistry {
  if (cachedRegistry) return cachedRegistry;
  cachedRegistry = createDefaultWebsiteRegistry(
    BLOCK_REGISTRY.map((b) => ({
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
