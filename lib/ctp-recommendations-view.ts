/**
 * Client-facing CTP Recommendations view — intake + discovery + production guidance.
 */
import { ctpClientTypeLabel } from '@/lib/ctp-client-type';
import type { CtpSubmission } from '@/lib/ctp-submissions';

export type CtpRecommendationItem = {
  id: string;
  title: string;
  detail: string;
  source: 'intake' | 'discovery' | 'production' | 'risk';
};

export type CtpRecommendationsView = {
  businessName: string;
  clientTypeLabel?: string;
  headline: string;
  summary: string;
  available: boolean;
  confidence?: number;
  opportunities: CtpRecommendationItem[];
  nextSteps: CtpRecommendationItem[];
  risks: CtpRecommendationItem[];
  discoveryRecommendations: CtpRecommendationItem[];
  productionFocus: CtpRecommendationItem[];
};

function asLines(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

export function buildCtpRecommendationsView(submission: CtpSubmission): CtpRecommendationsView {
  const intake = submission.intakeAnalysis;
  const clientTypeLabel = submission.clientType
    ? ctpClientTypeLabel(submission.clientType)
    : undefined;

  const opportunities = (intake?.opportunities ?? []).map((item, index) => ({
    id: `opp-${index}`,
    title: item.title,
    detail: item.detail,
    source: 'intake' as const,
  }));

  const nextSteps = (intake?.recommendedNextSteps ?? []).map((step, index) => ({
    id: `step-${index}`,
    title: step,
    detail: 'Recommended next move from intake analysis.',
    source: 'intake' as const,
  }));

  const risks = (intake?.risks ?? []).map((item, index) => ({
    id: `risk-${index}`,
    title: item.title,
    detail: item.detail,
    source: 'risk' as const,
  }));

  const discoveryRecommendations = asLines(submission.recommendations).map((line, index) => ({
    id: `disc-${index}`,
    title: line,
    detail: 'From your discovery synthesis.',
    source: 'discovery' as const,
  }));

  const productionFocus = (submission.productionPackage?.artifacts ?? []).map((artifact) => ({
    id: `prod-${artifact.id}`,
    title: artifact.title,
    detail: artifact.summary,
    source: 'production' as const,
  }));

  const available = Boolean(
    opportunities.length ||
      nextSteps.length ||
      discoveryRecommendations.length ||
      productionFocus.length ||
      intake?.summary,
  );

  const summary =
    intake?.summary ||
    submission.productionPackage?.summary ||
    'Recommendations will appear here as intake analysis and production complete.';

  return {
    businessName: submission.businessName,
    clientTypeLabel,
    headline: available
      ? `${submission.businessName} — Recommended path`
      : 'Recommendations preparing',
    summary,
    available,
    confidence: intake?.confidence,
    opportunities,
    nextSteps,
    risks,
    discoveryRecommendations,
    productionFocus,
  };
}
