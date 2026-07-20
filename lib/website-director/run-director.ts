import { classifyOrganizationStory } from './classify-story';
import { buildCreativeDirection } from './creative-direction';
import { selectNarrativeScenes } from './story-engine';
import type { OrganizationStoryInput, WebsiteDirectorPackage } from './types';

/**
 * Website Director pipeline: Classification → Lens → Creative Direction → Story Engine scenes.
 * Layout Composer consumes the resulting package — does not invent story.
 */
export function runWebsiteDirector(input: OrganizationStoryInput): WebsiteDirectorPackage {
  const organization: OrganizationStoryInput = {
    ...input,
    organizationName: input.organizationName.trim() || 'Organization',
  };
  const classification = classifyOrganizationStory(organization);
  const creativeDirection = buildCreativeDirection(organization, classification);
  const scenes = selectNarrativeScenes(organization, classification, creativeDirection);

  return {
    classification,
    creativeDirection,
    scenes,
    organization,
  };
}
