export interface TourStep {
  id: string;
  title: string;
  body: string;
  target?: string;
  href?: string;
}

export interface GuidedTour {
  id: string;
  name: string;
  steps: TourStep[];
}

export const MISSION_CONTROL_TOUR: GuidedTour = {
  id: 'mission-control-v1',
  name: 'Mission Control Orientation',
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to Mission Control™',
      body: 'Everything in one place — revenue, pipeline, captures, and intelligence. This tour takes about 2 minutes.',
    },
    {
      id: 'navigator',
      title: 'EA Navigator',
      body: 'Click EA Navigator anytime to answer: "What am I trying to accomplish?" — it routes you to the right product surface.',
      target: 'ea-navigator-btn',
    },
    {
      id: 'command',
      title: 'Universal Command Bar',
      body: 'Press ⌘K (or Ctrl+K) to search commands, quick-capture opportunities, or analyze any URL.',
      target: 'ea-command-bar',
    },
    {
      id: 'radar',
      title: 'Resource Radar™',
      body: 'Paste any URL — classify, score, recommend, and generate Auto Blueprint stubs with Trust Layer confidence.',
      href: '/admin/resource-radar',
    },
    {
      id: 'simplifi',
      title: 'Simplifi Website Audit',
      body: 'Run Playwright pipeline audits that produce clarity — not reports. Top 3 priorities, not twenty recommendations.',
      href: '/admin/simplifi-audit',
    },
    {
      id: 'academy',
      title: 'Learn EA Academy',
      body: 'Role-based learning modules for Magnifi, Simplifi, Capture Engine, and adoption.',
      href: '/admin/academy',
    },
  ],
};

export const ACADEMY_ONBOARDING_TOUR: GuidedTour = {
  id: 'academy-v1',
  name: 'Learn EA Academy',
  steps: [
    {
      id: 'start',
      title: 'Learn EA Academy™',
      body: 'Short modules — not documentation dumps. Each answers: What is this? What opportunity exists? What should I do next?',
    },
    {
      id: 'magnifi-simplifi',
      title: 'Magnifi vs Simplifi',
      body: 'Magnifi reveals what is possible. Simplifi tells you what to do next. They work as a pair.',
    },
    {
      id: 'capture',
      title: 'Capture Engine',
      body: 'Extension + Resource Radar turn any URL into structured intelligence in Mission Control.',
    },
  ],
};

export function getTour(id: string): GuidedTour | undefined {
  if (id === MISSION_CONTROL_TOUR.id) return MISSION_CONTROL_TOUR;
  if (id === ACADEMY_ONBOARDING_TOUR.id) return ACADEMY_ONBOARDING_TOUR;
  return undefined;
}
