import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { analyzeAssessment, OPERATIONAL_CHALLENGES } from '@/lib/analysis-engine';
import type { RevenueRange, Complexity } from '@/lib/analysis-engine';
import { calculateFee } from '@/lib/pricing-engine';
import { createAssessmentRecord, createProposalRecord } from '@/lib/airtable';
import { sendAssessmentAdminNotification } from '@/lib/email';

function mapRevenueRange(label: string): RevenueRange {
  const map: Record<string, RevenueRange> = {
    'Under $100k': 'under_100k',
    '$100k-$500k': '100k_500k',
    '$500k-$1M': '500k_1m',
    '$1M-$5M': '1m_5m',
    '$5M+': '5m_plus',
  };
  return map[label] ?? 'under_100k';
}

function mapComplexity(label: string): Complexity {
  const map: Record<string, Complexity> = {
    Low: 'low',
    Medium: 'medium',
    High: 'high',
  };
  return map[label] ?? 'medium';
}

function mapChallengeLabelsToIds(labels: string[]): string[] {
  return labels.map((label) => {
    const found = OPERATIONAL_CHALLENGES.find((c) => c.label === label);
    return found?.id ?? label;
  });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const businessName = String(body.businessName ?? '').trim();
  const contactName = String(body.contactName ?? '').trim();
  const email = String(body.email ?? '').trim();
  const teamSize = Math.max(1, Number(body.teamSize ?? 1));
  const revenueRange = String(body.revenueRange ?? '');
  const currentSystems = String(body.currentSystems ?? '').trim();
  const systemsCount = Math.max(0, Number(body.systemsCount ?? 0));
  const operationalChallenges = Array.isArray(body.operationalChallenges)
    ? (body.operationalChallenges as string[])
    : [];
  const growthGoals = String(body.growthGoals ?? '').trim();
  const capacityConstraints = String(body.capacityConstraints ?? '').trim();
  const workflowCount = Math.max(0, Number(body.workflowCount ?? 0));
  const automationCount = Math.max(0, Number(body.automationCount ?? 0));
  const integrationCount = Math.max(0, Number(body.integrationCount ?? 0));
  const dashboardRequired = Boolean(body.dashboardRequired);
  const portalRequired = Boolean(body.portalRequired);
  const userCount = Math.max(0, Number(body.userCount ?? 0));
  const businessComplexity = String(body.businessComplexity ?? '');

  if (!businessName || !contactName || !email || !revenueRange || !businessComplexity) {
    return NextResponse.json({ error: 'Required fields are missing.' }, { status: 400 });
  }

  const challengeIds = mapChallengeLabelsToIds(operationalChallenges);

  const analysis = analyzeAssessment({
    teamSize,
    revenueRange: mapRevenueRange(revenueRange),
    systemsCount,
    operationalChallenges: challengeIds,
    complexity: mapComplexity(businessComplexity),
  });

  const pricing = calculateFee({
    projectType: analysis.recommendedProjectType,
    workflowCount,
    automationCount,
    integrationCount,
    dashboardRequired,
    portalRequired,
    userCount,
  });

  const assessmentId = `ASSESS-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const proposalId = `PROP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  const proposalResult = await createProposalRecord({
    proposalId,
    businessName,
    contactName,
    email,
    status: 'Pending Review',
    recommendedProjectType: analysis.recommendedProjectType,
    projectTypeLabel: pricing.projectTypeLabel,
    capacityScore: analysis.capacityScore,
    scoreBand: analysis.scoreBand,
    primaryConstraint: analysis.primaryConstraint,
    weeklyTimeRecovery: analysis.weeklyTimeRecovery,
    opportunityLow: analysis.opportunityLow,
    opportunityHigh: analysis.opportunityHigh,
    rawFee: pricing.rawFee,
    recommendedFee: pricing.recommendedFee,
  });

  const assessmentResult = await createAssessmentRecord({
    assessmentId,
    businessName,
    contactName,
    email,
    teamSize,
    revenueRange,
    currentSystems,
    systemsCount,
    operationalChallenges,
    growthGoals,
    capacityConstraints,
    workflowCount,
    automationCount,
    integrationCount,
    dashboardRequired,
    portalRequired,
    userCount,
    businessComplexity,
    linkedProposalId: proposalResult.recordId,
  });

  if (!assessmentResult.ok) {
    console.error('Assessment write failed:', assessmentResult.error);
  }
  if (!proposalResult.ok) {
    console.error('Proposal write failed:', proposalResult.error);
  }

  try {
    await sendAssessmentAdminNotification({
      businessName,
      contactName,
      email,
      teamSize,
      revenueRange,
      operationalChallenges,
      workflowCount,
      automationCount,
      integrationCount,
      dashboardRequired,
      portalRequired,
      userCount,
      businessComplexity,
      capacityScore: analysis.capacityScore,
      scoreBand: analysis.scoreBand,
      primaryConstraint: analysis.primaryConstraint,
      weeklyTimeRecovery: analysis.weeklyTimeRecovery,
      opportunityLow: analysis.opportunityLow,
      opportunityHigh: analysis.opportunityHigh,
      recommendedProjectType: analysis.recommendedProjectType,
      projectTypeLabel: pricing.projectTypeLabel,
      rawFee: pricing.rawFee,
      recommendedFee: pricing.recommendedFee,
      assessmentRecordId: assessmentResult.recordId,
      proposalRecordId: proposalResult.recordId,
    });
  } catch (err) {
    console.error('Assessment admin notification error:', err);
  }

  return NextResponse.json({ ok: true });
}
