import { roleAllowed, routeMatchesPattern } from './ea-guide-context';
import type { EAUserRole, EAPortalType, GuideTour } from './ea-guide-types';

const BODY = 'body';

export const EA_GUIDE_TOURS: GuideTour[] = [
  {
    tourId: 'first-login-orientation',
    title: 'Welcome to your portal',
    description: 'Orientation for first-time users across EA portals.',
    trigger: 'first_login',
    routePattern: '^/(portal|admin|discover|assessment|pulse|passport)',
    steps: [
      {
        element: BODY,
        title: 'Welcome',
        description:
          'Welcome. I can walk you through your portal. Let\'s start with what matters most today.',
      },
      {
        element: '[data-ea-guide="dashboard"], main, body',
        title: 'Your dashboard',
        description: 'Your dashboard shows status, priorities, and what needs attention right now.',
        position: 'bottom',
      },
      {
        element: '[data-ea-guide="status"], main, body',
        title: 'Current status',
        description: 'Status tells you where your project or workflow stands — on track, waiting, or needs action.',
        position: 'bottom',
      },
      {
        element: '[data-ea-guide="next-step"], main, body',
        title: 'Next step',
        description: 'Always look for the recommended next step. It keeps you moving without guessing.',
        position: 'bottom',
      },
      {
        element: '[data-ea-guide="uploads"], main, body',
        title: 'Uploads',
        description: 'Upload documents, images, and files EA needs to build or deliver your experience.',
        position: 'left',
      },
      {
        element: '[data-ea-guide="messages"], main, body',
        title: 'Messages',
        description: 'Messages and updates keep everyone aligned. Check here before emailing.',
        position: 'left',
      },
      {
        element: '[data-ea-guide="documents"], main, body',
        title: 'Documents',
        description: 'Blueprints, proposals, agreements, and deliverables live in Documents.',
        position: 'left',
      },
      {
        element: '[data-ea-guide="payments"], main, body',
        title: 'Payments',
        description: 'Review invoices, make payments, and track billing status in one place.',
        position: 'left',
      },
      {
        element: '[data-ea-guide="training"], main, body',
        title: 'Training',
        description: 'Complete training modules so your team adopts the new system confidently.',
        position: 'left',
      },
      {
        element: '[data-ea-guide="timeline"], main, body',
        title: 'Timeline',
        description: 'The implementation timeline shows milestones, dates, and what happens next.',
        position: 'top',
      },
      {
        element: BODY,
        title: 'Ask me anything',
        description:
          'Click the EA Orb anytime to ask a question, walk through a page, or get your recommended next step.',
      },
    ],
    estimatedMinutes: 4,
  },
  {
    tourId: 'discover-overview',
    title: 'Discover The Possibilities™',
    description: 'How discovery intake works and what happens after you submit.',
    portalType: 'discover',
    trigger: 'first_visit',
    routePattern: '^/(discover|assessment)',
    steps: [
      {
        element: 'main, body',
        title: 'Discover The Possibilities™',
        description: 'This guided intake helps EA understand your goals, audience, and desired experiences.',
      },
      {
        element: 'form, main',
        title: 'Answer honestly',
        description: 'Your answers shape your Blueprint, proposal, and portal experience. There are no wrong answers.',
        position: 'bottom',
      },
      {
        element: 'main, body',
        title: 'What happens next',
        description: 'After submit, EA reviews your intake, prepares recommendations, and opens your Passport to Possibilities™.',
      },
    ],
    estimatedMinutes: 2,
  },
  {
    tourId: 'passport-overview',
    title: 'Passport to Possibilities™',
    description: 'Your roadmap from discovery to delivery.',
    portalType: 'passport',
    trigger: 'first_visit',
    routePattern: 'passport',
    steps: [
      {
        element: 'main, body',
        title: 'Your Passport',
        description: 'Passport to Possibilities™ is your personalized roadmap — phases, milestones, and next actions.',
      },
      {
        element: 'main, body',
        title: 'Track progress',
        description: 'Each phase shows what is complete, in progress, and waiting on you or EA.',
      },
      {
        element: 'main, body',
        title: 'Stay oriented',
        description: 'Return here whenever you need to see the big picture of your EA engagement.',
      },
    ],
    estimatedMinutes: 2,
  },
  {
    tourId: 'upload-documents',
    title: 'Upload documents',
    description: 'How to upload files EA needs for your project.',
    trigger: 'manual',
    routePattern: 'upload|document',
    steps: [
      {
        element: 'main, body',
        title: 'Why uploads matter',
        description: 'Photos, logos, documents, and brand assets help EA build your portal and deliverables accurately.',
      },
      {
        element: 'input[type="file"], [data-ea-guide="uploads"], main',
        title: 'Choose your files',
        description: 'Select files from your device. Use clear names so your team can find them later.',
        position: 'bottom',
      },
      {
        element: 'main, body',
        title: 'After upload',
        description: 'EA is notified automatically. You can track status in Documents and Messages.',
      },
    ],
    estimatedMinutes: 2,
  },
  {
    tourId: 'review-blueprint',
    title: 'Review Blueprint',
    description: 'Understand and review your EA Blueprint.',
    trigger: 'manual',
    routePattern: 'blueprint',
    steps: [
      {
        element: 'main, body',
        title: 'What is a Blueprint?',
        description: 'Your Blueprint is EA\'s plan for your digital experience — structure, features, and priorities.',
      },
      {
        element: 'main, body',
        title: 'Review carefully',
        description: 'Read each section. Note questions or changes before approving.',
        position: 'bottom',
      },
      {
        element: 'main, body',
        title: 'Request changes',
        description: 'Use Messages or the Orb to ask for revisions. EA updates the Blueprint before you approve.',
      },
    ],
    estimatedMinutes: 3,
  },
  {
    tourId: 'approve-proposal',
    title: 'Approve proposal',
    description: 'Review and approve your EA proposal.',
    trigger: 'manual',
    routePattern: 'proposal|approval',
    steps: [
      {
        element: 'main, body',
        title: 'Your proposal',
        description: 'The proposal outlines scope, investment, timeline, and deliverables for your EA engagement.',
      },
      {
        element: 'main, body',
        title: 'Review terms',
        description: 'Check scope, pricing, and timeline. Ask the Orb if any section is unclear.',
      },
      {
        element: '[data-ea-guide="approve"], button, main',
        title: 'Approve to proceed',
        description: 'Approval unlocks the next phase — agreements, payments, and implementation.',
        position: 'top',
      },
    ],
    estimatedMinutes: 3,
  },
  {
    tourId: 'make-payment',
    title: 'Make a payment',
    description: 'Complete payments securely through your portal.',
    trigger: 'manual',
    routePattern: 'payment|billing|invoice',
    steps: [
      {
        element: 'main, body',
        title: 'Payments in your portal',
        description: 'EA uses secure Stripe checkout. You will see invoices and payment status here.',
      },
      {
        element: 'main, body',
        title: 'Before you pay',
        description: 'Confirm the invoice matches your approved proposal or agreement.',
      },
      {
        element: 'main, body',
        title: 'After payment',
        description: 'EA receives confirmation automatically and advances your project timeline.',
      },
    ],
    estimatedMinutes: 2,
  },
  {
    tourId: 'view-timeline',
    title: 'Implementation timeline',
    description: 'Track milestones and what happens next.',
    trigger: 'manual',
    routePattern: 'timeline|implementation',
    steps: [
      {
        element: 'main, body',
        title: 'Your timeline',
        description: 'The implementation timeline shows phases, dates, and dependencies.',
      },
      {
        element: 'main, body',
        title: 'Milestones',
        description: 'Each milestone marks a deliverable or decision point. Completed items show your progress.',
      },
      {
        element: 'main, body',
        title: 'What happens next',
        description: 'The next open milestone is your focus. Ask the Orb if you are unsure what action to take.',
      },
    ],
    estimatedMinutes: 2,
  },
  {
    tourId: 'complete-training',
    title: 'Complete training',
    description: 'Finish training modules in the Training Hub.',
    portalType: 'training',
    trigger: 'manual',
    routePattern: 'academy|learning|training',
    steps: [
      {
        element: 'main, body',
        title: 'Training Hub',
        description: 'Short, role-based modules help your team adopt EA tools confidently.',
      },
      {
        element: 'main, body',
        title: 'Continue where you left off',
        description: 'Open your next incomplete module. Progress is saved automatically.',
      },
      {
        element: 'main, body',
        title: 'Apply what you learn',
        description: 'After each module, try the action in your portal. Practice builds retention.',
      },
    ],
    estimatedMinutes: 2,
  },
  {
    tourId: 'messages-guide',
    title: 'Send and read messages',
    description: 'Communicate with EA through Messages and Update Hub.',
    trigger: 'manual',
    routePattern: 'message|update',
    steps: [
      {
        element: 'main, body',
        title: 'Messages & updates',
        description: 'Keep communication inside your portal so nothing gets lost in email threads.',
      },
      {
        element: 'main, body',
        title: 'Send an update',
        description: 'Share status, ask questions, or request changes. Be specific about what you need.',
      },
      {
        element: 'main, body',
        title: 'Read responses',
        description: 'EA replies appear here. You will also see notifications on your dashboard.',
      },
    ],
    estimatedMinutes: 2,
  },
  {
    tourId: 'pulse-dashboard',
    title: 'Pulse™ dashboard',
    description: 'Understand operational health and engagement signals.',
    portalType: 'pulse',
    trigger: 'first_visit',
    routePattern: 'pulse',
    steps: [
      {
        element: 'main, body',
        title: 'Pulse™',
        description: 'Pulse shows visibility, capacity, engagement, and organizational health at a glance.',
      },
      {
        element: 'main, body',
        title: 'Read the signals',
        description: 'Scores highlight what changed and why it matters. Focus on areas flagged for action.',
      },
      {
        element: 'main, body',
        title: 'Take action',
        description: 'Each signal links to a recommended next step — training, follow-up, or review.',
      },
    ],
    estimatedMinutes: 3,
  },
  {
    tourId: 'admin-dashboard',
    title: 'Admin dashboard overview',
    description: 'Mission Control orientation for EA administrators.',
    portalType: 'admin',
    trigger: 'first_visit',
    routePattern: '^/admin',
    roles: ['admin', 'staff'],
    steps: [
      {
        element: '[data-ea-guide="dashboard"], main, body',
        title: 'Mission Control',
        description: 'Mission Control is your operating center — pipeline, delivery, clients, and intelligence.',
      },
      {
        element: '[data-ea-guide="navigator"], [data-ea-guide="command"], main',
        title: 'Navigate quickly',
        description: 'Use EA Navigator and the command bar to jump to the right surface fast.',
        position: 'bottom',
      },
      {
        element: 'main, body',
        title: 'EA Factory & protocols',
        description: 'EA Factory, protocols, and launch tools connect intake to live client experiences.',
      },
      {
        element: 'main, body',
        title: 'Guide escalations',
        description: 'When users escalate from EA Guide™, tasks appear in admin for your team to resolve.',
      },
    ],
    estimatedMinutes: 3,
  },
];

export function getGuideTour(tourId: string): GuideTour | undefined {
  return EA_GUIDE_TOURS.find((tour) => tour.tourId === tourId);
}

export function listToursForPage(
  pathname: string,
  portalType: EAPortalType,
  role: EAUserRole,
): GuideTour[] {
  return EA_GUIDE_TOURS.filter((tour) => {
    if (tour.portalType && tour.portalType !== portalType) return false;
    if (!routeMatchesPattern(pathname, tour.routePattern)) return false;
    if (!roleAllowed(tour.roles, role)) return false;
    return true;
  });
}

export function getRecommendedTour(
  pathname: string,
  portalType: EAPortalType,
  role: EAUserRole,
  completedTourIds: string[],
): GuideTour | undefined {
  const tours = listToursForPage(pathname, portalType, role);
  const incomplete = tours.filter((tour) => !completedTourIds.includes(tour.tourId));
  return (
    incomplete.find((tour) => tour.trigger === 'incomplete_step') ??
    incomplete.find((tour) => tour.trigger === 'recommended') ??
    incomplete.find((tour) => tour.trigger === 'first_visit') ??
    incomplete[0]
  );
}
