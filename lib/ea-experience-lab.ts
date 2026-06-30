/**
 * EA Experience Lab™
 * A premium, cinematic, scroll-based marketing experience for Efficiency Architects™.
 *
 * The story follows ONE person from a single conversation through to a fully
 * designed relationship. Technology is never the hero — the relationship is.
 * Pulse™ is revealed at the end as the operating system behind the experience.
 *
 * All copy lives here so the experience can be re-skinned per organization.
 */

export const experienceMeta = {
  title: 'EA Experience Lab™ | Experience What Intentional Relationships Feel Like',
  description:
    'A cinematic walk through one relationship — from a single conversation to a fully designed experience. This is how you want people to experience your organization.',
  path: '/experience-lab',
} as const;

/** Final CTA opens Consider the Possibilities™; guided discovery continues into CTP. */
export const links = {
  ctp: '/assessment',
  possibilities: '/possibilities',
  home: '/',
} as const;

export type SceneVisualSpec = {
  /** Drop a file at this path under public/ — see public/home/IMAGES.md */
  src: string;
  alt: string;
  position?: string;
  /** Gradient fallback when the image is not yet on disk */
  fallback: 'warm' | 'connect' | 'trust' | 'story' | 'pulse' | 'calm' | 'finale';
  caption?: string;
};

/** Cinematic photography slots — swap paths when assets land in public/home/ */
export const visuals = {
  hero: {
    src: '/home/build-hero.jpg',
    alt: 'A team designing an organization’s experience together',
    position: 'center 40%',
    fallback: 'warm',
    caption: 'Every relationship begins with one conversation.',
  },
  conversation: {
    src: '/home/scene-business.jpg',
    alt: 'A business owner and a visitor sharing a meaningful conversation',
    position: 'center 42%',
    fallback: 'warm',
  },
  connect: {
    src: '/home/scene-coach.jpg',
    alt: 'Two people connecting after a conversation — one scan changes everything',
    position: 'center 38%',
    fallback: 'connect',
  },
  landing: {
    src: '/home/build-hero.jpg',
    alt: 'A beautiful organization story unfolding — photography, mission, and real people',
    position: 'center 35%',
    fallback: 'story',
  },
  welcome: {
    src: '/home/possible-leader.jpg',
    alt: 'The moment someone says yes — a calm, welcoming confirmation',
    position: 'center 40%',
    fallback: 'calm',
  },
  pulse: {
    src: '/home/pulse-hero.jpg',
    alt: 'A personalized home where messages, documents, and next steps already wait',
    position: 'center 42%',
    fallback: 'pulse',
  },
  invisible: {
    src: '/home/ch2-invisible-work.jpg',
    alt: 'While the visitor experienced simplicity, everything kept moving behind the scenes',
    position: 'center',
    fallback: 'calm',
  },
  finale: {
    src: '/home/possible-team.jpg',
    alt: 'Your team, your clients, your mission — designed around you',
    position: 'center 38%',
    fallback: 'finale',
  },
} as const satisfies Record<string, SceneVisualSpec>;

export const opening = {
  lines: [
    'Every relationship begins with one conversation.',
    'The best organizations make sure that conversation never ends.',
  ],
} as const;

export const hero = {
  eyebrow: 'EA Experience Lab™',
  title: 'This is what it feels like',
  titleAccent: 'when every relationship is designed.',
  sub: 'Not a website. Not a demo. One relationship — experienced through their eyes.',
  cta: { label: 'Begin the experience', href: '#chapter-1' },
  scrollHint: 'Scroll to begin',
  visual: visuals.hero,
} as const;

export type Chapter = {
  id: string;
  index: string;
  kicker: string;
  title: string;
  lines: string[];
  visual?: SceneVisualSpec;
};

export const chapterOne: Chapter = {
  id: 'chapter-1',
  index: '01',
  kicker: 'One Conversation',
  title: 'Two people meet.',
  visual: visuals.conversation,
  lines: [
    'A business owner. A coach. A pastor. A leader.',
    'A conversation happens.',
    'Normally, this is where it ends — business cards disappear, people forget, follow-up never happens.',
    'Not this time.',
  ],
};

export const chapterTwo = {
  id: 'chapter-2',
  index: '02',
  kicker: 'One Tap',
  title: 'Just scan this.',
  visual: visuals.connect,
  intro: 'Instead of handing over a business card, they simply smile.',
  scanLabel: 'EA Connect™',
  scanCaption: 'One scan. Three experiences. Simultaneously.',
  experiences: [
    {
      icon: 'contact',
      title: 'Contact Saved',
      copy: 'Their phone instantly saves the contact. No typing. No mistakes. No business card.',
    },
    {
      icon: 'mail',
      title: 'Welcome Email Arrives',
      copy: 'A personalized welcome lands immediately — not minutes later.',
    },
    {
      icon: 'globe',
      title: 'Landing Page Opens',
      copy: 'They are taken straight to the organization’s story.',
    },
  ],
  closing: 'The relationship has already begun before they walk away.',
} as const;

export const behindTheScenes = {
  kicker: 'Behind the scenes',
  title: 'Nothing is forgotten.',
  items: [
    'Capturing the relationship',
    'Updating the CRM',
    'Starting automations',
    'Recording analytics',
    'Preparing follow-up',
    'Creating a relationship timeline',
  ],
} as const;

