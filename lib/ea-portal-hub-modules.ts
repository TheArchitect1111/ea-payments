export type EAPortalHubModule = {
  href: string;
  tag: string;
  title: string;
  description: string;
  variant?: 'pulse' | 'amplifi' | 'simplifi' | 'default';
};

export function getEAPortalHubModules(slug: string): EAPortalHubModule[] {
  const base = `/portal/${slug}`;

  return [
    {
      href: base,
      tag: 'Command Center',
      title: 'Client dashboard',
      description: 'Operational health, account status, and your latest share links.',
    },
    {
      href: `${base}/pulse`,
      tag: 'Pulse™',
      title: 'Visibility & intelligence',
      description: 'Scores, bottlenecks, capacity, and what needs attention — one calm view.',
      variant: 'pulse',
    },
    {
      href: `${base}/simplifi`,
      tag: 'Simplifi™',
      title: 'Capture & decide',
      description: 'Paste any URL, score the opportunity, and launch Magnifi automatically.',
      variant: 'simplifi',
    },
    {
      href: '/story/selena',
      tag: 'Magnifi™',
      title: 'Opportunity experience',
      description: 'Cinematic future-state story — demo Consider link for prospects.',
    },
    {
      href: `${base}/amplifi`,
      tag: 'Amplifi™',
      title: 'Amplify & share',
      description: 'Your amplification narrative, stats, and links to Magnifi experiences.',
      variant: 'amplifi',
    },
    {
      href: `${base}/updates`,
      tag: 'Update Hub',
      title: 'Activity feed',
      description: 'Captures, outreach, enhancements, and advisor updates in one timeline.',
    },
    {
      href: `${base}/documents`,
      tag: 'Documents',
      title: 'Document hub',
      description: 'Assessments, scorecards, and onboarding materials.',
    },
    {
      href: `${base}/events`,
      tag: 'Events',
      title: 'Upcoming events',
      description: 'Office hours, review calls, and scheduled touchpoints.',
    },
    {
      href: `${base}/resources`,
      tag: 'Resource library',
      title: 'Tools & templates',
      description: 'Magnifi templates, workspace links, and tester resources.',
    },
    {
      href: '/simplifi/capture',
      tag: 'Mobile capture',
      title: 'Simplifi capture',
      description: 'Phone-friendly capture flow with floating Capture now button.',
    },
    {
      href: '/amplify',
      tag: 'Mobile amplify',
      title: 'Amplifi share',
      description: 'Share Consider links and amplify opportunities from any device.',
    },
    {
      href: '/assessment',
      tag: 'Operational MRI™',
      title: 'Capacity assessment',
      description: 'Discover hidden friction, recovery opportunities, and next steps.',
    },
    {
      href: '/scorecard',
      tag: 'Lead magnet',
      title: 'Visibility scorecard',
      description: 'Download the Visibility Assessment Scorecard for your organization.',
    },
    {
      href: '/partners/login',
      tag: 'Partner network',
      title: 'Partner portal',
      description: 'Referrals, commissions, and marketplace resources for EA partners.',
    },
    {
      href: '/start',
      tag: 'Tester hub',
      title: 'Friend testing links',
      description: 'All capture, amplify, and demo URLs in one place for your team.',
    },
  ];
}
