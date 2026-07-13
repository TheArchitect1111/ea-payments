import type { EAGuideAction } from '@/lib/ea-guide';
import type { AdvisorBriefModel } from './types';

export type PortalLiveSignals = {
  kind: 'portal';
  slug: string;
  captureCount: number;
  opportunityCount: number;
};

export type UpdateHubLiveSignals = {
  kind: 'update-hub';
  slug: string;
  requestCount: number;
};

export type AdminLaunchSignal = {
  launchId: string;
  client: string;
  message: string;
  status: string;
  statusLabel: string;
  links: {
    reviewPackage: string;
    projectBrief: string;
    skinBrief: string;
    approval: string;
    codexBuilder: string;
    deployment: string;
  };
};

export type AdminLiveSignals = {
  kind: 'admin';
  launch: AdminLaunchSignal | null;
};

export type LiveBriefSignals = PortalLiveSignals | UpdateHubLiveSignals | AdminLiveSignals;

export function applyLiveSignals(brief: AdvisorBriefModel, signals: LiveBriefSignals | null): AdvisorBriefModel {
  if (!signals) return brief;

  if (signals.kind === 'portal') {
    return applyPortalSignals(brief, signals);
  }
  if (signals.kind === 'update-hub') {
    return applyUpdateHubSignals(brief, signals);
  }
  if (signals.kind === 'admin') {
    return applyAdminSignals(brief, signals);
  }

  return brief;
}

function applyPortalSignals(brief: AdvisorBriefModel, signals: PortalLiveSignals): AdvisorBriefModel {
  const base = `/portal/${signals.slug}`;
  const today: string[] = [];
  let recommendation = brief.recommendation;
  let recommendationDetail = brief.recommendationDetail;
  let whyBullets = [...brief.whyBullets];
  let primaryAction: EAGuideAction | undefined = brief.primaryAction;
  let secondaryAction: EAGuideAction | undefined = brief.secondaryAction;
  let needsAttention = brief.needsAttention;

  today.push(`${signals.captureCount} capture${signals.captureCount === 1 ? '' : 's'} in your workspace`);
  today.push(`${signals.opportunityCount} opportunit${signals.opportunityCount === 1 ? 'y' : 'ies'} ready to advance`);

  if (signals.captureCount === 0) {
    recommendation = 'Capture your first opportunity.';
    recommendationDetail = 'Simplifi analyzes in the background — Magnifi builds automatically.';
    whyBullets = [
      'Your portal is active but no captures are saved yet.',
      'One capture gives Pulse something meaningful to track.',
      'Magnifi can turn a strong capture into a shareable story.',
    ];
    primaryAction = { id: 'first-capture', label: 'Capture now', kind: 'href', href: '/capture' };
    secondaryAction = { id: 'simplifi', label: 'Open Simplifi', kind: 'href', href: `${base}/simplifi` };
    needsAttention = true;
  } else if (signals.opportunityCount > 0) {
    recommendation = 'Share your Magnifi story.';
    recommendationDetail = `${signals.opportunityCount} opportunity experience${signals.opportunityCount === 1 ? ' is' : 's are'} ready in Pulse.`;
    whyBullets = [
      `${signals.opportunityCount} opportunit${signals.opportunityCount === 1 ? 'y has' : 'ies have'} a story path.`,
      'Sharing creates momentum while interest is fresh.',
      'Amplifi can publish from the same workspace.',
    ];
    primaryAction = { id: 'amplifi', label: 'Open Amplifi', kind: 'href', href: `${base}/amplifi` };
    secondaryAction = { id: 'pulse', label: 'Review in Pulse', kind: 'href', href: `${base}/pulse` };
    needsAttention = true;
  } else {
    recommendation = 'Review your latest captures.';
    recommendationDetail = `${signals.captureCount} capture${signals.captureCount === 1 ? '' : 's'} are waiting for the next step.`;
    whyBullets = [
      'Saved captures should move toward understanding and action.',
      'Magnifi can turn the strongest capture into a story.',
      'Pulse tracks what advances this week.',
    ];
    primaryAction = { id: 'simplifi', label: 'Open Simplifi', kind: 'href', href: `${base}/simplifi` };
    secondaryAction = { id: 'dashboard', label: 'Open Dashboard', kind: 'href', href: base };
  }

  return {
    ...brief,
    recommendation,
    recommendationDetail,
    whyBullets,
    primaryAction,
    secondaryAction,
    needsAttention,
    details: {
      ...brief.details,
      today,
      organization: [
        `Captures: ${signals.captureCount}`,
        `Opportunities: ${signals.opportunityCount}`,
        ...brief.details.organization.slice(0, 1),
      ],
    },
  };
}

