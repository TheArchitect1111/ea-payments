/**
 * CTP Executive Snapshot — Phase 3 business intelligence.
 * Deterministic capacity / maturity / ROI package for BI tracks.
 */
import type { AnalysisResult } from '@/lib/analysis-engine';
import { OPERATIONAL_CHALLENGES } from '@/lib/analysis-engine';
import type { CtpClientType } from '@/lib/ctp-client-type';
import { CTP_CLIENT_TYPE_LABELS } from '@/lib/ctp-client-type';

export type CtpSnapshotFinding = {
  title: string;
  detail: string;
  severity: 'info' | 'warning' | 'critical';
};

export type CtpExecutiveSnapshotScope = {
  stack: string[];
  timelineLabel: string;
  investmentLow: number;
  investmentHigh: number;
  expectedRoiLabel: string;
  projectTypeLabel: string;
};

export type CtpExecutiveSnapshot = {
  version: 1;
  generatedAt: string;
  clientType: CtpClientType;
  clientTypeLabel: string;
  capacityScore: number;
  scoreBand: string;
  /** 0–100 — higher means healthier operating maturity. */
  operationalMaturity: number;
  /** Estimated % of leadership / team capacity lost to admin drag. */
  adminWastePercent: number;
  weeklyHoursRecoverable: number;
  annualOpportunityLow: number;
  annualOpportunityHigh: number;
  primaryConstraint: string;
  findings: CtpSnapshotFinding[];
  scope: CtpExecutiveSnapshotScope;
  headline: string;
  summary: string;
};

export type BuildCtpExecutiveSnapshotInput = {
  businessName: string;
  clientType: CtpClientType;
  analysis: Pick<
    AnalysisResult,
    | 'capacityScore'
    | 'scoreBand'
    | 'primaryConstraint'
    | 'weeklyTimeRecovery'
    | 'opportunityLow'
    | 'opportunityHigh'
  >;
  projectTypeLabel: string;
  recommendedFee: number;
  operationalChallenges?: string[];
  recommendations?: unknown;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function challengeLabel(id: string): string {
  const found = OPERATIONAL_CHALLENGES.find((item) => item.id === id);
  if (found) return found.label;
  return id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function asLines(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function stackForType(clientType: CtpClientType): string[] {
  switch (clientType) {
    case 'business_transformation':
      return [
        'Executive capacity snapshot',
        'Operational blueprint',
        'Systems / workflow roadmap',
        'Phased implementation plan',
      ];
    case 'website':
      return ['Branded website', 'Offer messaging', 'Lead capture', 'SEO baseline'];
    case 'website_portal':
      return ['Branded website', 'Client portal', 'Entitled modules', 'Progress workspace'];
    case 'portal_only':
      return ['Client portal', 'Resources + documents', 'Secure access', 'Progress visibility'];
    default:
      return ['Discovery synthesis', 'First product path', 'Scoped next-step plan'];
  }
}

function timelineForType(clientType: CtpClientType): string {
  switch (clientType) {
    case 'website':
      return '2–4 weeks to first live presence';
    case 'website_portal':
      return '3–6 weeks to live website + portal';
    case 'portal_only':
      return '2–4 weeks to portal launch';
    case 'business_transformation':
      return '6–12 weeks for phased transformation';
    default:
      return '2–6 weeks for the first focused deliverable';
  }
}

function bandSeverity(band: string): CtpSnapshotFinding['severity'] {
  if (band === 'severe' || band === 'critical') return 'critical';
  if (band === 'strained') return 'warning';
  return 'info';
}

export function buildCtpExecutiveSnapshot(
  input: BuildCtpExecutiveSnapshotInput,
): CtpExecutiveSnapshot {
  const { analysis } = input;
  const clientTypeLabel = CTP_CLIENT_TYPE_LABELS[input.clientType];
  const challenges = (input.operationalChallenges ?? []).map(String);
  const recommendations = asLines(input.recommendations);

  const operationalMaturity = clamp(100 - analysis.capacityScore * 0.85, 12, 92);
  const adminWastePercent = clamp(18 + analysis.capacityScore * 0.45, 18, 72);

  const investmentLow = Math.round(input.recommendedFee * 0.9);
  const investmentHigh = Math.round(input.recommendedFee * 1.15);
  const roiMultiple =
    analysis.opportunityHigh > 0 && input.recommendedFee > 0
      ? Math.max(1.2, Number((analysis.opportunityHigh / input.recommendedFee).toFixed(1)))
      : 2;

  const findings: CtpSnapshotFinding[] = [
    {
      title: `Capacity band: ${analysis.scoreBand}`,
      detail: `Capacity score ${analysis.capacityScore}/100 — primary constraint is ${analysis.primaryConstraint}.`,
      severity: bandSeverity(analysis.scoreBand),
    },
    {
      title: `${analysis.weeklyTimeRecovery} hours / week recoverable`,
      detail: `At current friction, roughly ${analysis.weeklyTimeRecovery} hours per week can return to leadership and delivery.`,
      severity: analysis.weeklyTimeRecovery >= 12 ? ('critical' as const) : ('warning' as const),
    },
    {
      title: `Admin drag ≈ ${adminWastePercent}%`,
      detail: 'Estimated share of operating capacity lost to manual work, tool sprawl, and missing visibility.',
      severity: adminWastePercent >= 45 ? ('critical' as const) : ('warning' as const),
    },
    ...challenges.slice(0, 4).map((id): CtpSnapshotFinding => ({
      title: challengeLabel(id),
      detail: 'Called out in discovery as an active operational challenge.',
      severity: 'warning',
    })),
    ...recommendations.slice(0, 2).map((line): CtpSnapshotFinding => ({
      title: line,
      detail: 'Recommended from discovery synthesis.',
      severity: 'info',
    })),
  ].slice(0, 8);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(n);

  const headline = `${input.businessName} — Executive Snapshot`;
  const summary = [
    `${input.businessName} is on the ${clientTypeLabel} track with operational maturity at ${operationalMaturity}/100.`,
    `About ${adminWastePercent}% of capacity is lost to admin drag, with ${analysis.weeklyTimeRecovery} hours/week recoverable.`,
    `Annual opportunity is estimated at ${fmt(analysis.opportunityLow)}–${fmt(analysis.opportunityHigh)}.`,
  ].join(' ');

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    clientType: input.clientType,
    clientTypeLabel,
    capacityScore: analysis.capacityScore,
    scoreBand: analysis.scoreBand,
    operationalMaturity,
    adminWastePercent,
    weeklyHoursRecoverable: analysis.weeklyTimeRecovery,
    annualOpportunityLow: analysis.opportunityLow,
    annualOpportunityHigh: analysis.opportunityHigh,
    primaryConstraint: analysis.primaryConstraint,
    findings,
    scope: {
      stack: stackForType(input.clientType),
      timelineLabel: timelineForType(input.clientType),
      investmentLow,
      investmentHigh,
      expectedRoiLabel: `~${roiMultiple}x annual opportunity vs recommended investment`,
      projectTypeLabel: input.projectTypeLabel,
    },
    headline,
    summary,
  };
}
