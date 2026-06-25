/**
 * Homepage storytelling data.
 * Device screens show real EA portal mockups (client-supplied).
 */

export type DeviceKind = 'phone' | 'laptop' | 'tablet' | 'desktop';

export type PortalPage = 'dashboard' | 'updates' | 'resources' | 'events';

export type BuiltScreen = {
  orgLabel: string;
  portalPage: PortalPage;
};

export const recognitionMoments = [
  'The owner answering the same question for the hundredth time.',
  'The coach updating parents one text at a time after practice.',
  'The pastor juggling volunteers across a dozen conversations.',
  'The administrator searching three places for one answer.',
  'The director holding every detail in their own head.',
] as const;

export const currentRealityHero = {
  src: '/home/reality-hero.jpg',
  alt: 'A team working late while operational details pile up',
};

export const buildSectionLead =
  'We build around how you really work, so your people spend less time chasing answers and more time doing what matters.';

export type RoleScene = {
  id: string;
  role: string;
  headline: string;
  narrative: string;
  image: string;
  imageAlt: string;
  /** Real EA portal mockup (already framed in a device, transparent background). */
  mockup?: string;
  mockupAlt?: string;
  /** Rectangular screenshots (e.g. a desktop dashboard) get rounded corners. */
  mockupRounded?: boolean;
  /** Keep faces/people clearly visible (lighter scrim). */
  brightScene?: boolean;
  /** Fallback built portal screen (used when no mockup is supplied). */
  device?: DeviceKind;
  screen?: BuiltScreen;
};

export const roleScenes: RoleScene[] = [
  {
    id: 'coach',
    role: 'The Coach',
    headline: 'Every conversation becomes an opportunity.',
    narrative:
      'A coach talks with a parent on the sideline. The parent connects on their phone, and the guides, events, and application are already there, so the coach keeps coaching.',
    image: '/home/coach-parent.jpg',
    imageAlt: 'A coach talking with a parent on the sideline after practice',
    mockup: '/home/portal-coach.png',
    mockupAlt: 'Recruiting Portal on a phone showing profile, events, and next steps',
    brightScene: true,
  },
  {
    id: 'business',
    role: 'The Business Owner',
    headline: 'Every opportunity keeps moving.',
    narrative:
      'A meeting ends. The prospect already has what they need, and the owner can see the next step without chasing anyone.',
    image: '/home/scene-business.jpg',
    imageAlt: 'A business owner after a meeting in a bright office',
    mockup: '/home/portal-business.png',
    mockupAlt: 'Business dashboard on a phone showing revenue, leads, and activity',
  },
  {
    id: 'pastor',
    role: 'The Pastor',
    headline: 'Every visitor feels connected.',
    narrative:
      'A new family arrives. Welcome info opens on their phone, and the pastor stays in the moment instead of being buried in logistics.',
    image: '/home/scene-pastor.jpg',
    imageAlt: 'A pastor warmly greeting a new family',
    mockup: '/home/portal-pastor.png',
    mockupAlt: 'Church Portal on a phone showing visitor outreach and next steps',
  },
  {
    id: 'school',
    role: 'The School',
    headline: 'Every family stays informed.',
    narrative:
      'A parent opens the family portal. Schedules, announcements, payments, and forms are right there, with no email thread and no guessing.',
    image: '/home/scene-school.jpg',
    imageAlt: 'A parent and child outside a welcoming school campus',
    mockup: '/home/portal-school.png',
    mockupAlt: 'Family Portal on a phone showing schedules, payments, and forms',
  },
  {
    id: 'creator',
    role: 'The Creator',
    headline: 'Every introduction becomes a relationship.',
    narrative:
      'A talk ends. Someone connects and instantly gets the guide, video, and booking link, while the creator keeps creating.',
    image: '/home/scene-creator.jpg',
    imageAlt: 'A creator connecting with an audience member after speaking',
    mockup: '/home/portal-creator.png',
    mockupAlt: 'Creator Hub on a phone showing connections, resources, and bookings',
  },
  {
    id: 'event-registration',
    role: 'Event Registration',
    headline: 'Every attendee checks in with confidence.',
    narrative:
      'Registration, payments, waivers, schedules, tickets, badges, and event updates all happen in one place, creating a fast, welcoming check-in experience from the moment guests arrive.',
    image: '/home/scene-event-registration.jpg',
    imageAlt: 'An event host welcoming an attendee at a check-in desk',
    mockup: '/home/portal-event-registration.png',
    mockupAlt:
      'Registration Overview dashboard showing registrations, tickets, payments, and check-ins',
    mockupRounded: true,
  },
];

