import type { WebsiteAssembly, WebsitePageManifest } from './types.js';
import { getDefaultWebsiteRegistry, type WebsiteSectionRegistry } from './registry.js';

export function assembleWebsitePage(
  page: WebsitePageManifest,
  registry: WebsiteSectionRegistry = getDefaultWebsiteRegistry(),
): WebsiteAssembly {
  const missingSectionIds: string[] = [];
  const resolved = [...page.sections]
    .sort((a, b) => a.order - b.order)
    .filter((s) => s.enabled)
    .map((instance) => {
      const definition = registry.get(instance.sectionId);
      if (!definition) missingSectionIds.push(instance.sectionId);
      return { instance, definition };
    });

  return { page, resolved, missingSectionIds };
}

/** Suggest a classic landing-chassis page order as a WebsitePageManifest. */
export function landingChassisPageTemplate(input: {
  id: string;
  name: string;
  organizationId?: string;
  themeId?: string;
}): WebsitePageManifest {
  const keys = [
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
  ];
  return {
    id: input.id,
    name: input.name,
    organizationId: input.organizationId,
    themeId: input.themeId,
    sections: keys.map((sectionId, order) => ({
      sectionId,
      kind:
        sectionId.includes('possibility')
          ? 'hero'
          : sectionId.includes('socialProof')
            ? 'testimonials'
            : sectionId.includes('finalCta')
              ? 'cta'
              : sectionId.includes('footer')
                ? 'footer'
                : sectionId.includes('results')
                  ? 'stats'
                  : sectionId.includes('process')
                    ? 'process'
                    : sectionId.includes('founder')
                      ? 'team'
                      : sectionId.includes('difference') || sectionId.includes('portal')
                        ? 'features'
                        : 'content',
      order,
      enabled: true,
    })),
  };
}
