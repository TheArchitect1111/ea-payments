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
  name: 'Morning Brief Orientation',
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to the Morning Brief',
      body: 'This home surface answers four questions: What happened? What matters? What needs me? What should I do next? Everything else lives in a certified workspace.',
      href: '/admin/master',
    },
    {
      id: 'next-move',
      title: 'One recommended next move',
      body: 'Start with the hero action. It is the single highest-priority executive move for today.',
      href: '/admin/master#next-move',
    },
    {
      id: 'navigator',
      title: 'EA Navigator',
      body: 'Click EA Navigator anytime to answer: "What am I trying to accomplish?" — it routes you to the right workspace.',
      target: 'ea-navigator-btn',
    },
    {
      id: 'command',
      title: 'Universal Command Bar',
      body: 'Press ⌘K (or Ctrl+K) to search commands and jump to Decisions, Organizations, Operations, Factory, or Search.',
      target: 'ea-command-bar',
    },
    {
      id: 'decisions',
      title: 'Decision Intelligence',
      body: 'When the brief is not enough, open Decisions for the full evidenced queue — Immediate, Today, This Week, and Strategic.',
      href: '/admin/decisions',
    },
    {
      id: 'factory',
      title: 'Executive Factory',
      body: 'Start something new here — diagnose, sell, build, launch, operate, or grow. Creation no longer lives on the Morning Brief.',
      href: '/admin/factory',
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
      body: 'Extension + Resource Radar turn any URL into structured intelligence for follow-up in the right workspace.',
    },
  ],
};

export function getTour(id: string): GuidedTour | undefined {
  if (id === MISSION_CONTROL_TOUR.id) return MISSION_CONTROL_TOUR;
  if (id === ACADEMY_ONBOARDING_TOUR.id) return ACADEMY_ONBOARDING_TOUR;
  return undefined;
}
