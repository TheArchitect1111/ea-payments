/**
 * Homepage — emotion-first storytelling.
 * Less text. More image. Systems work quietly in the background.
 */

export type FloatingCard = {
  icon: string;
  label: string;
};

export type ExperienceStory = {
  id: string;
  headline: string;
  sentence: string;
  image: string;
  imageAlt: string;
  cards: FloatingCard[];
  /** Brighten scrim so faces stay visible */
  bright?: boolean;
  imagePosition?: string;
};

export const heroContent = {
  headline: 'Live YOUR Life™',
  subheadline:
    'Imagine custom systems quietly working in the background while you focus on what matters most.',
  image: '/home/possible-owner.jpg',
  imageAlt: 'A person fully present with family while life runs smoothly',
  ctaPrimary: { label: 'Consider the Possibilities™', href: '#consider' },
  ctaSecondary: { label: 'Explore the Experiences', href: '#experiences' },
} as const;

export const experienceStories: ExperienceStory[] = [
  {
    id: 'business',
    headline: 'Live YOUR Life™',
    sentence: 'Your business keeps moving while you enjoy what matters most.',
    image: '/home/possible-owner.jpg',
    imageAlt: 'Business owner enjoying dinner with family while the business runs itself',
    bright: true,
    imagePosition: 'center 40%',
    cards: [
      { icon: '📅', label: 'Appointments' },
      { icon: '💳', label: 'Payments' },
      { icon: '📄', label: 'Proposals' },
      { icon: '📈', label: 'New Leads' },
    ],
  },
  {
    id: 'coach',
    headline: 'Coach More. Coordinate Less.',
    sentence: 'The system handles coordination while you stay with your athletes.',
    image: '/home/possible-coach.jpg',
    imageAlt: 'Coach fully engaged with athletes on the field',
    bright: true,
    imagePosition: 'center 35%',
    cards: [
      { icon: '🏀', label: 'Camp Registration' },
      { icon: '📅', label: 'Scheduling' },
      { icon: '💬', label: 'Parent Updates' },
      { icon: '🎥', label: 'Film Library' },
    ],
  },
  {
    id: 'nonprofit',
    headline: 'Focus on the Mission.',
    sentence: 'The details run themselves while you lead with presence.',
    image: '/home/possible-leader.jpg',
    imageAlt: 'Executive director enjoying a community event with sponsors',
    bright: true,
    cards: [
      { icon: '⛳', label: 'Registration' },
      { icon: '🤝', label: 'Sponsors' },
      { icon: '❤️', label: 'Donations' },
      { icon: '🙋', label: 'Volunteers' },
    ],
  },
  {
    id: 'creator',
    headline: 'Create.',
    sentence: "We'll handle the rest.",
    image: '/home/scene-creator.jpg',
    imageAlt: 'Creator filming content with focus and freedom',
    bright: true,
    cards: [
      { icon: '📹', label: 'Publishing' },
      { icon: '📱', label: 'Social Media' },
      { icon: '📧', label: 'Newsletter' },
      { icon: '📊', label: 'Analytics' },
    ],
  },
  {
    id: 'musician',
    headline: 'Perform.',
    sentence: "We'll grow your audience.",
    image: '/home/scene-sports-org.jpg',
    imageAlt: 'Musician performing before a packed, energized audience',
    cards: [
      { icon: '🎟️', label: 'Events' },
      { icon: '🛍️', label: 'Merchandise' },
      { icon: '🎫', label: 'VIP Members' },
      { icon: '🎵', label: 'Bookings' },
    ],
  },
];

export type PulseFeature = { icon: string; label: string };

export const pulseReveal = {
  headline: 'One Platform.',
  headlineAccent: 'Unlimited Possibilities.',
  subheadline: "Everything you've experienced is powered by Pulse™.",
  dashboardImage: '/home/portal-pulse.png',
  dashboardAlt: 'Pulse command center on desktop, tablet, and phone',
  leftFeatures: [
    { icon: '🎓', label: 'Training' },
    { icon: '👥', label: 'CRM' },
    { icon: '📂', label: 'Knowledge' },
    { icon: '📢', label: 'Communications' },
  ] as PulseFeature[],
  rightFeatures: [
    { icon: '📅', label: 'Events' },
    { icon: '📋', label: 'Projects' },
    { icon: '📊', label: 'Reports' },
    { icon: '🤖', label: 'AI Assistant' },
  ] as PulseFeature[],
} as const;

export type ConsiderPath = {
  id: string;
  icon: string;
  label: string;
  image: string;
  imageAlt: string;
  opener: string;
  prompts: string[];
};

export const considerContent = {
  headline: 'Consider the Possibilities™',
  question: 'What would you love to spend more time doing?',
  paths: [
    {
      id: 'business',
      icon: '🏢',
      label: 'Growing My Business',
      image: '/home/scene-business.jpg',
      imageAlt: 'Business owner focused on growth',
      opener: "Let's explore what becomes possible when your business runs itself.",
      prompts: [
        'Getting my evenings and weekends back',
        'Scaling without hiring more admin staff',
        'Never missing a lead or follow-up again',
      ],
    },
    {
      id: 'coaching',
      icon: '🏀',
      label: 'Coaching',
      image: '/home/coach-parent.jpg',
      imageAlt: 'Coach present with athletes and families',
      opener: "Let's explore what becomes possible when coordination happens quietly.",
      prompts: [
        'Being on the field instead of in my inbox',
        'Parents always knowing what is happening',
        'Running camps without the admin chaos',
      ],
    },
    {
      id: 'nonprofit',
      icon: '❤️',
      label: 'Serving My Community',
      image: '/home/scene-pastor.jpg',
      imageAlt: 'Leader serving community with presence',
      opener: "Let's explore what becomes possible when the mission comes first.",
      prompts: [
        'Events that run smoothly without me in every detail',
        'Volunteers who show up prepared',
        'Donors and sponsors feeling truly connected',
      ],
    },
    {
      id: 'creator',
      icon: '🎨',
      label: 'Creating',
      image: '/home/scene-creator.jpg',
      imageAlt: 'Creator making content freely',
      opener: "Let's explore what becomes possible when distribution runs itself.",
      prompts: [
        'Publishing without the platform juggling',
        'Growing my audience while I create',
        'Newsletters and social on autopilot',
      ],
    },
    {
      id: 'musician',
      icon: '🎵',
      label: 'Performing',
      image: '/home/possible-team.jpg',
      imageAlt: 'Performer connecting with an audience',
      opener: "Let's explore what becomes possible when the business side stays quiet.",
      prompts: [
        'Selling tickets without the back-and-forth',
        'Merch and VIP handled automatically',
        'More stages, less spreadsheets',
      ],
    },
    {
      id: 'leading',
      icon: '👥',
      label: 'Leading My Team',
      image: '/home/possible-leader.jpg',
      imageAlt: 'Leader with a confident, calm team',
      opener: "Let's explore what becomes possible when your team has room to breathe.",
      prompts: [
        'Everyone aligned without endless meetings',
        'Clear visibility without micromanaging',
        'Systems that scale as we grow',
      ],
    },
  ] as ConsiderPath[],
} as const;
