/**
 * Efficiency Architects Marketing Experience™
 * Live YOUR Life™ — emotional storytelling, not a website.
 */

export type FloatingCard = { icon: string; label: string };

export type VisualStory = {
  id: string;
  role: string;
  headline: string;
  sentence: string;
  image: string;
  imageAlt: string;
  cards: FloatingCard[];
};

export type ConsiderChoice = {
  id: string;
  icon: string;
  label: string;
  image: string;
  imageAlt: string;
  opener: string;
  prompts: string[];
};

export const experienceMeta = {
  title: 'Live YOUR Life™ | Efficiency Architects',
  description:
    'An emotional storytelling experience. Imagine custom systems quietly working in the background while you focus on what matters most.',
  sharePath: '/live-your-life',
} as const;

export const openingHero = {
  eyebrow: 'Efficiency Architects Marketing Experience™',
  headline: 'Live YOUR Life™',
  subheadline:
    'Imagine custom systems quietly working in the background while you focus on what matters most.',
  image: '/home/he-hero-live.jpg',
  imageAlt: 'A person fully present, free to focus on what matters most',
  cta: { label: 'Begin the Experience', href: '#chapter-1' },
} as const;

export const chapter1 = {
  id: 'chapter-1',
  title: 'Why Did You Start?',
  intro: "Don't begin with business. Begin with purpose.",
  questions: [
    { text: 'Why did you start your business?', image: '/home/ch1-why-start.jpg', alt: 'A founder opening their shop at dawn with quiet hope' },
    { text: 'Why did you become a coach?', image: '/home/he-coach-athletes.jpg', alt: 'A coach fully present with athletes' },
    { text: 'Why did you launch your nonprofit?', image: '/home/he-nonprofit-golf.jpg', alt: 'A leader serving community with sponsors' },
    { text: 'Why did you become a creator?', image: '/home/he-creator-filming.jpg', alt: 'A creator making content with freedom' },
    { text: 'Why did you start serving people?', image: '/home/ch7-healthcare.jpg', alt: 'A caregiver present with someone who needs them' },
  ],
} as const;

export const chapter2 = {
  id: 'chapter-2',
  title: 'Somewhere Along the Way...',
  intro: 'Invisible work quietly replaces the dream.',
  image: '/home/ch2-invisible-work.jpg',
  imageAlt: 'A professional surrounded by the constant weight of invisible work',
  items: [
    'Emails',
    'Scheduling',
    'Training',
    'Searching',
    'Documents',
    'Meetings',
    'Approvals',
    'Reporting',
    'Questions',
    'Follow-up',
  ],
  closing: 'Nobody planned for this. It simply happened.',
} as const;

export const chapter3 = {
  id: 'chapter-3',
  title: 'Imagine Instead',
  intro: 'Everything changes. People fully engaged in the work they love.',
  scenes: [
    { label: 'A business owner with family', image: '/home/he-business-dinner.jpg', alt: 'Business owner present at dinner with family' },
    { label: 'A coach teaching', image: '/home/he-coach-athletes.jpg', alt: 'Coach teaching athletes on the court' },
    { label: 'A nonprofit leader serving', image: '/home/he-nonprofit-golf.jpg', alt: 'Nonprofit leader with community sponsors' },
    { label: 'A creator creating', image: '/home/he-creator-filming.jpg', alt: 'Creator filming with focus and freedom' },
    { label: 'A musician performing', image: '/home/he-musician-stage.jpg', alt: 'Musician performing before a packed audience' },
    { label: 'A consultant advising', image: '/home/ch7-consultant.jpg', alt: 'Consultant guiding a team with clarity' },
    { label: 'A teacher inspiring', image: '/home/ch7-school.jpg', alt: 'Teacher inspiring students in the classroom' },
  ],
} as const;

export const chapter4 = {
  id: 'chapter-4',
  title: 'What If...',
  intro: 'This chapter is about possibility.',
  image: '/home/he-hero-live.jpg',
  imageAlt: 'A calm moment of possibility and freedom',
  questions: [
    'Your organization never answered the same question twice?',
    'Training improved itself?',
    'Knowledge never disappeared?',
    'Opportunities found you?',
    'Your presence continued working while you slept?',
    'Your people spent more time serving and less time searching?',
  ],
} as const;

export const chapter5 = {
  id: 'chapter-5',
  title: 'We Believe...',
  intro: 'The philosophy of Efficiency Architects.',
  image: '/home/possible-leader.jpg',
  imageAlt: 'A leader with calm confidence and clarity',
  beliefs: [
    'Organizations should be designed around people. Not people around software.',
    'Technology should simplify. Not complicate.',
    'Knowledge should grow. Not disappear.',
    'Systems should create opportunity. Not create more work.',
    'The best technology is the kind you stop thinking about because it quietly does its job.',
  ],
} as const;

