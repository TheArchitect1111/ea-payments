export type EAPortalHubModule = {
  href: string;
  tag: string;
  title: string;
  description: string;
  variant?: 'pulse' | 'amplifi' | 'simplifi' | 'default';
  /** Shown only for demo-client or friend-testing tenants */
  demoOnly?: boolean;
};

const DEMO_SLUGS = new Set(['demo-client']);

export function isDemoPortalSlug(slug: string): boolean {
  return DEMO_SLUGS.has(slug);
}

function coreModules(base: string, slug: string): EAPortalHubModule[] {
  return [
    {
      href: base,
      tag: 'Dashboard',
      title: 'Your command view',
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
      href: `${base}/amplifi`,
      tag: 'Amplifi™',
      title: 'Amplify & share',
      description: 'Your amplification narrative, stats, and links to Magnifi experiences.',
      variant: 'amplifi',
    },
    {
      href: `${base}/updates`,
      tag: 'Update Hub™',
      title: 'Activity feed',
      description: 'Captures, outreach, enhancements, and advisor updates in one timeline.',
    },
    {
      href: `${base}/messaging`,
      tag: 'Communication',
      title: 'Messaging center',
      description: 'Direct messages with your EA advisor team.',
    },
    {
      href: `${base}/documents`,
      tag: 'Document Hub™',
      title: 'Document vault',
      description: 'Assessments, agreements, scorecards, and onboarding materials.',
    },
    {
      href: `${base}/learning`,
      tag: 'Training Hub™',
      title: 'Training & learning',
      description: 'Guides, modules, and resources for your transformation journey.',
    },
    {
      href: `${base}/events`,
      tag: 'Event Hub™',
      title: 'Upcoming events',
      description: 'Office hours, review calls, and scheduled touchpoints.',
    },
    {
      href: `${base}/resources`,
      tag: 'Resource library',
      title: 'Tools & templates',
      description: 'Magnifi templates, workspace links, and curated resources.',
    },
    {
      href: `${base}/ask`,
      tag: 'Guide™',
      title: 'Ask your advisor',
      description: 'Submit questions directly to your Efficiency Architects team.',
    },
  ];
}

function demoModules(slug: string): EAPortalHubModule[] {
  const base = `/portal/${slug}`;
  return [
    {
      href: '/consider/selena',
      tag: 'Magnifi™',
      title: 'Opportunity experience',
      description: 'Cinematic future-state story — demo Consider link for prospects.',
      demoOnly: true,
    },
    {
      href: '/simplifi/capture',
      tag: 'Mobile capture',
      title: 'Simplifi capture',
      description: 'Phone-friendly capture flow with floating Capture now button.',
      demoOnly: true,
    },
    {
      href: '/amplify',
      tag: 'Mobile amplify',
      title: 'Amplifi share',
      description: 'Share Consider links and amplify opportunities from any device.',
      demoOnly: true,
    },
    {
      href: '/assessment',
      tag: 'Operational MRI™',
      title: 'Capacity assessment',
      description: 'Discover hidden friction, recovery opportunities, and next steps.',
      demoOnly: true,
    },
    {
      href: '/scorecard',
      tag: 'Lead magnet',
      title: 'Visibility scorecard',
      description: 'Download the Visibility Assessment Scorecard for your organization.',
      demoOnly: true,
    },
    {
      href: '/start',
      tag: 'Tester hub',
      title: 'Friend testing links',
      description: 'All capture, amplify, and demo URLs in one place for your team.',
      demoOnly: true,
    },
    {
      href: '/partners/login',
      tag: 'Partner network',
      title: 'Partner portal',
      description: 'Referrals, commissions, and marketplace resources for EA partners.',
      demoOnly: true,
    },
  ];
}

export function getEAPortalHubModules(slug: string): EAPortalHubModule[] {
  const base = `/portal/${slug}`;
  const modules = coreModules(base, slug);
  if (isDemoPortalSlug(slug)) {
    return [...modules, ...demoModules(slug)];
  }
  return modules;
}
