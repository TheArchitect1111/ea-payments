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
import {
  buildCareContinuumPortalShell,
  composeCareContinuumEditorialPuck,
  mapOrganizationToCareContinuumFields,
  shouldUseCareContinuumEditorial,
  CARE_CONTINUUM_SIGNATURE,
  CARE_CONTINUUM_THEME_ID,
} from './grammars/care-continuum-editorial';
import type { Data } from '@measured/puck';

/**
 * Full directed compose: Website Director → Layout Composer → puckData + website_site.
 * When research signals healthcare / care continuum, uses the premium editorial grammar.
 */
export function composeDirectedWebsite(input: {
  organization: OrganizationStoryInput;
  portalLoginHref: string;
  sitePath: string;
  primaryColor?: string;
  accentColor?: string;
  returnHref?: string;
}): {
  director: ReturnType<typeof runWebsiteDirector>;
  composed: ReturnType<typeof composeScenesFromDirection>;
  puckData: Data;
  websiteSite: Record<string, unknown>;
  portalShellExtras?: ReturnType<typeof buildCareContinuumPortalShell>;
} {
  const director = runWebsiteDirector({
    ...input.organization,
    portalLoginHref: input.portalLoginHref,
    sitePath: input.sitePath,
    primaryColor: input.primaryColor,
    accentColor: input.accentColor,
  });

  if (
    shouldUseCareContinuumEditorial({
      organization: input.organization,
      primaryArchetype: director.classification.primaryArchetype,
    })
  ) {
    const fields = mapOrganizationToCareContinuumFields(input.organization, {
      returnHref: input.returnHref || input.sitePath || '/',
    });
    const puckData = composeCareContinuumEditorialPuck(fields);
    const portalShellExtras = buildCareContinuumPortalShell(fields);
    const composed = {
      scenes: [] as ReturnType<typeof composeScenesFromDirection>['scenes'],
      creativeDirection: director.creativeDirection,
      compositionSignature: CARE_CONTINUUM_SIGNATURE,
    };
    const websiteSite = {
      organizationName: fields.subjectName,
      brandHeadline: fields.brandHeadline,
      brandSubhead: fields.brandSubhead,
      compositionSignature: CARE_CONTINUUM_SIGNATURE,
      themeId: CARE_CONTINUUM_THEME_ID,
      grammar: 'care-continuum-editorial',
    };
    return { director, composed, puckData, websiteSite, portalShellExtras };
  }

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
