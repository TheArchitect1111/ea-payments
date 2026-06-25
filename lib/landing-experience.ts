/**
 * Data model for the transformed homepage ("documentary" story).
 * People are the heroes; technology appears quietly inside each scene
 * via the recurring DeviceFrame motif (same platform, different chapters).
 *
 * Imagery is self-hosted from /public/home (see /public/home/IMAGES.md).
 * Backdrops are supplied by the client:
 *   - AI-generated cinematic scenes for the emotional sections (1, 2, 4)
 *   - Licensed editorial stock for the named client stories (6)
 * Until files are added, slots render a graceful gradient placeholder.
 */

export type DeviceKind = 'phone' | 'laptop';

/** A lightweight EA "screen" rendered inside a device frame (no external screenshots). */
export type ExperienceScreen = {
  /** App/experience name shown in the device status bar. */
  app: string;
  /** The rows/items the viewer recognizes as the relevant EA experience. */
  items: string[];
  /** Optional quiet dashboard signals (owner/leader side of the story). */
  signals?: string[];
};

/* ────────────────────────────────────────────────────────────────────────
   Section 1 — Current Reality (recognition; people only, no software)
   ──────────────────────────────────────────────────────────────────────── */

export const recognitionMoments = [
  'The owner answering the same question for the hundredth time.',
  'The coach updating parents one text at a time after practice.',
  'The pastor juggling volunteers across a dozen conversations.',
  'The administrator searching three places for one answer.',
  'The director holding every detail in their own head.',
] as const;

export const currentRealityHero = {
  src: '/home/reality-hero.jpg',
  alt: 'A leader working alone late while everyone else waits for direction',
};

/* ────────────────────────────────────────────────────────────────────────
   Section 2 — A Better Way (6 role scenes, recurring device motif)
   ──────────────────────────────────────────────────────────────────────── */

export type RoleScene = {
  id: string;
  role: string;
  headline: string;
  narrative: string;
  device: DeviceKind;
  screen: ExperienceScreen;
  image: string;
  imageAlt: string;
};

export const roleScenes: RoleScene[] = [
  {
    id: 'coach',
    role: 'The Coach',
    headline: 'Every conversation becomes an opportunity.',
    narrative:
      'A coach meets a parent on the sideline. The parent connects instantly — and the follow-up has already begun, so the coach just keeps talking.',
    device: 'phone',
    screen: {
      app: 'Recruiting Portal',
      items: ['Recruiting Guide', 'Parent Portal', 'Upcoming Events', 'Start Application'],
    },
    image: '/home/scene-coach.jpg',
    imageAlt: 'A youth sports coach talking with a parent on the sideline after practice',
  },
  {
    id: 'business',
    role: 'The Business Owner',
    headline: 'Every opportunity keeps moving.',
    narrative:
      'A meeting ends. The prospect already has what they need, and the owner can see the relationship advancing on its own.',
    device: 'laptop',
    screen: {
      app: 'Owner Dashboard',
      items: ['Company Overview', 'Proposal', 'Booking Link'],
      signals: ['Lead created', 'Resources delivered', 'Follow-up scheduled'],
    },
    image: '/home/scene-business.jpg',
    imageAlt: 'A business owner shaking hands after a meeting in a bright office',
  },
  {
    id: 'pastor',
    role: 'The Pastor',
    headline: 'Every visitor feels connected.',
    narrative:
      'A new family arrives. The welcome opens on a phone, and the pastor spends the moment building a relationship instead of managing logistics.',
    device: 'phone',
    screen: {
      app: 'Member Portal',
      items: ['Welcome', 'Events', 'Groups', "Children's Ministry", 'Member Portal'],
    },
    image: '/home/scene-pastor.jpg',
    imageAlt: 'A pastor warmly greeting a new family in a welcoming gathering space',
  },
  {
    id: 'school',
    role: 'The School',
    headline: 'Every family stays informed.',
    narrative:
      'A parent opens the Family Portal and everything is clear and current — no email thread, no guessing.',
    device: 'phone',
    screen: {
      app: 'Family Portal',
      items: ['Announcements', 'Calendar', 'Documents', 'Teacher Updates', 'Permission Forms'],
    },
    image: '/home/scene-school.jpg',
    imageAlt: 'A parent and child outside a bright, welcoming school campus',
  },
  {
    id: 'creator',
    role: 'The Creator',
    headline: 'Every introduction becomes a relationship.',
    narrative:
      'A talk ends. An audience member connects and instantly receives what was promised, while the creator keeps creating.',
    device: 'phone',
    screen: {
      app: 'Creator Hub',
      items: ['Guide', 'Video', 'Community', 'Booking Link'],
      signals: ['New connection', 'Resources delivered', 'Follow-up active'],
    },
    image: '/home/scene-creator.jpg',
    imageAlt: 'A creator connecting with an audience member after speaking',
  },
  {
    id: 'sports-org',
    role: 'The Sports Organization',
    headline: "Every family knows what's happening.",
    narrative:
      'Schedules, development, photos, recruiting, payments, and forms — every family finds it all in one place.',
    device: 'laptop',
    screen: {
      app: 'Organization Portal',
      items: ['Schedules', 'Player Development', 'Photos', 'Recruiting Updates', 'Payments', 'Forms', 'Events'],
    },
    image: '/home/scene-sports-org.jpg',
    imageAlt: 'Families gathered at a community sports event',
  },
];

