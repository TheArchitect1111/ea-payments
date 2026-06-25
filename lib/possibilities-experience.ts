/**
 * Efficiency Architects Experience Book — data model.
 *
 * Add industries or capabilities by extending the arrays below.
 * Image paths point to /public/possibilities/ or /public/home/.
 * Missing files show an elegant gradient placeholder until supplied.
 */

export type OutcomeId =
  | 'grow'
  | 'save-time'
  | 'experiences'
  | 'capacity'
  | 'profitability'
  | 'peace';

export type OutcomeCard = {
  id: OutcomeId;
  title: string;
  sentence: string;
  capabilities: string[];
};

export type InvisibleMoment = {
  id: string;
  image: string;
  imageAlt: string;
  indicator: string;
};

export type IndustryScene = {
  id: string;
  name: string;
  sentence: string;
  image: string;
  imageAlt: string;
  indicator: string;
};

export type FlowStep = {
  id: string;
  label: string;
};

export const experienceMeta = {
  title: 'What Efficiency Architects Does — Experience Book',
  description:
    'A five-minute experience that answers: what does Efficiency Architects actually do? Outcome-focused, not a brochure.',
  sharePath: '/possibilities',
};

export const openingHero = {
  image: '/home/reality-hero.jpg',
  imageAlt: 'A leader looking toward what is possible for their organization',
  headline: 'What are you trying to accomplish?',
};

export const outcomeCards: OutcomeCard[] = [
  {
    id: 'grow',
    title: 'Grow',
    sentence: 'More of the right opportunities reach the right people without you chasing them.',
    capabilities: [
      'Capture every opportunity',
      'Follow-up that happens automatically',
      'Stories that convert interest into action',
      'Referral and partner pathways',
    ],
  },
  {
    id: 'save-time',
    title: 'Save Time',
    sentence: 'The same update reaches everyone once, instead of ten separate conversations.',
    capabilities: [
      'Update Hub across email, text, portal, and web',
      'Self-serve answers for families and clients',
      'Training available 24/7',
      'Fewer repeated questions',
    ],
  },
  {
    id: 'experiences',
    title: 'Create Better Experiences',
    sentence: 'Every touchpoint feels intentional, branded, and easy for the people you serve.',
    capabilities: [
      'Custom landing pages and websites',
      'Organization portals',
      'Member and family experiences',
      'Event registration and check-in',
    ],
  },
  {
    id: 'capacity',
    title: 'Build Capacity',
    sentence: 'Your team can onboard, train, and deliver without everything living in one person\'s head.',
    capabilities: [
      'Learning Hub and training paths',
      'Volunteer readiness',
      'Documented workflows',
      'Role-based access',
    ],
  },
  {
    id: 'profitability',
    title: 'Increase Profitability',
    sentence: 'Payments, proposals, and progress stay visible so revenue does not slip through the cracks.',
    capabilities: [
      'Integrated payments',
      'Proposal and approval flows',
      'Pipeline visibility in Pulse',
      'Less administrative drag',
    ],
  },
  {
    id: 'peace',
    title: 'Gain Peace of Mind',
    sentence: 'You know what is happening, what is next, and that nothing important was forgotten.',
    capabilities: [
      'Pulse command center',
      'Implementation timeline',
      'Messages in one place',
      'Confidence without constant monitoring',
    ],
  },
];

export const universalHeadline = 'Every organization wants the same things.';

export const lifestyleBreak = {
  image: '/home/possible-owner.jpg',
  imageAlt: 'A business owner fully present with family, away from work',
  headline: 'Build a business that doesn\'t need you every minute.',
};

export const invisibleMoments: InvisibleMoment[] = [
  {
    id: 'booking',
    image: '/home/scene-business.jpg',
    imageAlt: 'A calm moment while a customer books on their own',
    indicator: 'Appointment Confirmed',
  },
  {
    id: 'team',
    image: '/home/possible-team.jpg',
    imageAlt: 'A team member completing training while the leader is away',
    indicator: 'Team Updated',
  },
  {
    id: 'payment',
    image: '/home/scene-event-registration.jpg',
    imageAlt: 'A payment arriving while the owner enjoys time off',
    indicator: 'Payment Received',
  },
];