function applyUpdateHubSignals(brief: AdvisorBriefModel, signals: UpdateHubLiveSignals): AdvisorBriefModel {
  const base = `/portal/${signals.slug}/updates`;
  if (signals.requestCount > 0) {
    return {
      ...brief,
      recommendation: 'Review pending updates.',
      recommendationDetail: `${signals.requestCount} update request${signals.requestCount === 1 ? '' : 's'} may need your attention.`,
      whyBullets: [
        'Timely updates reduce stakeholder confusion.',
        'Pending requests should be resolved before new work starts.',
        'Clear status language improves trust.',
      ],
      primaryAction: { id: 'review-updates', label: 'Review Updates', kind: 'href', href: base },
      secondaryAction: { id: 'create-update', label: 'Create Update', kind: 'href', href: `${base}/new` },
      needsAttention: true,
      details: {
        ...brief.details,
        today: [`${signals.requestCount} update request${signals.requestCount === 1 ? '' : 's'} open`, ...brief.details.today],
      },
    };
  }

  return {
    ...brief,
    recommendation: 'Publish your first update.',
    recommendationDetail: 'A short, specific status update helps your team track progress.',
    whyBullets: [
      'No updates have been published yet.',
      'The first update sets the communication rhythm.',
      'Stakeholders stay aligned when status is visible.',
    ],
    primaryAction: { id: 'create-update', label: 'Create first update', kind: 'href', href: `${base}/new` },
    secondaryAction: { id: 'updates-home', label: 'Open Update Hub', kind: 'href', href: base },
    needsAttention: true,
    details: {
      ...brief.details,
      today: ['No updates published yet', ...brief.details.today],
    },
  };
}

function applyAdminSignals(brief: AdvisorBriefModel, signals: AdminLiveSignals): AdvisorBriefModel {
  const launch = signals.launch;
  if (!launch) return brief;

  const actions: EAGuideAction[] = [
    { id: 'review-package', label: 'Review Package', kind: 'href', href: launch.links.reviewPackage },
    { id: 'approval', label: 'Continue To Approval', kind: 'href', href: launch.links.approval },
    { id: 'skin-brief', label: 'Open Skin Brief', kind: 'href', href: launch.links.skinBrief },
    { id: 'project-brief', label: 'Open Project Brief', kind: 'href', href: launch.links.projectBrief },
  ];

  return {
    ...brief,
    recommendation: launch.message,
    recommendationDetail: `${launch.client} is ${launch.statusLabel.toLowerCase()}.`,
    whyBullets: [
      'An active launch needs review in Mission Control.',
      'Approval is the next dependency before build continues.',
      'Project and skin briefs are ready for review.',
    ],
    primaryAction: actions[0],
    secondaryAction: actions[1],
    needsAttention: true,
    badgeLabel: 'Launch Active',
    details: {
      ...brief.details,
      today: [`Launch: ${launch.client}`, `Status: ${launch.statusLabel}`, ...brief.details.today.slice(0, 1)],
      organization: [`Active launch: ${launch.client}`, `Status: ${launch.statusLabel}`],
    },
  };
}
