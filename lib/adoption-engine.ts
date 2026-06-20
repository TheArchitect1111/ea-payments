import type { ProposalWithAssessment } from './airtable';

export type AdoptionLabel = 'Healthy' | 'At Risk' | 'Needs Attention';

export interface AdoptionFactor {
  name: string;
  detail: string;
  score: number;
  weight: number;
}

export interface AdoptionHealthResult {
  score: number;
  label: AdoptionLabel;
  factors: AdoptionFactor[];
  recommendation: string;
}

export function computeAdoptionHealth(
  proposal: ProposalWithAssessment
): AdoptionHealthResult {
  const factors: AdoptionFactor[] = [];

  const capacityFactor = scoreCapacity(proposal.capacityScore);
  factors.push(capacityFactor);

  const engagementFactor = scoreEngagement(proposal);
  factors.push(engagementFactor);

  const complexityFactor = scoreComplexity(proposal);
  factors.push(complexityFactor);

  const paymentFactor = scorePaymentReadiness(proposal);
  factors.push(paymentFactor);

  const weighted =
    factors.reduce((sum, f) => sum + f.score * f.weight, 0) /
    factors.reduce((sum, f) => sum + f.weight, 0);

  const score = Math.round(Math.max(0, Math.min(100, weighted)));
  const label: AdoptionLabel =
    score >= 70 ? 'Healthy' : score >= 45 ? 'At Risk' : 'Needs Attention';

  const recommendation =
    label === 'Healthy'
      ? 'Strong adoption signals — prioritize proof stories and quick wins in onboarding.'
      : label === 'At Risk'
        ? 'Schedule a Simplifi check-in at 30 days — visibility and training touchpoints recommended.'
        : 'High-touch onboarding required — guided tours, academy modules, and weekly adoption reviews.';

  return { score, label, factors, recommendation };
}

function scoreCapacity(capacityScore: number): AdoptionFactor {
  const normalized = Math.max(0, Math.min(100, capacityScore));
  return {
    name: 'Operational readiness',
    detail: `Capacity score ${capacityScore} — lower scores need more change-management support.`,
    score: normalized,
    weight: 0.35,
  };
}

function scoreEngagement(proposal: ProposalWithAssessment): AdoptionFactor {
  let score = 60;
  if (proposal.status === 'Approved & Paid' || proposal.status === 'Complete') score += 25;
  else if (proposal.status === 'Approved' || proposal.status === 'Sent') score += 15;
  else if (proposal.status === 'Discovery Call Requested') score += 10;
  else if (proposal.status === 'Rejected') score -= 20;

  if (proposal.paymentStatus === 'Paid') score += 10;

  return {
    name: 'Engagement momentum',
    detail: `Proposal status: ${proposal.status}${proposal.paymentStatus ? ` · Payment: ${proposal.paymentStatus}` : ''}.`,
    score: Math.max(0, Math.min(100, score)),
    weight: 0.25,
  };
}

function scoreComplexity(proposal: ProposalWithAssessment): AdoptionFactor {
  const challenges = proposal.operationalChallenges?.length ?? 0;
  const complexity = proposal.businessComplexity?.toLowerCase() ?? '';
  let score = 75 - challenges * 4;
  if (complexity.includes('high')) score -= 15;
  if (complexity.includes('low')) score += 10;

  return {
    name: 'Change complexity',
    detail: `${challenges} operational challenge${challenges !== 1 ? 's' : ''} flagged in assessment.`,
    score: Math.max(0, Math.min(100, score)),
    weight: 0.25,
  };
}

function scorePaymentReadiness(proposal: ProposalWithAssessment): AdoptionFactor {
  const fee = proposal.recommendedFee ?? 0;
  let score = 55;
  if (fee > 0 && fee <= 2500) score += 20;
  else if (fee <= 10000) score += 10;
  else if (fee > 25000) score -= 5;

  if (proposal.weeklyTimeRecovery >= 8) score += 10;

  return {
    name: 'ROI clarity',
    detail: `${proposal.weeklyTimeRecovery} hrs/week recovery · ${formatMoney(proposal.opportunityLow)}–${formatMoney(proposal.opportunityHigh)} opportunity.`,
    score: Math.max(0, Math.min(100, score)),
    weight: 0.15,
  };
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n);
}