/* ────────────────────────────────────────────────────────────────────────
   Section 3 — How We Build Your Experience (one ecosystem, not products)
   ──────────────────────────────────────────────────────────────────────── */

export const ecosystemCapabilities = [
  { name: 'Landing Experiences', note: 'The first impression that invites people in.' },
  { name: 'Organization Portals', note: 'A home base for everyone you serve.' },
  { name: 'Connect', note: 'Instant follow-up the moment someone reaches out.' },
  { name: 'Update Hub', note: 'One place for news, so nobody has to ask.' },
  { name: 'Learning Hub', note: 'Knowledge that is always available.' },
  { name: 'Training Experiences', note: 'Onboarding that runs without you.' },
  { name: 'Parent & Family Experiences', note: 'Clarity for the people who matter most.' },
  { name: 'Volunteer Experiences', note: 'People arrive prepared and confident.' },
  { name: 'Member & Client Experiences', note: 'Relationships that feel personal at scale.' },
  { name: 'Pulse', note: 'One calm view of the whole organization.' },
  { name: 'Simplifi', note: 'Capture an opportunity and act on it instantly.' },
] as const;

/* ────────────────────────────────────────────────────────────────────────
   Section 4 — What's Possible (outcomes; people, not software)
   ──────────────────────────────────────────────────────────────────────── */

export const possibleOutcomes = [
  {
    line: 'The owner is present at dinner.',
    image: '/home/possible-owner.jpg',
    alt: 'A founder enjoying unhurried time with family',
  },
  {
    line: 'The coach is coaching.',
    image: '/home/possible-coach.jpg',
    alt: 'A coach fully present with athletes on the field',
  },
  {
    line: 'The leader decides with confidence.',
    image: '/home/possible-leader.jpg',
    alt: 'An executive director leading calmly with early awareness',
  },
  {
    line: 'The team has room to do its best work.',
    image: '/home/possible-team.jpg',
    alt: 'A diverse team with breathing room to think and improve together',
  },
] as const;

/* ────────────────────────────────────────────────────────────────────────
   Section 5 — How It Works (simple, no jargon)
   ──────────────────────────────────────────────────────────────────────── */

export type HowStepIcon = 'understand' | 'design' | 'build' | 'launch' | 'support';

export const howItWorks: { step: string; note: string; icon: HowStepIcon }[] = [
  { step: 'Understand', note: 'We learn how your organization actually runs.', icon: 'understand' },
  { step: 'Design', note: 'We shape an experience around your people.', icon: 'design' },
  { step: 'Build', note: 'We assemble your ecosystem, end to end.', icon: 'build' },
  { step: 'Launch', note: 'We bring it to life with your team.', icon: 'launch' },
  { step: 'Support', note: 'We stay with you as you grow.', icon: 'support' },
];

