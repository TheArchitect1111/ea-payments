/**
 * Opportunity Intelligence Brief™ — consultant-facing Launch Protocol v3.
 */
import { callClaudeText } from '@/lib/ai';
import type { FactoryCapacityScorecard } from '@/lib/factory-capacity-score';
import type { FactoryEntityProfile } from '@/lib/factory-entity-profile';
import {
  buildOpportunityBriefFallback,
  parseOpportunityBriefLabeledText,
} from '@/lib/factory-opportunity-brief-parse.mjs';
import {
  buildFactoryOrgResearchSync,
  type FactoryOrgResearch,
} from '@/lib/factory-org-research';
import type { FactoryProject } from '@/lib/factory-project-store';

export type BriefSurfaceCopy = {
  purpose: string;
  talkingPoint: string;
  businessValue: string;
};

export type FactoryOpportunityScoreRow = {
  key: string;
  label: string;
  score: number;
  note: string;
};

export type FactoryOpportunityBrief = {
  productName: 'Opportunity Intelligence Brief™';
  organization: string;
  industry: string;
  industryFamily: string;
  primaryAudience: string;
  story: string;
  digitalMaturity: number;
  estimatedOpportunity: string;
  overallConfidence: 'high' | 'medium' | 'thin';
  recommendedStartingPoint: string;
  generationTime: string;
  preparedForConsultant: string;
  preparedDate: string;
  estimatedReviewTime: string;
  whoTheyAre: string;
  whatWeLearned: string[];
  hiddenOpportunities: Array<{
    observation: string;
    businessImpact: string;
    possibleFuture: string;
  }>;
  evidence: Array<{ label: string; detail: string; kind?: string }>;
  scorecard: FactoryOpportunityScoreRow[];
  website: BriefSurfaceCopy;
  portal: BriefSurfaceCopy & { modules: string[] };
  member: BriefSurfaceCopy & { persona: string; tiles: string[] };
  conversationStarters: string[];
  discoveryQuestions: string[];
  objections: Array<{ objection: string; response: string }>;
  meetingStrategy: {
    showFirst: string;
    discussFirst: string;
    mostCompelling: string;
    flow20: string[];
    flow45: string[];
  };
  nextSteps: {
    immediate: string;
    withinOneWeek: string;
    withinThirtyDays: string;
    longerTerm: string;
  };
  consultantCoaching: string[];
  brand: {
    primary: string;
    accent: string;
    logoUrl?: string;
    headline: string;
    subhead: string;
    cta: string;
  };
  /** Set when concept images passed quality gate with thin note */
  visualConfidenceNote?: string;
};