export const chapter6 = {
  id: 'chapter-6',
  title: 'How We Think',
  intro: 'Watching architects create a blueprint — not consultants presenting a process.',
  steps: [
    { label: 'Understand', note: 'Listen to how your organization really works.' },
    { label: 'Discover Invisible Work', note: 'Find what quietly consumes your people.' },
    { label: 'Design Around People', note: 'Build experiences that fit your mission.' },
    { label: 'Connect Everything', note: 'One calm ecosystem, not scattered tools.' },
    { label: 'Continuously Improve', note: 'Systems that grow as you grow.' },
  ],
} as const;

export const chapter7 = {
  id: 'chapter-7',
  title: 'Imagine the Possibilities™',
  intro: 'Visual stories. People remain the focus.',
  stories: [
    {
      id: 'business',
      role: 'Business Owner',
      headline: 'Live YOUR Life™',
      sentence: 'Your business keeps moving while you enjoy what matters most.',
      image: '/home/he-business-dinner.jpg',
      imageAlt: 'Business owner enjoying dinner with family',
      cards: [
        { icon: '📅', label: 'Appointments' },
        { icon: '💳', label: 'Payments' },
        { icon: '📄', label: 'Proposals' },
        { icon: '📈', label: 'New Leads' },
      ],
    },
    {
      id: 'coach',
      role: 'Coach',
      headline: 'Coach More. Coordinate Less.',
      sentence: 'Stay with your athletes while the details run themselves.',
      image: '/home/he-coach-athletes.jpg',
      imageAlt: 'Coach fully engaged with athletes',
      cards: [
        { icon: '🏀', label: 'Camp Registration' },
        { icon: '📅', label: 'Scheduling' },
        { icon: '💬', label: 'Parent Updates' },
        { icon: '🎥', label: 'Film Library' },
      ],
    },
    {
      id: 'nonprofit',
      role: 'Nonprofit',
      headline: 'Focus on the Mission.',
      sentence: 'Events and volunteers handled while you lead with presence.',
      image: '/home/he-nonprofit-golf.jpg',
      imageAlt: 'Nonprofit leader at a community event',
      cards: [
        { icon: '⛳', label: 'Registration' },
        { icon: '🤝', label: 'Sponsors' },
        { icon: '❤️', label: 'Donations' },
        { icon: '🙋', label: 'Volunteers' },
      ],
    },
    {
      id: 'creator',
      role: 'Creator',
      headline: 'Create.',
      sentence: "We'll handle the rest.",
      image: '/home/he-creator-filming.jpg',
      imageAlt: 'Creator filming content freely',
      cards: [
        { icon: '📹', label: 'Publishing' },
        { icon: '📱', label: 'Social Media' },
        { icon: '📧', label: 'Newsletter' },
        { icon: '📊', label: 'Analytics' },
      ],
    },
    {
      id: 'musician',
      role: 'Musician',
      headline: 'Perform.',
      sentence: "We'll grow your audience.",
      image: '/home/he-musician-stage.jpg',
      imageAlt: 'Musician performing before a packed audience',
      cards: [
        { icon: '🎟️', label: 'Events' },
        { icon: '🛍️', label: 'Merchandise' },
        { icon: '🎫', label: 'VIP Members' },
        { icon: '🎵', label: 'Bookings' },
      ],
    },
    {
      id: 'consultant',
      role: 'Consultant',
      headline: 'Advise.',
      sentence: 'Relationships deepen while admin stays quiet.',
      image: '/home/ch7-consultant.jpg',
      imageAlt: 'Consultant advising a team with clarity',
      cards: [
        { icon: '📋', label: 'Proposals' },
        { icon: '📅', label: 'Scheduling' },
        { icon: '💬', label: 'Client Updates' },
        { icon: '📊', label: 'Reporting' },
      ],
    },
    {
      id: 'school',
      role: 'School',
      headline: 'Inspire.',
      sentence: 'Families stay informed without endless email threads.',
      image: '/home/ch7-school.jpg',
      imageAlt: 'Teacher inspiring students in the classroom',
      cards: [
        { icon: '📅', label: 'Schedules' },
        { icon: '💳', label: 'Payments' },
        { icon: '📢', label: 'Announcements' },
        { icon: '📄', label: 'Forms' },
      ],
    },
    {
      id: 'church',
      role: 'Church',
      headline: 'Serve.',
      sentence: 'Community connection without the admin burden.',
      image: '/home/ch7-church.jpg',
      imageAlt: 'Pastor welcoming congregation members',
      cards: [
        { icon: '🙋', label: 'Volunteers' },
        { icon: '📅', label: 'Events' },
        { icon: '💬', label: 'Updates' },
        { icon: '❤️', label: 'Care' },
      ],
    },
    {
      id: 'healthcare',
      role: 'Healthcare',
      headline: 'Care.',
      sentence: 'Patients feel known while operations stay calm.',
      image: '/home/ch7-healthcare.jpg',
      imageAlt: 'Healthcare professional with a patient',
      cards: [
        { icon: '📅', label: 'Appointments' },
        { icon: '📋', label: 'Records' },
        { icon: '💬', label: 'Follow-up' },
        { icon: '📢', label: 'Updates' },
      ],
    },
  ] satisfies VisualStory[],
} as const;