export const controlCenter = {
  headline: 'Confidence, not monitoring.',
  subline: 'One calm view of your organization — at your desk or on your phone.',
  image: '/home/portal-pulse.png',
  imageAlt: 'Pulse command center on desktop and phone',
  backdrop: '/home/pulse-hero.jpg',
  backdropAlt: 'A leader reviewing their organization with calm confidence',
};

export const industries: IndustryScene[] = [
  {
    id: 'restaurant',
    name: 'Restaurant',
    sentence: 'Reservations, staff updates, and guest experience — handled while you run the floor.',
    image: '/possibilities/industry-restaurant.jpg',
    imageAlt: 'Restaurant owner greeting guests in a warm dining room',
    indicator: 'Reservation Confirmed',
  },
  {
    id: 'sports',
    name: 'Sports',
    sentence: 'Registration, schedules, and parent communication — without sideline chaos.',
    image: '/home/scene-sports-org.jpg',
    imageAlt: 'Families at a community sports event',
    indicator: 'Roster Updated',
  },
  {
    id: 'construction',
    name: 'Construction',
    sentence: 'Crew updates, client approvals, and job progress — visible without chasing texts.',
    image: '/possibilities/industry-construction.jpg',
    imageAlt: 'Construction leader reviewing a job site at golden hour',
    indicator: 'Change Order Approved',
  },
  {
    id: 'photography',
    name: 'Photography',
    sentence: 'Bookings, galleries, and client follow-up — while you stay behind the lens.',
    image: '/home/scene-creator.jpg',
    imageAlt: 'Photographer connecting with a client after a session',
    indicator: 'Gallery Delivered',
  },
  {
    id: 'church',
    name: 'Church',
    sentence: 'Visitors welcomed, volunteers aligned, and families informed — before Sunday morning.',
    image: '/home/scene-pastor.jpg',
    imageAlt: 'Pastor greeting a new family at the door',
    indicator: 'Welcome Sent',
  },
  {
    id: 'nonprofit',
    name: 'Nonprofit',
    sentence: 'Donors, volunteers, and programs — coordinated without burning out your core team.',
    image: '/possibilities/industry-nonprofit.jpg',
    imageAlt: 'Nonprofit team serving the community together',
    indicator: 'Volunteer Scheduled',
  },
  {
    id: 'education',
    name: 'Education',
    sentence: 'Families always know schedules, forms, and payments — without another email thread.',
    image: '/home/scene-school.jpg',
    imageAlt: 'Parent and child outside a welcoming school',
    indicator: 'Form Completed',
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    sentence: 'Appointments, intake, and follow-up — clear for patients and your front desk.',
    image: '/possibilities/industry-healthcare.jpg',
    imageAlt: 'Healthcare provider in a calm, welcoming clinic',
    indicator: 'Intake Complete',
  },
  {
    id: 'horse-racing',
    name: 'Horse Racing',
    sentence: 'Owners, trainers, and stakeholders — aligned on every entry and outcome.',
    image: '/possibilities/industry-horse-racing.jpg',
    imageAlt: 'Horse racing owner watching from the rail with confidence',
    indicator: 'Entry Confirmed',
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    sentence: 'Listings, showings, and client updates — moving while you are in the field.',
    image: '/possibilities/industry-real-estate.jpg',
    imageAlt: 'Real estate professional showing a property at sunset',
    indicator: 'Showing Booked',
  },
];

export const howItWorksFlow: FlowStep[] = [
  { id: 'opportunity', label: 'Opportunity' },
  { id: 'capture', label: 'EA captures it' },
  { id: 'inform', label: 'The right people are informed' },
  { id: 'forward', label: 'The work moves forward' },
  { id: 'visibility', label: 'Leader has visibility' },
];

export const closingCta = {
  image: '/home/possible-leader.jpg',
  imageAlt: 'A leader looking ahead with calm confidence',
  headline: 'Imagine what\'s possible.',
  cta: 'Let\'s build your experience.',
  href: '/assessment',
};