function buildPrompt(
  profile: FactoryEntityProfile,
  research: FactoryOrgResearch,
  fallback: FactoryOpportunityBrief,
  signalBlob: string,
): string {
  return `You are an Efficiency Architects strategist preparing an Opportunity Intelligence Brief™ for a consultant (NOT the client).
Rewrite naturally — never copy website text. Premium, calm, meeting-ready. Plain English.
Use only supported facts. If thin, keep CONFIDENCE honest (thin).

Return plain text with these labels exactly:
INDUSTRY: (short industry label)
PRIMARY_AUDIENCE: (who they serve)
STORY: (one-line "we help …")
RECOMMENDED_STARTING_POINT: Future Website | Executive Ops Portal | Member Experience
CONFIDENCE: high | medium | thin
WHO_THEY_ARE: (one paragraph)
WHAT_WE_LEARNED: (3-5 observations separated by " | ")
HIDDEN_OPPORTUNITIES: (3-4 items as observation / impact / possible future, separated by " | ")
WEBSITE_PURPOSE: (one sentence)
WEBSITE_TALKING: (guided question)
WEBSITE_VALUE: (business value)
PORTAL_PURPOSE: (one sentence)
PORTAL_TALKING: (guided question)
PORTAL_VALUE: (business value)
PORTAL_MODULES: (6-8 org-specific module names — never "Dashboard" or "Card 1" — separated by " | ")
MEMBER_PERSONA: (Volunteer|Patient|Player|Family|Student|Employee|Donor|Member|Client)
MEMBER_PURPOSE: (one sentence)
MEMBER_TALKING: (guided question)
MEMBER_VALUE: (business value)
MEMBER_TILES: (5-6 tile labels separated by " | ")
CONVERSATION_STARTERS: (5 starters separated by " | ")
DISCOVERY_QUESTIONS: (8-10 questions separated by " | ")
OBJECTIONS: (3 items as Objection → Response, separated by " | ")
SHOW_FIRST: (which concept to open with)
DISCUSS_FIRST: (first observation to discuss)
MOST_COMPELLING: (most compelling insight)
FLOW_20: (4 steps for 20-min meeting, " | ")
FLOW_45: (5-6 steps for 45-min meeting, " | ")
NEXT_IMMEDIATE: (after the meeting)
NEXT_WEEK: (within 1 week)
NEXT_THIRTY: (within 30 days)
NEXT_LONGER: (longer term)
CONSULTANT_COACHING: (4-6 confidential cues separated by " | ")
PRIMARY_COLOR: (#hex or none)
ACCENT_COLOR: (#hex or none)
HEADLINE: (homepage hero for THIS org — never "Your Organization")
SUBHEAD: (supporting line)
CTA: (primary button)

Fallback who-they-are: ${fallback.whoTheyAre}
Fallback story: ${fallback.story}

Research:
Name: ${research.name}
Family: ${research.industryFamily}
Audience: ${research.primaryAudience}
Offer: ${research.offer}
Evidence: ${research.evidence.map((e) => `${e.label}: ${e.detail}`).join(' | ')}
Public page: ${research.publicPage ? `${research.publicPage.network} ${research.publicPage.excerpt || research.publicPage.url}` : 'none'}
Friction: ${(profile.frictionSignals || research.frictionHints || []).join(' | ')}
Profile: ${profile.whoTheyAre}
${signalBlob.slice(0, 2400)}`;
}

export function buildOpportunityBriefSync(input: {
  profile: FactoryEntityProfile;
  scorecard: FactoryCapacityScorecard;
  opportunityLabel: string;
  generationTime: string;
  project: FactoryProject;
  research?: FactoryOrgResearch;
  consultantName?: string;
}): FactoryOpportunityBrief {
  const research = input.research ?? buildFactoryOrgResearchSync(input.project, input.profile);
  return buildOpportunityBriefFallback({
    profile: input.profile,
    research,
    scorecard: input.scorecard,
    opportunityLabel: input.opportunityLabel,
    generationTime: input.generationTime,
    consultantName: input.consultantName || 'Robert',
    industryHint: research.industry,
    primaryColor: research.brand.primary,
    accentColor: research.brand.accent,
    logoUrl: research.brand.logoUrl,
    heroHeadline: research.brand.headline,
  }) as FactoryOpportunityBrief;
}

export async function synthesizeFactoryOpportunityBrief(input: {
  profile: FactoryEntityProfile;
  scorecard: FactoryCapacityScorecard;
  opportunityLabel: string;
  generationTime: string;
  project: FactoryProject;
  research: FactoryOrgResearch;
  consultantName?: string;
}): Promise<FactoryOpportunityBrief> {
  const fallback = buildOpportunityBriefSync(input);
  const signalBlob = [
    input.research.publicPage?.excerpt,
    input.research.sourceNote,
    input.project.notes,
    input.project.goal,
    input.profile.opsReality,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const raw = await callClaudeText(
      buildPrompt(input.profile, input.research, fallback, signalBlob),
      { maxTokens: 2000 },
    );
    if (!raw?.trim()) return fallback;
    const parsed = parseOpportunityBriefLabeledText(raw, fallback) as FactoryOpportunityBrief;
    console.info('[factory-opportunity-brief] synthesized', {
      projectId: input.project.id,
      org: parsed.organization,
      confidence: parsed.overallConfidence,
    });
    return parsed;
  } catch (err) {
    console.error('[factory-opportunity-brief] synthesis failed', input.project.id, err);
    return fallback;
  }
}

/** @deprecated Use FactoryOpportunityBrief */
export type FactoryExecutiveBrief = FactoryOpportunityBrief;
/** @deprecated */
export const buildExecutiveBriefSync = buildOpportunityBriefSync;
/** @deprecated */
export const synthesizeFactoryExecutiveBrief = synthesizeFactoryOpportunityBrief;
