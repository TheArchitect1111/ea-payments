import type {
  CreativeDirection,
  NarrativeSceneRole,
  OrganizationStoryInput,
  SceneCopy,
  ScenePlanItem,
  StoryClassification,
} from './types';

const SCENE_JOBS: Record<NarrativeSceneRole, string> = {
  human_story: 'Who these people are and who they serve',
  current_reality: 'Why it hurts now',
  mission: 'Why they exist',
  transformation: 'What changes because of them',
  proof: 'Why trust them',
  process: 'How they work',
  impact: 'Outcomes that matter',
  invitation: 'What to do next',
  portal_glimpse: 'Optional continuity to the working portal',
};

function firstSentence(text: string | undefined, fallback: string): string {
  const t = (text || '').trim();
  if (!t) return fallback;
  const cut = t.split(/(?<=[.!?])\s+/)[0] || t;
  return cut.length > 160 ? `${cut.slice(0, 157)}…` : cut;
}

function copyForScene(
  role: NarrativeSceneRole,
  input: OrganizationStoryInput,
  classification: StoryClassification,
  direction: CreativeDirection,
): SceneCopy {
  const brand = input.organizationName.trim();
  const audience = input.primaryAudience || input.whoTheyHelp || 'the people they serve';
  const cta = input.brandCta?.trim() || classification.storyLens.ctaPhilosophy.split('/')[0].trim();
  const portal = input.portalLoginHref || '/portal/login';
  const site = input.sitePath || '#';

  switch (role) {
    case 'human_story':
      return {
        eyebrow: brand,
        title: input.brandHeadline?.trim() || firstSentence(input.whoTheyAre, brand),
        subtitle:
          input.brandSubhead?.trim() ||
          firstSentence(
            input.whoTheyHelp || input.primaryAudience,
            `Built for ${audience}.`,
          ),
        body: input.whoTheyAre?.trim() || direction.storyInOneSentence,
        ctaLabel: cta,
        ctaHref: '#invite',
        label: 'People',
      };
    case 'current_reality':
      return {
        label: 'Now',
        title: firstSentence(
          input.whyItMatters,
          'The gap is already costing people time, trust, and possibility.',
        ),
        body:
          input.whyItMatters?.trim() ||
          input.story?.trim() ||
          `Without a clear path, ${audience} stay stuck in the same unresolved reality.`,
        statValue: 'Today',
        statCaption: firstSentence(input.whyTheyExist || input.mission, 'The cost of waiting is real.'),
      };
    case 'mission':
      return {
        label: 'Mission',
        title: firstSentence(
          input.mission || input.whyTheyExist,
          `${brand} exists to change what happens next.`,
        ),
        body:
          input.mission?.trim() ||
          input.whyTheyExist?.trim() ||
          input.whoTheyAre?.trim() ||
          direction.storyInOneSentence,
      };
    case 'transformation':
      return {
        label: 'Change',
        title: firstSentence(input.whatChanges, 'From stuck to moving with purpose.'),
        body: input.whatChanges?.trim() || direction.primaryEmotionalObjective,
        leftLabel: 'Before',
        leftTitle: 'Unresolved reality',
        leftBody:
          input.whyItMatters?.trim() ||
          `Uncertainty, delay, and no clear next step for ${audience}.`,
        rightLabel: 'After',
        rightTitle: 'What becomes possible',
        rightBody:
          input.whatChanges?.trim() ||
          `Clarity, momentum, and a path that respects ${audience}.`,
      };
    case 'proof':
      return {
        label: 'Trust',
        title: 'Why people trust this work',
        body:
          (input.differentiators || []).slice(0, 3).join(' · ') ||
          classification.storyLens.proofStrategy,
      };
    case 'process':
      return {
        label: 'How',
        title: 'How the work unfolds',
        body:
          input.differentiators?.length
            ? input.differentiators.slice(0, 3).map((d, i) => `${i + 1}. ${d}`).join('\n')
            : '1. Listen for what matters\n2. Make the path visible\n3. Move with them to the next real step',
      };
    case 'impact':
      return {
        label: 'Impact',
        title: 'What changes in the real world',
        body: input.whatChanges?.trim() || classification.storyLens.proofStrategy,
        metricOneValue: '1',
        metricOneLabel: 'Clear story visitors can feel',
        metricTwoValue: '1',
        metricTwoLabel: 'Path that respects the audience',
        metricThreeValue: '1',
        metricThreeLabel: 'Next step that is honest',
      };
    case 'invitation':
      return {
        title: firstSentence(cta, 'Take the next step'),
        body:
          input.brandSubhead?.trim() ||
          classification.storyLens.ctaPhilosophy ||
          'When you are ready, begin with one clear action.',
        ctaLabel: cta || 'Begin',
        ctaHref: portal,
        secondaryLabel: 'View this site',
        secondaryHref: site,
      };
    case 'portal_glimpse':
      return {
        label: 'Workspace',
        title: 'Where the work continues',
        body:
          input.member?.purpose ||
          'A calm place to see where you are, what happened, and what comes next.',
        ctaLabel: 'Open portal',
        ctaHref: portal,
      };
    default:
      return { title: brand, body: direction.storyInOneSentence };
  }
}

export function selectNarrativeScenes(
  input: OrganizationStoryInput,
  classification: StoryClassification,
  direction: CreativeDirection,
): ScenePlanItem[] {
  const roles = classification.storyLens.preferredSceneOrder.filter(
    (role) => role !== 'portal_glimpse',
  );
  const capped = roles.slice(0, 7);
  if (!capped.includes('invitation')) capped.push('invitation');

  return capped.map((role) => ({
    role,
    job: SCENE_JOBS[role],
    copy: copyForScene(role, input, classification, direction),
  }));
}
