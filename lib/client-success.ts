import type { PortalClientRecord } from './airtable';
import { getLatestProposalByEmail } from './airtable';
import { computeAdoptionHealth } from './adoption-engine';

export interface ClientSuccessScore {
  id: string;
  label: string;
  value: number;
  max: number;
  detail: string;
  trend?: 'up' | 'steady' | 'down';
}

export interface ClientSuccessProfile {
  scores: ClientSuccessScore[];
  operationalHealth: number;
  healthLabel: 'Strong' | 'On Track' | 'Needs Focus';
  summary: string;
  proposalId?: string;
}

function onboardingEngagementScore(status?: string): number {
  switch (status) {
    case 'Complete':
      return 95;
    case 'Docs Signed':
      return 85;
    case 'Docs Sent':
      return 70;
    case 'In Progress':
      return 55;
    case 'Not Started':
    default:
      return 40;
  }
}

function trainingCompletionScore(
  packagePurchased: string,
  onboardingStatus?: string,
): number {
  if (onboardingStatus === 'Complete') return 100;
  if (packagePurchased === 'Simplifi') {
    if (onboardingStatus === 'Docs Signed') return 60;
    if (onboardingStatus === 'In Progress') return 35;
    return 15;
  }
  if (onboardingStatus === 'Docs Signed') return 45;
  if (onboardingStatus === 'In Progress') return 25;
  return 10;
}

function portalActivityScore(portalAccessStatus: string, passwordChanged: boolean): number {
  let score = portalAccessStatus === 'Active' ? 50 : 25;
  if (passwordChanged) score += 25;
  return Math.min(100, score);
}

export async function getClientSuccessProfile(
  client: PortalClientRecord,
): Promise<ClientSuccessProfile> {
  const proposal = await getLatestProposalByEmail(client.email);

  const capacityScore = proposal?.capacityScore ?? 0;
  const adoption = proposal ? computeAdoptionHealth(proposal) : null;
  const engagementFromProposal = adoption
    ? adoption.factors.find((f) => f.name === 'Engagement momentum')?.score
    : undefined;

  const engagementScore = Math.round(
    engagementFromProposal !== undefined
      ? (engagementFromProposal * 0.6 + onboardingEngagementScore(client.onboardingStatus) * 0.4)
      : portalActivityScore(client.portalAccessStatus, client.passwordChanged),
  );

  const trainingScore = trainingCompletionScore(
    client.packagePurchased,
    client.onboardingStatus,
  );

  const operationalHealth = Math.round(
    capacityScore * 0.35 +
      engagementScore * 0.3 +
      trainingScore * 0.2 +
      portalActivityScore(client.portalAccessStatus, client.passwordChanged) * 0.15,
  );

  const healthLabel: ClientSuccessProfile['healthLabel'] =
    operationalHealth >= 70 ? 'Strong' : operationalHealth >= 45 ? 'On Track' : 'Needs Focus';

  const scores: ClientSuccessScore[] = [
    {
      id: 'capacity',
      label: 'Capacity Score',
      value: capacityScore,
      max: 100,
      detail: proposal
        ? `Baseline from your ${proposal.scoreBand || 'capacity'} assessment.`
        : 'Complete a capacity assessment to unlock your baseline score.',
      trend: capacityScore >= 60 ? 'up' : capacityScore >= 40 ? 'steady' : 'down',
    },
    {
      id: 'engagement',
      label: 'Engagement Score',
      value: engagementScore,
      max: 100,
      detail: client.onboardingStatus
        ? `Onboarding: ${client.onboardingStatus}. Portal activity included.`
        : 'Engagement reflects portal access and onboarding progress.',
      trend: engagementScore >= 65 ? 'up' : engagementScore >= 45 ? 'steady' : 'down',
    },
    {
      id: 'training',
      label: 'Training Completion',
      value: trainingScore,
      max: 100,
      detail:
        client.packagePurchased === 'Simplifi'
          ? 'Tracks Simplifi workspace and academy progress.'
          : 'Training modules unlock as your engagement progresses.',
      trend: trainingScore >= 50 ? 'up' : 'steady',
    },
    {
      id: 'health',
      label: 'Operational Health',
      value: operationalHealth,
      max: 100,
      detail: 'Composite view of capacity, engagement, training, and portal activity.',
      trend: operationalHealth >= 65 ? 'up' : operationalHealth >= 45 ? 'steady' : 'down',
    },
  ];

  const summary =
    healthLabel === 'Strong'
      ? 'You are building momentum. Pulse tracks progress so you always know what changed.'
      : healthLabel === 'On Track'
        ? 'Solid foundation. Complete onboarding steps and training to raise your scores.'
        : 'Focus on onboarding and your first training modules to unlock capacity gains.';

  return {
    scores,
    operationalHealth,
    healthLabel,
    summary,
    proposalId: proposal?.proposalId,
  };
}