export const ecosystemCapabilities = [
  {
    name: 'Custom Landing Pages & Websites',
    note: 'Built for your organization, not a template. Your site looks like you, tells your story, and points people to the right next step instead of forcing you into a generic layout.',
  },
  {
    name: 'Organization Portal',
    note: 'A custom portal linked to your website that serves as your operations center.',
  },
  {
    name: 'Connect',
    note: 'When someone reaches out, follow-up starts right away, without you repeating yourself.',
  },
  {
    name: 'Update Hub',
    note: "Say it once. It's automatically communicated to staff, clients, parents, volunteers, and members across email, text, website, portal, and social media.",
  },
  { name: 'Learning Hub', note: 'Guides and resources your people can find anytime, without asking you.' },
  {
    name: 'Training Experiences',
    note: 'Training and onboarding that is available virtually, 24/7, so new people get up to speed on their own schedule.',
  },
  { name: 'Parent & Family Experiences', note: 'Families always know what is happening before they have to ask.' },
  { name: 'Volunteer Experiences', note: 'Volunteers show up prepared because the details are already in their hands.' },
  { name: 'Member & Client Experiences', note: 'People feel known and cared for, even as you grow.' },
  { name: 'Pulse', note: 'One calm place to see how your organization is doing, without digging through inboxes.' },
  { name: 'Simplifi', note: 'Capture an opportunity the moment it appears, and act on it fast.' },
] as const;

export const possibleOutcomes = [
  {
    line: 'The owner is home for dinner.',
    image: '/home/possible-owner.jpg',
    alt: 'A multigenerational family enjoying dinner together',
  },
  {
    line: 'The coach is on the field.',
    image: '/home/possible-coach.jpg',
    alt: 'A coach fully present with athletes during practice',
  },
  {
    line: 'The leader decides with confidence.',
    image: '/home/possible-leader.jpg',
    alt: 'A leader making a calm, confident decision',
  },
  {
    line: 'The team has room to breathe.',
    image: '/home/possible-team.jpg',
    alt: 'A diverse team collaborating with breathing room',
  },
] as const;

export type HowStepIcon = 'understand' | 'design' | 'build' | 'launch' | 'support';

export const howItWorks: { step: string; note: string; icon: HowStepIcon }[] = [
  { step: 'Understand', note: 'We listen to how your organization really runs.', icon: 'understand' },
  { step: 'Design', note: 'We map an experience around your people.', icon: 'design' },
  { step: 'Build', note: 'We put it together, end to end.', icon: 'build' },
  { step: 'Launch', note: 'We go live with your team.', icon: 'launch' },
  { step: 'Support', note: 'We stay with you as you grow.', icon: 'support' },
];

export const sectionHeroes = {
  build: { src: '/home/build-hero.jpg', alt: 'A team planning an organization’s digital experience together' },
  steps: { src: '/home/steps-hero.jpg', alt: 'Collaborators mapping a clear plan side by side' },
} as const;

/** Section 7 — Pulse (real Pulse portal on desktop + phone). */
export const pulseMockup = {
  src: '/home/portal-pulse.png',
  alt: 'Pulse command center shown on a desktop and a phone',
};

export type ClientIcon = 'arts' | 'community' | 'family' | 'youth';

export type ClientStory = {
  org: string;
  kind: string;
  challenge: string;
  solution: string;
  icon: ClientIcon;
};

/** Fictional examples, not real client names. */
export const clientStories: ClientStory[] = [
  {
    org: 'River Valley Arts Collective',
    kind: 'Arts & Education',
    challenge:
      'Workshops, instructors, and volunteers were coordinated through scattered emails and text messages, making it difficult to onboard new helpers.',
    solution:
      'An Update Hub for announcements and class resources, paired with a Learning Hub for training materials, helped streamline communication and give families a more reliable, professional experience.',
    icon: 'arts',
  },
  {
    org: 'Community Care Alliance',
    kind: 'Community Outreach',
    challenge:
      'Food pantry operations and community outreach relied on institutional knowledge held by a few longtime volunteers.',
    solution:
      'A centralized Update Hub for communications and a Learning Hub for orientation, schedules, and resources helped new volunteers get up to speed quickly and community services expand without overwhelming staff.',
    icon: 'community',
  },
  {
    org: 'HopeBridge Family Services',
    kind: 'Family Services',
    challenge:
      'Event planning, client support, and volunteer coordination became difficult as the organization grew, creating communication gaps and duplicated work.',
    solution:
      'A branded member experience with an Update Hub, Learning Hub, and resource library created clarity, consistency, and stronger engagement across the organization.',
    icon: 'family',
  },
  {
    org: 'Bright Horizons Youth Network',
    kind: 'Youth Mentorship',
    challenge:
      'After-school programs, mentors, and volunteers depended on one coordinator who tracked everything with email and spreadsheets.',
    solution:
      'A centralized Update Hub and Learning Hub provided everything in one place, improving communication and freeing up time for mentors to focus on what matters most.',
    icon: 'youth',
  },
];