export const chapter8 = {
  id: 'chapter-8',
  title: 'Why Custom Matters',
  intro: "Every organization is unique. Why would they all use identical software?",
  points: [
    'Every organization is unique.',
    'Every mission is unique.',
    'Every team is unique.',
    'Every process is unique.',
  ],
  conclusion:
    'Efficiency Architects designs systems around organizations instead of forcing organizations to adapt to software.',
  image: '/home/scene-business.jpg',
  imageAlt: 'A unique organization with its own identity and mission',
} as const;

export const chapter9 = {
  id: 'chapter-9',
  title: 'Everything Connected',
  intro: 'One beautiful connected ecosystem. Simplicity. Connection.',
  headline: 'One Platform.',
  headlineAccent: 'Unlimited Possibilities.',
  subheadline: 'Everything working together through one intelligent platform.',
  dashboardImage: '/home/portal-pulse.png',
  dashboardAlt: 'Pulse command center connecting everything',
  leftOrbit: [
    { icon: '🎓', label: 'Training' },
    { icon: '📂', label: 'Knowledge' },
    { icon: '📢', label: 'Communication' },
    { icon: '👥', label: 'Clients' },
  ],
  rightOrbit: [
    { icon: '📅', label: 'Events' },
    { icon: '✨', label: 'Opportunities' },
    { icon: '📊', label: 'Reports' },
    { icon: '🤖', label: 'AI' },
  ],
  ecosystem: [
    'Training',
    'Knowledge',
    'Communication',
    'Events',
    'Opportunities',
    'Content',
    'Clients',
    'Volunteers',
    'Members',
    'Reports',
    'AI',
  ],
} as const;

export const chapter10 = {
  id: 'chapter-10',
  title: 'Consider the Possibilities™',
  question: 'What would you love to spend more time doing?',
  choices: [
    {
      id: 'business',
      icon: '🏢',
      label: 'Growing my business',
      image: '/home/he-business-dinner.jpg',
      imageAlt: 'Growing a business with freedom',
      opener: "Let's explore what becomes possible when your business runs itself.",
      prompts: ['Getting my evenings back', 'Scaling without more admin', 'Never missing a lead again'],
    },
    {
      id: 'creating',
      icon: '🎨',
      label: 'Creating',
      image: '/home/he-creator-filming.jpg',
      imageAlt: 'Creating freely',
      opener: "Let's explore what becomes possible when distribution runs itself.",
      prompts: ['Publishing without juggling platforms', 'Growing while I create', 'Newsletters on autopilot'],
    },
    {
      id: 'coaching',
      icon: '🏀',
      label: 'Coaching',
      image: '/home/he-coach-athletes.jpg',
      imageAlt: 'Coaching with presence',
      opener: "Let's explore what becomes possible when coordination happens quietly.",
      prompts: ['Being on the field, not in my inbox', 'Parents always in the loop', 'Camps without admin chaos'],
    },
    {
      id: 'community',
      icon: '❤️',
      label: 'Serving my community',
      image: '/home/ch7-church.jpg',
      imageAlt: 'Serving community with presence',
      opener: "Let's explore what becomes possible when the mission comes first.",
      prompts: ['Events that run smoothly', 'Volunteers who show up prepared', 'Donors feeling connected'],
    },
    {
      id: 'relationships',
      icon: '🤝',
      label: 'Building relationships',
      image: '/home/ch7-consultant.jpg',
      imageAlt: 'Building trusted relationships',
      opener: "Let's explore what becomes possible when follow-up happens quietly.",
      prompts: ['Deeper client relationships', 'Never losing a touchpoint', 'More time with people'],
    },
    {
      id: 'training',
      icon: '🎓',
      label: 'Training my team',
      image: '/home/ch7-school.jpg',
      imageAlt: 'Training and inspiring a team',
      opener: "Let's explore what becomes possible when knowledge never disappears.",
      prompts: ['Onboarding that runs itself', 'Training available 24/7', 'Teams that stay aligned'],
    },
    {
      id: 'presence',
      icon: '📱',
      label: 'Increasing my presence',
      image: '/home/he-musician-stage.jpg',
      imageAlt: 'Growing presence and audience',
      opener: "Let's explore what becomes possible when your presence works while you sleep.",
      prompts: ['Content that publishes itself', 'Audience growth on autopilot', 'More stages, less spreadsheets'],
    },
    {
      id: 'opportunities',
      icon: '✨',
      label: 'Creating more opportunities',
      image: '/home/he-nonprofit-golf.jpg',
      imageAlt: 'Creating new opportunities',
      opener: "Let's explore what becomes possible when opportunity finds you.",
      prompts: ['Leads captured automatically', 'Opportunities never missed', 'Growth without the grind'],
    },
  ] satisfies ConsiderChoice[],
} as const;

export const finalScreen = {
  headline: 'Live YOUR Life™',
  message: "We'll build the systems that quietly make it possible.",
  cta: { label: 'Consider the Possibilities™', href: '#chapter-10' },
  image: '/home/he-business-dinner.jpg',
  imageAlt: 'Family, community, leadership, mentorship, purpose',
  themes: ['Family', 'Community', 'Leadership', 'Mentorship', 'Purpose'],
} as const;
