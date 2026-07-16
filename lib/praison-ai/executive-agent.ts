/**
 * Executive Agent — coordinates workforce and produces final intelligence summary.
 */

import type {
  ExecutiveIntelligenceSummary,
  SpecialistAgentOutput,
  StructuredFinding,
  WorkforceAgentId,
} from './types';

export function mergeExecutiveSummary(
  businessName: string,
  outputs: Partial<Record<WorkforceAgentId, SpecialistAgentOutput>>,
): ExecutiveIntelligenceSummary {
  const collect = (key: 'opportunities' | 'risks' | 'findings'): StructuredFinding[] =>
    Object.values(outputs)
      .flatMap((o) => o?.[key === 'findings' ? 'findings' : key] ?? [])
      .slice(0, 12);

  const opportunities = collect('opportunities');
  const risks = collect('risks');
  const writer = outputs['executive-writer'];
  const research = outputs['research'];

  const recommendedActions = [
    ...(outputs['proposal-architect']?.recommendations ?? []),
    ...(outputs['portal-architect']?.recommendations ?? []),
    ...(writer?.recommendations ?? []),
  ].slice(0, 8);

  const confidences = Object.values(outputs)
    .map((o) => o?.confidence ?? 0)
    .filter((c) => c > 0);
  const confidence =
    confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0.5;

  const headline =
    writer?.findings?.[0]?.title ??
    research?.findings?.[0]?.title ??
    `Executive intelligence for ${businessName}`;

  const narrative =
    writer?.summary ??
    [
      research?.summary,
      outputs['website-auditor']?.summary,
      outputs['operations-analyst']?.summary,
    ]
      .filter(Boolean)
      .join('\n\n');

  return {
    headline,
    narrative,
    topOpportunities: opportunities.slice(0, 5),
    topRisks: risks.slice(0, 5),
    recommendedActions,
    confidence,
  };
}

export function buildPulseInsights(
  outputs: Partial<Record<WorkforceAgentId, SpecialistAgentOutput>>,
): string[] {
  const insights: string[] = [];
  const website = outputs['website-auditor'];
  const finance = outputs['financial-analyst'];
  const marketing = outputs['marketing-analyst'];
  const ops = outputs['operations-analyst'];
  const research = outputs['research'];

  if (website?.data?.overallScore != null && Number(website.data.overallScore) < 70) {
    insights.push('Website needs modernization.');
  } else if (/moderniz|outdated|refresh/i.test(website?.summary ?? '')) {
    insights.push('Website needs modernization.');
  }

  if (/manual invoic|spreadsheet|paper/i.test(finance?.summary ?? '')) {
    insights.push('Manual invoicing detected.');
  }
  if (/no online payment|missing payment|no payment/i.test(finance?.summary ?? '')) {
    insights.push('No online payment system.');
  }
  if (/inconsistent|off-brand|messaging/i.test(marketing?.summary ?? '')) {
    insights.push('Brand messaging inconsistent.');
  }
  if (/manual|bottleneck|repetitive|highly manual/i.test(ops?.summary ?? '')) {
    insights.push('Operations highly manual.');
  }
  if (research?.confidence != null && research.confidence >= 0.9) {
    insights.push(`Research confidence ${Math.round(research.confidence * 100)}%.`);
  }

  return insights.slice(0, 6);
}
