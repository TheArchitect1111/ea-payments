import type { CaptureRecord } from './capture-records';
import type { BusinessExtraction, OpportunityAnalysis } from './simplifi-business-analysis';
import type { RecommendationResult } from './recommendation-engine';

export const OPP_JSON_MARKER = '---OPP_JSON---';

export interface MagnifiOpportunityNarrative {
  currentState: string;
  opportunityAnalysis: string;
  futureState: string;
  recommendedImprovements: string[];
  strategicOpportunities: [string, string, string];
  creativeDirections: [string, string, string];
  quickWins: [string, string, string];
  longTermOpportunities: [string, string, string];
  considerThePossibilities: string;
}

export interface OpportunityTracking {
  views: number;
  lastViewedAt?: string;
  timeOnPageSeconds?: number;
  assessmentStarted: boolean;
  assessmentCompleted: boolean;
  discoveryBooked: boolean;
}

export interface OpportunityExperiencePayload {
  version: 1;
  prospectSlug: string;
  businessName: string;
  prospectName?: string;
  extraction: BusinessExtraction;
  analysis: OpportunityAnalysis;
  magnifi: MagnifiOpportunityNarrative;
  clientMessage: string;
  shareUrl: string;
  portalSlug?: string;
  captureRecordId?: string;
  createdAt: string;
  tracking: OpportunityTracking;
}

export function slugifyProspect(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);
  return base || 'prospect';
}

export function buildProspectSlug(businessName: string, uniqueSuffix?: string): string {
  const base = slugifyProspect(businessName);
  if (!uniqueSuffix) return base;
  return `${base}-${uniqueSuffix.slice(0, 6)}`;
}

export function buildClientMessage(businessName: string, shareUrl: string): string {
  return `While reviewing your business, event, organization, or marketing, I noticed several opportunities that may help increase visibility, engagement, and results.

I created a complimentary Opportunity Experience that highlights what is working, where opportunities may exist, and what improvements could potentially create a greater impact.

You can review it here:

${shareUrl}

I hope you find it valuable.`;
}

export function buildMagnifiNarrative(
  businessName: string,
  analysis: OpportunityAnalysis,
  extraction: BusinessExtraction,
  recommendations?: RecommendationResult,
): MagnifiOpportunityNarrative {
  const avg =
    Object.values(analysis.scores).reduce((a, b) => a + b, 0) /
    Object.keys(analysis.scores).length;

  const currentState = [
    `${businessName} presents ${analysis.strengths[0]?.toLowerCase() ?? 'a foundation with identifiable strengths'}.`,
    extraction.messaging ? `Current messaging: "${extraction.messaging.slice(0, 160)}…"` : '',
    `Composite opportunity score: ${Math.round(avg)}/100 across visibility, exposure, conversion, differentiation, modernity, and trust.`,
  ]
    .filter(Boolean)
    .join(' ');

  const opportunityAnalysis = [
    analysis.weaknesses[0] ?? 'Some gaps may limit how quickly prospects understand the value.',
    analysis.missedOpportunities.join(' '),
    `Estimated revenue opportunity: $${analysis.estimates.revenueLeftOnTable.low.toLocaleString()}–$${analysis.estimates.revenueLeftOnTable.high.toLocaleString()} annually (${analysis.estimates.revenueLeftOnTable.assumption})`,
  ].join(' ');

  const futureState = [
    `Imagine ${businessName} with a single clear path from first impression to booked conversation.`,
    'Every touchpoint reinforces trust, differentiation, and momentum.',
    recommendations?.firstStep?.action
      ? `Recommended starting move: ${recommendations.firstStep.action}`
      : 'Start with one visible win that proves the new rhythm within 30 days.',
  ].join(' ');

  const templateName = recommendations?.template.name ?? 'Growth Transformation';

  return {
    currentState,
    opportunityAnalysis,
    futureState,
    recommendedImprovements: [
      analysis.missedOpportunities[0] ?? 'Clarify the primary outcome you deliver in one sentence.',
      analysis.messagingGaps[0] ?? 'Align headline, subhead, and CTA to the same promise.',
      analysis.visualGaps[0] ?? 'Refresh visual hierarchy so the eye lands on action first.',
    ],
    strategicOpportunities: [
      `Build a ${templateName} narrative that turns interest into scheduled conversations.`,
      'Unify capture, follow-up, and visibility in one Pulse-tracked system.',
      'Package proof (testimonials, outcomes, credentials) adjacent to every CTA.',
    ],
    creativeDirections: [
      'Cinematic reveal: problem → hidden cost → future state → first move.',
      'Social-proof carousel highlighting real outcomes and transformation stories.',
      'Assessment-first funnel: Operational MRI™ before any purchase conversation.',
    ],
    quickWins: [
      analysis.missedOpportunities[0] ?? 'Add one primary CTA above the fold.',
      analysis.messagingGaps[0] ?? 'Rewrite headline to state who you help and the outcome.',
      'Publish one case study or testimonial on the highest-traffic page.',
    ],
    longTermOpportunities: [
      'Automated nurture sequence tied to assessment completion.',
      'Member or client portal for ongoing engagement (Pulse + Magnifi).',
      'Quarterly opportunity reviews with Simplifi capture on every campaign.',
    ],
    considerThePossibilities: [
      `What if ${businessName} captured every interested visitor instead of losing ${analysis.estimates.engagementLoss.low}–${analysis.estimates.engagementLoss.high}% to confusion or friction?`,
      `What if ${analysis.estimates.leadsMissed.low}–${analysis.estimates.leadsMissed.high} additional leads per month converted because the path forward was unmistakable?`,
      'What if your team spent less time explaining value and more time delivering it — because the experience did that work first?',
      'Consider the possibilities™ — then take the Operational MRI™ to prioritize what matters most.',
    ].join('\n\n'),
  };
}

