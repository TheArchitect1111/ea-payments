/**
 * QA Agent — nothing leaves the workforce until QA passes.
 */

import type {
  ExecutiveIntelligencePackage,
  QaReport,
  SpecialistAgentOutput,
  WorkforceAgentId,
} from './types';

export function runQaValidation(
  outputs: Partial<Record<WorkforceAgentId, SpecialistAgentOutput>>,
  partial?: Partial<ExecutiveIntelligencePackage>,
): QaReport {
  const checks: QaReport['checks'] = [];
  const blockers: string[] = [];

  const required: WorkforceAgentId[] = [
    'research',
    'website-auditor',
    'operations-analyst',
    'financial-analyst',
    'marketing-analyst',
    'proposal-architect',
    'portal-architect',
    'executive-writer',
  ];

  for (const id of required) {
    const out = outputs[id];
    const hasSummary = Boolean(out?.summary?.trim());
    checks.push({
      id: `section-${id}`,
      label: `${id} summary present`,
      passed: hasSummary,
      detail: hasSummary ? undefined : 'Missing or empty summary',
    });
    if (!hasSummary) blockers.push(`${id} did not produce a summary.`);
  }

  const proposal = outputs['proposal-architect'];
  const pricingNotes = String(proposal?.data?.pricingNotes ?? proposal?.recommendations?.join(' ') ?? '');
  const hasPricing = /pricing|investment|\$|fee|timeline/i.test(pricingNotes);
  checks.push({
    id: 'pricing-consistency',
    label: 'Proposal includes pricing or investment guidance',
    passed: hasPricing,
  });

  const avgConfidence =
    required.reduce((sum, id) => sum + (outputs[id]?.confidence ?? 0), 0) / required.length;
  checks.push({
    id: 'confidence-floor',
    label: 'Average research confidence ≥ 0.45',
    passed: avgConfidence >= 0.45,
    detail: `Average: ${avgConfidence.toFixed(2)}`,
  });

  const writer = outputs['executive-writer'];
  const writingOk = Boolean(writer?.summary && writer.summary.length >= 80);
  checks.push({
    id: 'writing-quality',
    label: 'Executive narrative sufficient length',
    passed: writingOk,
  });
  if (!writingOk) blockers.push('Executive writer output is too thin.');

  const hallucinationRisk = required.some((id) => {
    const ev = outputs[id]?.evidence?.length ?? 0;
    const conf = outputs[id]?.confidence ?? 0;
    return conf > 0.85 && ev === 0;
  });
  checks.push({
    id: 'evidence-hallucination',
    label: 'High-confidence outputs cite evidence',
    passed: !hallucinationRisk,
  });
  if (hallucinationRisk) blockers.push('One or more agents reported high confidence without evidence.');

  if (partial?.executiveSummary && !partial.executiveSummary.headline?.trim()) {
    blockers.push('Executive summary headline missing.');
  }

  const passed = blockers.length === 0 && checks.filter((c) => !c.passed).length <= 1;

  return {
    agentId: 'qa',
    passed,
    checks,
    blockers,
    confidence: passed ? Math.min(0.95, avgConfidence + 0.1) : avgConfidence * 0.5,
    reviewedAt: new Date().toISOString(),
  };
}
