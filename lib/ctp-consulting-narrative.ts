/**
 * Shared Consider The Possibilities consulting narrative for email + portal.
 * Keep language continuous across confirmation email and branded portal home.
 */
import type { CtpSubmission } from '@/lib/ctp-submissions';

export type ConsultingLearnedCard = {
  id: string;
  title: string;
  observation: string;
  whyItMatters: string;
  potentialImpact: string;
};

export type ConsultingBeginCard = {
  id: string;
  title: string;
  purpose: string;
  estimatedBuildTime: string;
};

export type ConsultingJourneyStep = {
  id: string;
  label: string;
  state: 'complete' | 'active' | 'pending';
};

export type ConsultingMeaningMetrics = {
  annualOpportunityLabel: string;
  timeSavingsLabel: string;
  businessImpactLabel: string;
  investLow: number;
  investHigh: number;
};

function money(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(n)));
}

export function moneyRangeLabel(low: number, high: number): string {
  return `${money(low)}-${money(high)}`;
}

export function consultingLearnedCards(): ConsultingLearnedCard[] {
  return [
    {
      id: 'first-impression',
      title: 'First Impression',
      observation: 'First impressions could be stronger.',
      whyItMatters: 'Create greater confidence with visitors and potential customers.',
      potentialImpact: 'Stronger trust in the first few seconds of every visit.',
    },
    {
      id: 'communication',
      title: 'Communication',
      observation: 'Your story could be communicated more clearly.',
      whyItMatters: 'Help people quickly understand your value and what makes your organization unique.',
      potentialImpact: 'Clearer messaging that converts interest into conversations.',
    },
    {
      id: 'customer-experience',
      title: 'Customer Experience',
      observation: 'Customer interactions could be simplified.',
      whyItMatters: 'Make it easier for people to contact you, schedule appointments, or become customers.',
      potentialImpact: 'Fewer dropped leads and smoother next steps.',
    },
    {
      id: 'business-operations',
      title: 'Business Operations',
      observation: 'Everyday work could become more organized.',
      whyItMatters: 'Reduce unnecessary administrative effort so your team can focus on what matters most.',
      potentialImpact: 'Hours returned each week to leadership and delivery.',
    },
  ];
}

export function consultingBeginCards(): ConsultingBeginCard[] {
  return [
    {
      id: 'website',
      title: 'Story-Driven Website',
      purpose: 'A clear, beautiful presence that explains who you are and why people should choose you.',
      estimatedBuildTime: '10-18 hrs',
    },
    {
      id: 'portal',
      title: 'Client Management Portal',
      purpose: 'A private place for progress, documents, updates, and ongoing collaboration.',
      estimatedBuildTime: '8-14 hrs',
    },
    {
      id: 'engagement',
      title: 'Customer Engagement Tools',
      purpose: 'Simple ways for people to reach you, book time, and move forward.',
      estimatedBuildTime: '4-8 hrs',
    },
    {
      id: 'launch',
      title: 'Launch & Optimization',
      purpose: 'A careful launch with refinements so the experience performs from day one.',
      estimatedBuildTime: '6-10 hrs',
    },
  ];
}

export function consultingMeaningFromSubmission(submission: CtpSubmission): ConsultingMeaningMetrics {
  const draft = submission.executiveEmailDraft;
  const snap = submission.executiveSnapshot;
  const opportunityLow = draft?.opportunityLow ?? snap?.annualOpportunityLow ?? 30000;
  const opportunityHigh = draft?.opportunityHigh ?? snap?.annualOpportunityHigh ?? 80000;
  const weekly = draft?.weeklyTimeRecovery ?? snap?.weeklyHoursRecoverable ?? 8;
  const investLow = draft?.investmentLow ?? Math.round((draft?.recommendedFee ?? snap?.scope.investmentLow ?? 1497) * 0.9);
  const investHigh =
    draft?.investmentHigh ??
    Math.round((draft?.recommendedFee ?? snap?.scope.investmentHigh ?? 4995) * 1.05);

  const annualLow = Math.max(30000, opportunityLow);
  const annualHigh = Math.max(annualLow + 10000, opportunityHigh);

  return {
    annualOpportunityLabel: `${moneyRangeLabel(annualLow, annualHigh)}+`,
    timeSavingsLabel: `${Math.max(3, Math.round(weekly * 0.5))}-${Math.max(8, weekly)} hours each week`,
    businessImpactLabel: 'Clearer customer journeys, stronger presence, and less administrative drag.',
    investLow: Math.max(1497, investLow),
    investHigh: Math.max(4995, investHigh),
  };
}

export function consultingCurrentStage(submission: CtpSubmission): string {
  if (submission.status === 'Completed') return 'Project Complete';
  if (submission.status === 'Ready For Review' || submission.studioStatus === 'Ready For Review') {
    return 'Ready for Project Proposal';
  }
  if (submission.workspaceStatus === 'Active') return 'Discovery In Progress';
  if (submission.workspaceStatus === 'Provisioning') return 'Opening Your Workspace';
  return 'Initial Review Complete';
}

export function consultingPrimaryOpportunity(submission: CtpSubmission): string {
  const fromSnap = submission.executiveSnapshot?.primaryConstraint?.trim();
  if (fromSnap) return fromSnap;
  const fromDraft = submission.executiveEmailDraft?.primaryConstraint?.trim();
  if (fromDraft) return fromDraft;
  return 'Stronger first impressions and clearer customer journeys';
}

export function consultingRecommendedSolution(submission: CtpSubmission): string {
  return (
    submission.executiveEmailDraft?.projectTypeLabel ||
    submission.executiveSnapshot?.scope.projectTypeLabel ||
    'Story-Driven Website + Client Management Portal'
  );
}

export function consultingTimeline(submission: CtpSubmission): string {
  return (
    submission.executiveEmailDraft?.timelineLabel ||
    submission.executiveSnapshot?.scope.timelineLabel ||
    '3-5 weeks to first live presence'
  );
}

export function consultingJourneySteps(submission: CtpSubmission): ConsultingJourneyStep[] {
  const discoveryActive =
    submission.workspaceStatus === 'Active' ||
    submission.workspaceStatus === 'Provisioning' ||
    submission.studioStatus === 'In Progress';
  const proposalReady =
    submission.status === 'Ready For Review' || submission.studioStatus === 'Ready For Review';
  const completed = submission.status === 'Completed';

  const mark = (complete: boolean, active: boolean): ConsultingJourneyStep['state'] => {
    if (complete) return 'complete';
    if (active) return 'active';
    return 'pending';
  };

  return [
    { id: 'questionnaire', label: 'Questionnaire Received', state: 'complete' },
    { id: 'review', label: 'Initial Review Complete', state: 'complete' },
    {
      id: 'discovery',
      label: 'Discovery In Progress',
      state: mark(proposalReady || completed, discoveryActive && !proposalReady && !completed),
    },
    {
      id: 'proposal',
      label: 'Project Proposal',
      state: mark(completed, proposalReady && !completed),
    },
    { id: 'approval', label: 'Approval', state: mark(completed, false) },
    { id: 'design', label: 'Design', state: mark(completed, false) },
    { id: 'development', label: 'Development', state: mark(completed, false) },
    { id: 'launch', label: 'Launch', state: mark(completed, false) },
  ];
}
