/**
 * Open Design — Creative Experience Engine types.
 * Visual design department of EA; never operational analysis.
 */

export type OpenDesignPipelinePhase =
  | 'executive-intelligence'
  | 'story-extraction'
  | 'creative-direction'
  | 'experience-design'
  | 'executive-review'
  | 'implementation';

export type CreativeReviewStatus =
  | 'research-complete'
  | 'story-extracted'
  | 'creative-dna-generated'
  | 'homepage-concept-ready'
  | 'portal-concept-ready'
  | 'presentation-ready'
  | 'awaiting-executive-review'
  | 'approved'
  | 'revision-requested';

export type EditorialStyleId =
  | 'documentary'
  | 'editorial'
  | 'museum'
  | 'magazine'
  | 'netflix-documentary'
  | 'luxury-hospitality'
  | 'custom';

export type IndustryVerticalId =
  | 'healthcare'
  | 'education'
  | 'nonprofit'
  | 'sports'
  | 'financial-services'
  | 'professional-services'
  | 'manufacturing'
  | 'government'
  | 'hospitality'
  | 'general';

export interface StorySentence {
  /** One sentence. If empty, pipeline must stop before design. */
  sentence: string;
  source?: 'executive-intelligence' | 'client-input' | 'agent' | 'manual';
  validatedAt?: string;
}

export interface CreativeDna {
  emotionalTone: string;
  photographyStyle: string;
  typography: string;
  scrollRhythm: string;
  lighting: string;
  texture: string;
  motion: string;
  colorPsychology: string;
  storyProgression: string;
  editorialStyle: EditorialStyleId;
  /** Explicit rejection of generic SaaS/corporate defaults */
  antiPatterns: string[];
}

export interface CreativeProfile {
  organizationId: string;
  organizationName: string;
  industryVertical: IndustryVerticalId;
  story: StorySentence;
  mission: string;
  audience: string;
  differentiators: string[];
  creativeDna?: CreativeDna;
  photographyStyle?: string;
  typography?: string;
  colorPalette: { primary: string; secondary: string; accent?: string };
  motion?: string;
  componentLanguage?: string;
  visualMetaphors?: string[];
  editorialStyle?: EditorialStyleId;
  portalStyle?: string;
  presentationStyle?: string;
  updatedAt: string;
}

export type ExperienceDeliverableKind =
  | 'homepage'
  | 'portal'
  | 'dashboard'
  | 'landing-page'
  | 'presentation'
  | 'mobile'
  | 'component-library'
  | 'client-journey';

export interface ExperienceDeliverable {
  kind: ExperienceDeliverableKind;
  title: string;
  /** What part of the story this section tells */
  storyBeat: string;
  status: 'pending' | 'draft' | 'ready' | 'approved';
  cursorHandoffRef?: string;
}

export interface CreativeExperienceBrief {
  id: string;
  organizationId: string;
  submissionId?: string;
  phase: OpenDesignPipelinePhase;
  reviewStatus: CreativeReviewStatus;
  profile: CreativeProfile;
  deliverables: ExperienceDeliverable[];
  /** Blockers — e.g. missing story sentence */
  blockers: string[];
  createdAt: string;
  updatedAt: string;
}

/** Input from Executive Intelligence layer (PraisonAI / CTP snapshot / intake). */
export interface ExecutiveIntelligenceInput {
  organizationId: string;
  organizationName: string;
  industry?: string;
  mission?: string;
  audience?: string;
  differentiators?: string[];
  executiveSummary?: string;
  websiteAuditNotes?: string;
  portalRecommendations?: string[];
  marketingNotes?: string;
  discoveryAnswers?: Record<string, unknown>;
}
