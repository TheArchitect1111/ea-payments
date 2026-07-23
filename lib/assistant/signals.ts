import type { EAGuideAction } from '@/lib/ea-guide';
import type { AdvisorBriefModel } from './types';

export type PortalLiveSignals = {
  kind: 'portal';
  slug: string;
  captureCount: number;
  opportunityCount: number;
  /** When set, assistant follows Client Experience Guide language — not Simplifi capture. */
  experienceMode?: 'executive' | 'ctp';
  /** Current portal pathname so CTP briefs stay route-aware (not collapsed to /ctp only). */
  pathname?: string;
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

  if (signals.experienceMode === 'ctp') {
    return applyCtpClientSignals(brief, signals, base);
  }

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

/** Client Experience overlay — keep pathname brief; route-aware CTAs within this slug only. */
function applyCtpClientSignals(
  brief: AdvisorBriefModel,
  signals: PortalLiveSignals,
  base: string,
): AdvisorBriefModel {
  const pathname = signals.pathname || '';
  const actions = ctpClientActionsForPath(base, pathname);
  const pageHint = brief.situation?.trim() || brief.details.aboutPage?.trim();

  return {
    ...brief,
    recommendation: brief.needsAttention ? brief.recommendation : 'You’re in good hands.',
    recommendationDetail:
      brief.recommendationDetail?.trim() ||
      'Your Project always shows one clear next step. Nothing here requires capturing opportunities.',
    whyBullets: [
      pageHint || 'This is your private project home — calm, guided, and personal.',
      'When something needs you, Your Project will say so clearly.',
      'Need a person? Contact reaches your guide within one business day.',
    ].slice(0, 3),
    primaryAction: actions.primary,
    secondaryAction: actions.secondary,
    needsAttention: false,
    details: {
      ...brief.details,
      today: [
        brief.pageLabel
          ? `Here: ${brief.pageLabel}`
          : 'Guided project home · nothing urgent unless Your Project says so',
        ...brief.details.today.slice(0, 1),
      ],
      aboutPage: [brief.details.aboutPage, actions.aboutExtra].filter(Boolean).join('\n\n'),
      organization: ['Mode: Client Experience', ...brief.details.organization.slice(0, 1)],
    },
  };
}

function ctpClientActionsForPath(
  base: string,
  pathname: string,
): { primary: EAGuideAction; secondary: EAGuideAction; aboutExtra?: string } {
  const progress = `${base}/ctp/progress`;
  const documents = `${base}/ctp/documents`;
  const contact = `${base}/ctp/messages`;
  const help = `${base}/ctp/support`;
  const normalized = pathname.replace(/\/+$/, '') || '/';

  const onSegment = (segment: string) =>
    normalized.endsWith(segment) || normalized.includes(`${segment}/`);

  if (onSegment('/ctp/documents')) {
    return {
      primary: { id: 'your-project', label: 'Open Your Project', kind: 'href', href: progress },
      secondary: { id: 'contact', label: 'Contact your guide', kind: 'href', href: contact },
      aboutExtra: 'Documents holds materials we prepare for you.',
    };
  }
  if (onSegment('/ctp/messages')) {
    return {
      primary: { id: 'your-project', label: 'Open Your Project', kind: 'href', href: progress },
      secondary: { id: 'help', label: 'Open Help', kind: 'href', href: help },
      aboutExtra: 'Contact reaches your guide within one business day.',
    };
  }
  if (onSegment('/ctp/support')) {
    return {
      primary: { id: 'your-project', label: 'Open Your Project', kind: 'href', href: progress },
      secondary: { id: 'contact', label: 'Contact your guide', kind: 'href', href: contact },
      aboutExtra: 'Help has quick answers and a path to your guide.',
    };
  }
  if (normalized.endsWith('/ctp')) {
    return {
      primary: { id: 'your-project', label: 'Open Your Project', kind: 'href', href: progress },
      secondary: { id: 'help', label: 'Need a hand?', kind: 'href', href: help },
      aboutExtra: 'Journey is orientation — Your Project is home.',
    };
  }
  if (onSegment('/ctp/progress')) {
    return {
      primary: { id: 'help', label: 'Need a hand?', kind: 'href', href: help },
      secondary: { id: 'documents', label: 'Documents', kind: 'href', href: documents },
      aboutExtra: 'Your Project shows one clear next step for this stage.',
    };
  }

  // Client shell on any other path under this slug — stay in CX destinations only.
  return {
    primary: { id: 'your-project', label: 'Open Your Project', kind: 'href', href: progress },
    secondary: { id: 'help', label: 'Need a hand?', kind: 'href', href: help },
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
