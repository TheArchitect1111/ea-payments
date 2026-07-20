import type { WebsiteDirectorPackage } from '@/lib/website-director';
import type { ComposedScene } from './types';

/**
 * Emit website_site artifact shape for Experience Director — scene roles, not feature cards.
 */
export function buildWebsiteSiteFromComposer(input: {
  director: WebsiteDirectorPackage;
  composedScenes: ComposedScene[];
  compositionSignature: string;
}): Record<string, unknown> {
  const { director, composedScenes, compositionSignature } = input;
  const org = director.organization;

  return {
    kind: 'website_site',
    builderId: 'layout-composer',
    stub: false,
    organizationName: org.organizationName,
    organization: {
      name: org.organizationName,
      industry: org.industry || 'Organization',
    },
    brand: {
      voice:
        org.brandVoice ||
        `${director.creativeDirection.primaryArchetype} — ${director.creativeDirection.primaryEmotionalObjective}`,
      headline: org.brandHeadline || director.creativeDirection.storyInOneSentence.slice(0, 80),
      primary: org.primaryColor,
      accent: org.accentColor,
    },
    experience: {
      emotionalTone: director.creativeDirection.primaryEmotionalObjective,
      brandPersonality: `${director.creativeDirection.primaryArchetype} · ${director.classification.blend
        .map((b) => `${Math.round(b.weight * 100)}% ${b.archetype}`)
        .join(' / ')}`,
      visualDna: director.creativeDirection.visualMetaphor,
      creativeDirectionId: director.classification.classificationId,
      storyClassificationId: director.classification.classificationId,
      compositionSignature,
    },
    story: {
      whoTheyAre: org.whoTheyAre || director.creativeDirection.storyInOneSentence,
      whyTheyExist: org.whyTheyExist || org.mission || org.whoTheyAre || '',
      whoTheyHelp: org.whoTheyHelp || org.primaryAudience || '',
      whyItMatters: org.whyItMatters || org.story || '',
      whatChanges: org.whatChanges || director.creativeDirection.primaryEmotionalObjective,
    },
    portal: {
      memberHome: {
        whereYouAre:
          org.member?.whereYouAre ||
          `Connected to ${org.organizationName} — the work that keeps your story moving.`,
        whatNext:
          org.member?.whatNext ||
          'Continue with the next guided step in your portal workspace.',
        purpose: org.member?.purpose || org.mission || director.creativeDirection.storyInOneSentence,
        whatSuccessLooksLike:
          org.member?.whatSuccessLooksLike ||
          org.whatChanges ||
          'Clear progress, trusted next steps, and outcomes you can feel.',
      },
    },
    pages: [
      {
        path: '/',
        title: 'Home',
        order: 1,
        sections: composedScenes.map((item, index) => ({
          id: `${item.role}-${index + 1}`,
          role: item.role,
          compositionId: item.compositionId,
          label: item.scene.job,
        })),
      },
    ],
    pageCount: 1,
    note: 'Directed Layout Composer output — scene compositions, no feature-card SaaS roles',
  };
}
