/**
 * Portal Business Intelligence view — Executive Snapshot + scope for clients.
 */
import { ctpClientTypeLabel } from '@/lib/ctp-client-type';
import type { CtpSubmission } from '@/lib/ctp-submissions';

export type CtpBiMetric = {
  label: string;
  value: string;
  detail?: string;
};

export type CtpBiFinding = {
  title: string;
  detail: string;
  severity: 'info' | 'warning' | 'critical';
};

export type CtpBiView = {
  businessName: string;
  clientTypeLabel?: string;
  headline: string;
  summary: string;
  available: boolean;
  metrics: CtpBiMetric[];
  findings: CtpBiFinding[];
  scopeStack: string[];
  timelineLabel?: string;
  investmentLabel?: string;
  expectedRoiLabel?: string;
  projectTypeLabel?: string;
  digitalScore?: number;
  digitalImpact?: string;
  productionHeadline?: string;
};

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n);
}

export function buildCtpBiView(submission: CtpSubmission): CtpBiView {
  const snap = submission.executiveSnapshot;
  const clientTypeLabel = submission.clientType
    ? ctpClientTypeLabel(submission.clientType)
    : snap?.clientTypeLabel;

  if (!snap) {
    return {
      businessName: submission.businessName,
      clientTypeLabel,
      headline: 'Executive intelligence is preparing',
      summary:
        'Your Business Intelligence snapshot will appear here for transformation tracks once capacity analysis completes.',
      available: false,
      metrics: [],
      findings: [],
      scopeStack: [],
      digitalScore: submission.digitalPresenceAudit?.overallScore,
      digitalImpact: submission.digitalPresenceAudit?.impactEstimate,
      productionHeadline: submission.productionPackage?.headline,
    };
  }

  const metrics: CtpBiMetric[] = [
    {
      label: 'Operational maturity',
      value: `${snap.operationalMaturity}/100`,
      detail: `Capacity band: ${snap.scoreBand}`,
    },
    {
      label: 'Admin drag',
      value: `${snap.adminWastePercent}%`,
      detail: 'Estimated capacity lost to manual work',
    },
    {
      label: 'Hours / week recoverable',
      value: String(snap.weeklyHoursRecoverable),
      detail: snap.primaryConstraint,
    },
    {
      label: 'Annual opportunity',
      value: `${fmt(snap.annualOpportunityLow)}–${fmt(snap.annualOpportunityHigh)}`,
      detail: `Capacity score ${snap.capacityScore}/100`,
    },
  ];

  return {
    businessName: submission.businessName,
    clientTypeLabel,
    headline: snap.headline,
    summary: snap.summary,
    available: true,
    metrics,
    findings: snap.findings.map((f) => ({
      title: f.title,
      detail: f.detail,
      severity: f.severity,
    })),
    scopeStack: snap.scope.stack,
    timelineLabel: snap.scope.timelineLabel,
    investmentLabel: `${fmt(snap.scope.investmentLow)}–${fmt(snap.scope.investmentHigh)}`,
    expectedRoiLabel: snap.scope.expectedRoiLabel,
    projectTypeLabel: snap.scope.projectTypeLabel,
    digitalScore: submission.digitalPresenceAudit?.overallScore,
    digitalImpact: submission.digitalPresenceAudit?.impactEstimate,
    productionHeadline: submission.productionPackage?.headline,
  };
}
