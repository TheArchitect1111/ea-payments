/**
 * Pure content builder for CTP executive deliverable email (Phase 6).
 */
import type { CtpClientType } from '@/lib/ctp-client-type';
import { CTP_CLIENT_TYPE_LABELS } from '@/lib/ctp-client-type';

export type CtpExecutiveBriefInput = {
  businessName: string;
  contactName: string;
  clientType: CtpClientType;
  capacityScore: number;
  scoreBand: string;
  primaryConstraint: string;
  weeklyTimeRecovery: number;
  opportunityLow: number;
  opportunityHigh: number;
  projectTypeLabel: string;
  recommendedFee: number;
  recommendations?: string[] | unknown;
  operationalChallenges?: string[];
};

export type CtpExecutiveBrief = {
  executiveSummary: string;
  topFindings: string[];
  capacityInterpretation: string;
  timelineLabel: string;
  investmentLabel: string;
  expectedRoiLabel: string;
  scopeLines: string[];
  clientTypeLabel: string;
};

const BAND_COPY: Record<string, string> = {
  healthy:
    'Your foundation is solid. There is meaningful room to reclaim time and sharpen execution.',
  strained:
    'Your organization is carrying operational friction that quietly costs time, money, and energy every week.',
  critical:
    'Significant operational gaps are actively limiting growth and personal bandwidth.',
  severe:
    'The systems underneath the business need to change for growth to be sustainable.',
};

function timelineForType(clientType: CtpClientType): string {
  switch (clientType) {
    case 'website':
      return 'Estimated timeline: 2–4 weeks to first live presence';
    case 'website_portal':
      return 'Estimated timeline: 3–6 weeks to live website + portal';
    case 'portal_only':
      return 'Estimated timeline: 2–4 weeks to portal launch';
    case 'business_transformation':
      return 'Estimated timeline: 6–12 weeks for phased transformation';
    default:
      return 'Estimated timeline: 2–6 weeks for the first focused deliverable';
  }
}

function scopeForType(clientType: CtpClientType, recommendations: string[]): string[] {
  const base: Record<CtpClientType, string[]> = {
    website: [
      'Branded website on the EA hub',
      'Clear offer messaging and primary call to action',
      'Lead capture path',
      'SEO and mobile baseline',
    ],
    website_portal: [
      'Branded website on the EA hub',
      'Lean client portal with updates, resources, and messaging',
      'Entitled workspace modules',
      'Welcome access and next-step guidance',
    ],
    portal_only: [
      'Personalized client / member portal',
      'Resources, updates, and documents',
      'Secure access for your people',
      'Progress visibility for delivery',
    ],
    business_transformation: [
      'Executive capacity analysis',
      'Operational blueprint and priority roadmap',
      'Systems and workflow recommendations',
      'Implementation plan with ROI framing',
    ],
    other: [
      'Discovery synthesis',
      'Recommended first product path',
      'Scoped next-step plan',
    ],
  };

  const scoped = [...base[clientType]];
  for (const line of recommendations.slice(0, 3)) {
    if (!scoped.some((item) => item.toLowerCase() === line.toLowerCase())) {
      scoped.push(line);
    }
  }
  return scoped.slice(0, 8);
}

function normalizeRecommendations(value: string[] | unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function challengeFindings(challenges: string[] | undefined): string[] {
  if (!challenges?.length) return [];
  return challenges
    .map((item) =>
      item
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase()),
    )
    .slice(0, 5);
}

export function buildCtpExecutiveBrief(input: CtpExecutiveBriefInput): CtpExecutiveBrief {
  const clientTypeLabel = CTP_CLIENT_TYPE_LABELS[input.clientType];
  const recommendations = normalizeRecommendations(input.recommendations);
  const capacityInterpretation = BAND_COPY[input.scoreBand] ?? BAND_COPY.strained!;
  const challengeLines = challengeFindings(input.operationalChallenges);

  const topFindings = [
    `Primary constraint: ${input.primaryConstraint}`,
    `Capacity score ${input.capacityScore}/100 (${input.scoreBand})`,
    `About ${input.weeklyTimeRecovery} hours per week recoverable with better systems`,
    ...challengeLines,
    ...recommendations.slice(0, 2),
  ].slice(0, 5);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(n);

  const executiveSummary = [
    `${input.businessName} is on a ${clientTypeLabel} track.`,
    capacityInterpretation,
    `We estimate ${fmt(input.opportunityLow)}–${fmt(input.opportunityHigh)} in annual opportunity, with roughly ${input.weeklyTimeRecovery} hours per week available to reclaim.`,
    `Recommended solution: ${input.projectTypeLabel}.`,
  ].join(' ');

  const low = Math.round(input.recommendedFee * 0.9);
  const high = Math.round(input.recommendedFee * 1.15);

  return {
    executiveSummary,
    topFindings,
    capacityInterpretation,
    timelineLabel: timelineForType(input.clientType),
    investmentLabel: `Investment guidance: ${fmt(low)}–${fmt(high)} (point estimate ${fmt(input.recommendedFee)})`,
    expectedRoiLabel: `Expected ROI framing: recover ${input.weeklyTimeRecovery}+ hours/week and unlock ${fmt(input.opportunityLow)}–${fmt(input.opportunityHigh)} annual opportunity`,
    scopeLines: scopeForType(input.clientType, recommendations),
    clientTypeLabel,
  };
}