export function buildOpportunityPayload(input: {
  businessName: string;
  prospectName?: string;
  extraction: BusinessExtraction;
  analysis: OpportunityAnalysis;
  recommendations?: RecommendationResult;
  baseUrl: string;
  portalSlug?: string;
  captureRecordId?: string;
  uniqueSuffix?: string;
}): OpportunityExperiencePayload {
  const prospectSlug = buildProspectSlug(input.businessName, input.uniqueSuffix);
  const shareUrl = `${input.baseUrl.replace(/\/$/, '')}/consider/${prospectSlug}`;
  const magnifi = buildMagnifiNarrative(
    input.businessName,
    input.analysis,
    input.extraction,
    input.recommendations,
  );

  return {
    version: 1,
    prospectSlug,
    businessName: input.businessName,
    prospectName: input.prospectName,
    extraction: input.extraction,
    analysis: input.analysis,
    magnifi,
    clientMessage: buildClientMessage(input.businessName, shareUrl),
    shareUrl,
    portalSlug: input.portalSlug,
    captureRecordId: input.captureRecordId,
    createdAt: new Date().toISOString(),
    tracking: {
      views: 0,
      assessmentStarted: false,
      assessmentCompleted: false,
      discoveryBooked: false,
    },
  };
}

export function embedOpportunityPayload(description: string, payload: OpportunityExperiencePayload): string {
  const summary = description.trim();
  const json = JSON.stringify(payload);
  return `${summary}\n\n${OPP_JSON_MARKER}\n${json}`;
}

export function parseOpportunityPayload(capture: CaptureRecord): OpportunityExperiencePayload | null {
  const text = capture.description ?? capture.analysisSummary ?? '';
  const idx = text.indexOf(OPP_JSON_MARKER);
  if (idx === -1) return null;
  try {
    return JSON.parse(text.slice(idx + OPP_JSON_MARKER.length).trim()) as OpportunityExperiencePayload;
  } catch {
    return null;
  }
}

export function rebuildShareUrl(baseUrl: string, slug: string): string {
  return `${baseUrl.replace(/\/$/, '')}/consider/${slug}`;
}

export function incrementViewTracking(
  payload: OpportunityExperiencePayload,
  timeOnPageSeconds?: number,
): OpportunityExperiencePayload {
  return {
    ...payload,
    tracking: {
      ...payload.tracking,
      views: payload.tracking.views + 1,
      lastViewedAt: new Date().toISOString(),
      timeOnPageSeconds:
        timeOnPageSeconds != null
          ? (payload.tracking.timeOnPageSeconds ?? 0) + timeOnPageSeconds
          : payload.tracking.timeOnPageSeconds,
    },
  };
}