/* Section hero imagery (every section gets one cinematic image). */
export const sectionHeroes = {
  build: { src: '/home/build-hero.jpg', alt: 'A diverse team designing an organization’s digital experience together' },
  steps: { src: '/home/steps-hero.jpg', alt: 'Collaborators mapping a clear, simple plan side by side' },
  pulse: { src: '/home/pulse-hero.jpg', alt: 'A leader calmly reviewing their organization at a glance' },
} as const;

/* Section 7 — Pulse command center (calm, exact tiles from the brief). */
export const pulseTiles = [
  { label: 'Communication', value: 'Flowing', detail: '847 touchpoints this week' },
  { label: 'Training', value: 'On track', detail: '92% of team current' },
  { label: 'Engagement', value: '94%', detail: 'Up from 88%' },
  { label: 'Opportunities', value: '23', detail: '6 new this week' },
  { label: 'Organization Health', value: 'Strong', detail: 'All systems steady' },
] as const;

export const pulseActivity = [
  'New family connected — welcome experience delivered',
  'Volunteer completed onboarding',
  'Proposal viewed by prospect',
  'Event reminders sent to 140 parents',
] as const;

export const pulseRecommended = [
  'Follow up with 3 warm leads',
  'Celebrate 2 volunteers hitting milestones',
  'Refresh the fall training module',
] as const;

/* ────────────────────────────────────────────────────────────────────────
   Section 6 — Organizations We've Helped (NAMED — DRAFT, review before publish)
   ──────────────────────────────────────────────────────────────────────── */

export type ClientStory = {
  org: string;
  kind: string;
  challenge: string;
  solution: string;
  outcome: string;
  image: string;
  /** Draft copy pending client approval. */
  reviewNeeded: boolean;
};

/** NOTE: Copy below is DRAFT for review — confirm accuracy/permission before publishing. */
export const clientStories: ClientStory[] = [
  {
    org: 'Canadian Prospects',
    kind: 'Athlete Recruitment',
    challenge: 'Recruiting updates, applications, and parent questions lived in scattered messages.',
    solution: 'A unified recruiting portal with guides, applications, and a parent experience.',
    outcome: 'Families self-serve answers and applications move without manual follow-up.',
    image: '/home/client-canadian-prospects.jpg',
    reviewNeeded: true,
  },
  {
    org: 'Coalition Basketball',
    kind: 'Youth Sports',
    challenge: 'Coaches spent more time relaying logistics than developing athletes.',
    solution: 'One organization portal for schedules, development, payments, and events.',
    outcome: 'Parents always know what is next; coaches return to coaching.',
    image: '/home/client-coalition-basketball.jpg',
    reviewNeeded: true,
  },
  {
    org: 'Amanda Catherine',
    kind: 'Creator / Brand',
    challenge: 'Audience follow-up depended on repeating the same steps by hand.',
    solution: 'A creator hub that delivers guides, video, and booking automatically.',
    outcome: 'Every introduction turns into an active, tracked relationship.',
    image: '/home/client-amanda-catherine.jpg',
    reviewNeeded: true,
  },
  {
    org: 'Amplify Stables',
    kind: 'Equestrian Program',
    challenge: 'Schedules, forms, and member communication were managed manually.',
    solution: 'A member experience with events, documents, and clear communication.',
    outcome: 'Members stay informed and the program runs with less daily overhead.',
    image: '/home/client-amplify-stables.jpg',
    reviewNeeded: true,
  },
  {
    org: 'Bob Rumball Centre',
    kind: 'Community Nonprofit',
    challenge: 'Programs and volunteer coordination relied on one person holding it all.',
    solution: 'Volunteer and member experiences with an Update Hub and Learning Hub.',
    outcome: 'Volunteers arrive prepared and programs continue without bottlenecks.',
    image: '/home/client-bob-rumball-centre.jpg',
    reviewNeeded: true,
  },
];
