import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { analyzeAssessment, OPERATIONAL_CHALLENGES } from '@/lib/analysis-engine';
import type { RevenueRange, Complexity } from '@/lib/analysis-engine';
import { calculateFee } from '@/lib/pricing-engine';
import { createAssessmentRecord, createProposalRecord } from '@/lib/airtable';
import { sendAssessmentAdminNotification } from '@/lib/email';

function mapTeamSize(label: string): number {
  const map: Record<string, number> = {
    'Just me':             1,
    '2-5 people':          3,
    '6-15 people':         10,
    '16-50 people':        33,
    'More than 50 people': 65,
  };
  return map[label] ?? 1;
}

function mapRevenueRange(label: string): RevenueRange {
  const map: Record<string, RevenueRange> = {
    'Under $100k':    'under_100k',
    '$100k to $500k': '100k_500k',
    '$500k to $1M':   '500k_1m',
    '$1M to $5M':     '1m_5m',
    'More than $5M':  '5m_plus',
  };
  return map[label] ?? 'under_100k';
}

function mapComplexity(label: string): Complexity {
  const map: Record<string, Complexity> = {
    Low:    'low',
    Medium: 'medium',
    High:   'high',
  };
  return map[label] ?? 'medium';
}

// Accepts challenge IDs (from the redesigned form) or legacy labels.
// Falls back to the input value so IDs pass through unchanged.
function mapChallengeLabelsToIds(labels: string[]): string[] {
  return labels.map((label) => {
    const found = OPERATIONAL_CHALLENGES.find((c) => c.label === label);
    return found?.id ?? label;
  });
}

// ---------------------------------------------------------------------------
// Scope derivation (replaces the removed prospect-facing Scope section)
// ---------------------------------------------------------------------------

function deriveWorkflowCount(teamSizeLabel: string): number {
  const map: Record<string, number> = {
    'Just me':             1,
    '2-5 people':          2,
    '6-15 people':         4,
    '16-50 people':        6,
    'More than 50 people': 9,
  };
  return map[teamSizeLabel] ?? 1;
}

function deriveUserCount(teamSizeLabel: string): number {
  const map: Record<string, number> = {
    'Just me':             1,
    '2-5 people':          3,
    '6-15 people':         10,
    '16-50 people':        33,
    'More than 50 people': 65,
  };
  return map[teamSizeLabel] ?? 1;
}

function deriveDashboardRequired(teamSizeLabel: string): boolean {
  return ['6-15 people', '16-50 people', 'More than 50 people'].includes(teamSizeLabel);
}

function derivePortalRequired(teamSizeLabel: string): boolean {
  return ['16-50 people', 'More than 50 people'].includes(teamSizeLabel);
}

function deriveComplexity(revenueRange: string): string {
  if (revenueRange === 'Under $100k' || revenueRange === '$100k to $500k') return 'Low';
  if (revenueRange === '$500k to $1M') return 'Medium';
  return 'High';
}

// Count comma-separated tools in the currentSystems string (capped at 8).
// The form joins the multi-select array with ', ' before sending.
function deriveSystemsCount(currentSystems: string): number {
  if (!currentSystems.trim()) return 0;
  const count = currentSystems.split(',').filter((s) => s.trim().length > 0).length;
  return Math.min(count, 8);
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const rawText = await req.text();
  console.log('[assessment/submit] raw body:', rawText);

  // Outer catch ensures the client always receives JSON, never an HTML error page.
  try {
    let body: Record<string, unknown>;
    try {
      body = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : {};
    } catch (err) {
      console.error('[assessment/submit] failed to parse body:', err);
      return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
    }

    console.log('[assessment/submit] parsed body:', JSON.stringify(body));

    const businessName   = String(body.businessName ?? '').trim();
    const contactName    = String(body.contactName ?? '').trim();
    const email          = String(body.email ?? '').trim();
    const teamSizeLabel  = String(body.teamSizeLabel ?? '');
    const revenueRange   = String(body.revenueRange ?? '');
    const currentSystems = String(body.currentSystems ?? '').trim();
    const operationalChallenges = Array.isArray(body.operationalChallenges)
      ? (body.operationalChallenges as string[])
      : [];
    const growthGoals         = String(body.growthGoals ?? '').trim();
    const capacityConstraints = String(body.capacityConstraints ?? '').trim();

    if (!businessName || !contactName || !email || !teamSizeLabel || !revenueRange) {
      return NextResponse.json(
        { ok: false, error: 'Required fields are missing.' },
        { status: 400 }
      );
    }

    // Derive all scope values from the prospect's answers.
    const teamSize           = mapTeamSize(teamSizeLabel);
    const workflowCount      = deriveWorkflowCount(teamSizeLabel);
    const userCount          = deriveUserCount(teamSizeLabel);
    const dashboardRequired  = deriveDashboardRequired(teamSizeLabel);
    const portalRequired     = derivePortalRequired(teamSizeLabel);
    const businessComplexity = deriveComplexity(revenueRange);
    const systemsCount       = deriveSystemsCount(currentSystems);
    const integrationCount   = systemsCount;

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
      automationCount: 0,
      integrationCount,
      dashboardRequired,
      portalRequired,
      userCount,
    });

    const assessmentId = `ASSESS-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const proposalId   = `PROP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const proposalResult = await createProposalRecord({
      proposalId,
      businessName,
      contactName,
      email,
      status: 'Pending Review',
      recommendedProjectType: analysis.recommendedProjectType,
      projectTypeLabel:       pricing.projectTypeLabel,
      capacityScore:          analysis.capacityScore,
      scoreBand:              analysis.scoreBand,
      primaryConstraint:      analysis.primaryConstraint,
      weeklyTimeRecovery:     analysis.weeklyTimeRecovery,
      opportunityLow:         analysis.opportunityLow,
      opportunityHigh:        analysis.opportunityHigh,
      rawFee:                 pricing.rawFee,
      recommendedFee:         pricing.recommendedFee,
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
      automationCount: 0,
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
        automationCount: 0,
        integrationCount,
        dashboardRequired,
        portalRequired,
        userCount,
        businessComplexity,
        capacityScore:          analysis.capacityScore,
        scoreBand:              analysis.scoreBand,
        primaryConstraint:      analysis.primaryConstraint,
        weeklyTimeRecovery:     analysis.weeklyTimeRecovery,
        opportunityLow:         analysis.opportunityLow,
        opportunityHigh:        analysis.opportunityHigh,
        recommendedProjectType: analysis.recommendedProjectType,
        projectTypeLabel:       pricing.projectTypeLabel,
        rawFee:                 pricing.rawFee,
        recommendedFee:         pricing.recommendedFee,
        assessmentRecordId:     assessmentResult.recordId,
        proposalRecordId:       proposalResult.recordId,
      });
    } catch (err) {
      console.error('Assessment admin notification error:', err);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(
      'Assessment submit unhandled error:',
      err instanceof Error ? err.stack ?? err.message : err
    );
    return NextResponse.json(
      { ok: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