export const chapterThree = {
  id: 'chapter-3',
  index: '03',
  kicker: 'Every Email Builds Trust',
  title: 'Most signatures end the conversation.',
  titleAccent: 'This one begins the next one.',
  signatureLabel: 'The Dynamic EA Signature™',
  signatureNote: 'Not a static signature. A living experience — always current.',
  signatureButtons: [
    'Schedule Meeting',
    'Visit Website',
    'Resources',
    'Videos',
    'Latest Updates',
    'Portal',
    'Social Media',
    'Calendar',
  ],
  sequenceKicker: 'Over the next several days',
  sequence: [
    { label: 'Email One', title: 'Welcome', copy: 'Here’s who we are.' },
    { label: 'Email Two', title: 'Our Story', copy: 'Our mission. How we help.' },
    { label: 'Email Three', title: 'Your Next Step', copy: 'When you’re ready, here it is.' },
  ],
  closing: 'Every email builds confidence — even while the owner is busy serving someone else.',
} as const;

export const chapterFour = {
  id: 'chapter-4',
  index: '04',
  kicker: 'Curiosity Becomes Confidence',
  title: 'Not a brochure. A story.',
  visual: visuals.landing,
  pills: ['Photography', 'Video', 'Testimonials', 'Mission', 'Purpose', 'Impact', 'Real people'],
  lines: [
    'The landing page answers questions before they’re asked.',
    'It removes uncertainty. It creates confidence.',
  ],
  closing: 'By the end, they’re not wondering whether to work with you. They’re wondering how to start.',
} as const;

export const chapterFive = {
  id: 'chapter-5',
  index: '05',
  kicker: 'The Moment Everything Changes',
  visual: visuals.welcome,
  actions: ['Schedule', 'Register', 'Apply', 'Purchase', 'Volunteer', 'Donate'],
  yesLine: 'The moment someone says yes…',
  changeLine: 'everything changes.',
  confirmation: {
    title: 'Welcome.',
    copy: 'Everything you need is now in one place.',
  },
} as const;

export const chapterSix = {
  id: 'chapter-6',
  index: '06',
  kicker: 'Welcome to Pulse™',
  title: 'Your personalized home for everything.',
  subtitle: 'Not software. The home for your journey with us.',
  visual: visuals.pulse,
  tiles: [
    'Messages',
    'Documents',
    'Training',
    'Schedule',
    'Events',
    'Payments',
    'Resources',
    'Progress',
  ],
  guide: {
    name: 'Your guide',
    steps: [
      'This is where you’ll find your messages.',
      'This is where your documents live.',
      'Here’s your next step.',
      'If you ever need help, it’s always one click away.',
    ],
  },
  closing: 'Within minutes, they’re comfortable. They aren’t learning software — they’re learning how to engage with you.',
} as const;

export const chapterSeven = {
  id: 'chapter-7',
  index: '07',
  kicker: 'The Invisible Experience',
  title: 'While they experienced simplicity…',
  subtitle: 'Pulse quietly kept everything moving.',
  visual: visuals.invisible,
  items: [
    'Tracks engagement',
    'Organizes communication',
    'Sends reminders',
    'Manages documents',
    'Coordinates workflows',
    'Schedules follow-up',
    'Records progress',
    'Updates analytics',
    'Notifies staff',
    'Keeps everything moving',
  ],
  closing: 'The customer feels cared for. The organization feels in control.',
} as const;

export const reveal = {
  kicker: 'The Reveal',
  title: 'You didn’t just watch four products.',
  titleAccent: 'You watched one relationship.',
  flow: [
    'Meet someone',
    'EA Connect™',
    'Contact saved · Welcome email · Landing page',
    'Three automated relationship emails',
    'Trust is built',
    'They say yes',
    'Welcome to Pulse™',
    'Guided experience',
    'Pulse quietly coordinates everything',
  ],
} as const;

export const finalReveal = {
  kicker: 'Pulse™',
  centerLabel: 'Pulse™',
  centerSub: 'The operating system behind the experience.',
  orbit: [
    'Communication',
    'Documents',
    'Training',
    'Events',
    'Payments',
    'Scheduling',
    'Resources',
    'Automation',
    'Analytics',
    'AI Guidance',
    'Workflows',
    'Engagement',
    'Notifications',
    'Progress',
    'Reporting',
    'Collaboration',
  ],
} as const;

export const finale = {
  prompt: ['Now imagine this experience…', 'Designed around your mission. Your people. Your organization.'],
  uniqueness: [
    'Every organization is different.',
    'Every mission is unique.',
    'That’s why we design every experience from the ground up.',
  ],
  yourLabels: ['Your Team', 'Your Clients', 'Your Mission', 'Your Community'],
  invitation: {
    brand: 'Consider the Possibilities™',
    question: 'Every great transformation begins with one question…',
    questionAccent: 'What’s possible?',
    body: [
      'The next few minutes aren’t about filling out a form.',
      'They’re about helping us understand your mission, your people, and where you believe your organization could go.',
      'Let’s discover what’s possible… together.',
    ],
    cta: { label: 'Consider the Possibilities™', href: links.possibilities },
    secondaryCta: { label: 'Begin guided discovery', href: links.ctp },
  },
  visual: visuals.finale,
} as const;
