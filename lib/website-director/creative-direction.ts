import type {
  CreativeDirection,
  OrganizationStoryInput,
  StoryClassification,
} from './types';

export function buildCreativeDirection(
  input: OrganizationStoryInput,
  classification: StoryClassification,
): CreativeDirection {
  const brand = input.organizationName.trim() || 'This organization';
  const lens = classification.storyLens;
  const headline = input.brandHeadline?.trim();
  const mission = input.mission?.trim() || input.whyTheyExist?.trim() || input.whoTheyAre?.trim();
  const stakes = input.whyItMatters?.trim() || input.story?.trim();

  const storyInOneSentence =
    headline ||
    (mission
      ? `${brand}: ${mission.slice(0, 140)}`
      : `${brand} exists so the people they serve are no longer stuck where they started.`);

  return {
    status: 'approved',
    storyInOneSentence,
    primaryEmotionalObjective: lens.primaryEmotionalOutcome,
    visualMetaphor: lens.visualLanguage,
    narrativeArc: lens.preferredSceneOrder.join(' → '),
    photographyDirection: lens.photographyStyle,
    typographyPersonality: lens.typographyPersonality,
    motionPhilosophy: lens.motionPhilosophy,
    colorStrategy: lens.colorPersonality,
    ctaPhilosophy: lens.ctaPhilosophy,
    antiPatterns: [
      ...lens.avoidedDesignPatterns,
      'EAHero → About → three feature cards → CTA',
      'portal product language as the public story',
    ],
    swapTestPromise:
      stakes?.slice(0, 160) ||
      `Without logo or name, still feels like ${classification.primaryArchetype} serving ${input.primaryAudience || input.industry || 'their people'}.`,
    primaryArchetype: classification.primaryArchetype,
    blend: classification.blend,
  };
}
