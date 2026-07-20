export type {
  ComposedScene,
  CompositionId,
  CompositionTemplate,
  LayoutComposerInput,
  LayoutComposerResult,
} from './types';
export { COMPOSITION_TEMPLATES, selectCompositionForScene } from './compositions';
export { composeScenesFromDirection } from './compose-scenes';
export {
  composePuckDataFromDirector,
  puckContainsFeatureCards,
} from './compose-puck-data';
export { buildWebsiteSiteFromComposer } from './build-website-site';

import { runWebsiteDirector, type OrganizationStoryInput } from '@/lib/website-director';
import { composePuckDataFromDirector } from './compose-puck-data';
import { composeScenesFromDirection } from './compose-scenes';
import { buildWebsiteSiteFromComposer } from './build-website-site';
import type { Data } from '@measured/puck';

/**
 * Full directed compose: Website Director → Layout Composer → puckData + website_site.
 */
export function composeDirectedWebsite(input: {
  organization: OrganizationStoryInput;
  portalLoginHref: string;
  sitePath: string;
  primaryColor?: string;
  accentColor?: string;
}): {
  director: ReturnType<typeof runWebsiteDirector>;
  composed: ReturnType<typeof composeScenesFromDirection>;
  puckData: Data;
  websiteSite: Record<string, unknown>;
} {
  const director = runWebsiteDirector({
    ...input.organization,
    portalLoginHref: input.portalLoginHref,
    sitePath: input.sitePath,
    primaryColor: input.primaryColor,
    accentColor: input.accentColor,
  });
  const composerInput = {
    director,
    portalLoginHref: input.portalLoginHref,
    sitePath: input.sitePath,
    primaryColor: input.primaryColor,
    accentColor: input.accentColor,
  };
  const composed = composeScenesFromDirection(composerInput);
  const puckData = composePuckDataFromDirector(composerInput);
  const websiteSite = buildWebsiteSiteFromComposer({
    director,
    composedScenes: composed.scenes,
    compositionSignature: composed.compositionSignature,
  });
  return { director, composed, puckData, websiteSite };
}
