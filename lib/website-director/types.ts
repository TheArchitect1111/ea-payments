/**
 * Website Director types — Story Classification → Lens → Creative Direction → scenes.
 * Aligns with approved architecture canvases; no parallel schema.
 */

export const STORY_ARCHETYPES = [
  'The Guide',
  'The Builder',
  'The Restorer',
  'The Protector',
  'The Innovator',
  'The Challenger',
  'The Community Builder',
  'The Legacy Organization',
  'The Advocate',
  'The Educator',
  'The Caregiver',
  'The Craftsman',
] as const;

export type StoryArchetype = (typeof STORY_ARCHETYPES)[number];

export type NarrativeSceneRole =
  | 'human_story'
  | 'current_reality'
  | 'mission'
  | 'transformation'
  | 'proof'
  | 'process'
  | 'impact'
  | 'invitation'
  | 'portal_glimpse';

export type ArchetypeWeight = {
  archetype: StoryArchetype;
  weight: number;
};

export type StoryLens = {
  primaryEmotionalOutcome: string;
  visualLanguage: string;
  photographyStyle: string;
  narrativePacing: string;
  typographyPersonality: string;
  motionPhilosophy: string;
  colorPersonality: string;
  ctaPhilosophy: string;
  proofStrategy: string;
  preferredSceneOrder: NarrativeSceneRole[];
  avoidedDesignPatterns: string[];
};

export type StoryClassification = {
  classificationId: string;
  primaryArchetype: StoryArchetype;
  blend: ArchetypeWeight[];
  confidence: number;
  rationale: string[];
  rejectedArchetypes: StoryArchetype[];
  storyLens: StoryLens;
};

export type CreativeDirection = {
  status: 'approved' | 'draft';
  storyInOneSentence: string;
  primaryEmotionalObjective: string;
  visualMetaphor: string;
  narrativeArc: string;
  photographyDirection: string;
  typographyPersonality: string;
  motionPhilosophy: string;
  colorStrategy: string;
  ctaPhilosophy: string;
  antiPatterns: string[];
  swapTestPromise: string;
  primaryArchetype: StoryArchetype;
  blend: ArchetypeWeight[];
};

export type ScenePlanItem = {
  role: NarrativeSceneRole;
  job: string;
  copy: SceneCopy;
};

export type SceneCopy = {
  label?: string;
  title: string;
  body: string;
  eyebrow?: string;
  subtitle?: string;
  statValue?: string;
  statCaption?: string;
  leftLabel?: string;
  leftTitle?: string;
  leftBody?: string;
  rightLabel?: string;
  rightTitle?: string;
  rightBody?: string;
  metricOneValue?: string;
  metricOneLabel?: string;
  metricTwoValue?: string;
  metricTwoLabel?: string;
  metricThreeValue?: string;
  metricThreeLabel?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  imageUrl?: string;
};

export type OrganizationStoryInput = {
  organizationName: string;
  industry?: string;
  primaryAudience?: string;
  whoTheyAre?: string;
  mission?: string;
  story?: string;
  whyTheyExist?: string;
  whoTheyHelp?: string;
  whyItMatters?: string;
  whatChanges?: string;
  differentiators?: string[];
  brandHeadline?: string;
  brandSubhead?: string;
  brandCta?: string;
  brandVoice?: string;
  primaryColor?: string;
  accentColor?: string;
  portalLoginHref?: string;
  sitePath?: string;
  member?: {
    whereYouAre?: string;
    whatNext?: string;
    purpose?: string;
    whatSuccessLooksLike?: string;
  };
};

export type WebsiteDirectorPackage = {
  classification: StoryClassification;
  creativeDirection: CreativeDirection;
  scenes: ScenePlanItem[];
  organization: OrganizationStoryInput;
};
