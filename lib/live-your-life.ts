/**
 * Efficiency Architects Marketing Experience™
 * Live YOUR Life™. Emotional storytelling, not a website.
 *
 * Theme: Every mission deserves an organization designed around it.
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
  cta: { label: 'Begin the Experience', href: '#mission' },
} as const;

export const missionIntro = {
  id: 'mission',
  lead: 'Every organization exists for a reason.',
  reasons: ['To educate.', 'To coach.', 'To serve.', 'To lead.', 'To heal.', 'To build community.'],
  body: [
    'Yet too many organizations spend their days managing work instead of fulfilling their mission.',
    'We believe your operations should strengthen your mission, not compete with it.',
    'When your systems fit the way you already work, your team spends less time learning processes and more time making an impact.',
  ],
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

export const connectedSection = {
  id: 'connected',
  theme: 'Every mission deserves an organization designed around it.',
  body: 'We believe every organization deserves an experience designed around its people, its mission, and the way it serves.',
  image: '/home/pulse-connected.png',
  imageAlt: 'People across an organization staying connected and informed through one calm system',
} as const;

export const chapter4 = {
  id: 'chapter-4',
  title: 'What If...',
  intro: '',
  image: '/home/he-hero-live.jpg',
  imageAlt: 'A calm moment of possibility and freedom',
  questions: [
    'parents always knew what came next?',
    'every registration or payment was acknowledged instantly?',
    'every confirmation included the right next steps?',
    'receipts, reminders, reports, and updates reached the right people automatically?',
    'volunteers always knew where to be and what to do?',
    'every new employee felt confident from day one?',
    'members and committees always stayed informed?',
    'clients felt supported long after the first conversation?',
  ],
  closing: 'What could your team accomplish if all of that simply happened?',
} as const;

export const chapter5 = {
  id: 'chapter-5',
  title: 'We Believe...',
  intro: "Great organizations don't happen by accident.",
  image: '/home/possible-leader.jpg',
  imageAlt: 'A leader with calm confidence and clarity',
  beliefs: [
    "They're designed.",
    'Designed around the people they serve.',
    'Designed around the teams who bring the mission to life.',
    'Designed to create clarity instead of confusion.',
    'Designed to build confidence instead of uncertainty.',
    'Designed to help people find what they need, know what comes next, and move forward with purpose.',
  ],
  closing:
    'Because when an organization is thoughtfully designed, people spend less time navigating the work and more time accomplishing it.',
} as const;

export const chapter6 = {
  id: 'chapter-6',
  title: 'How We Think',
  intro: 'Watching architects create a blueprint, not consultants presenting a process.',
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
  title: 'Designed for Your Organization',
  intro: '',
  points: [
    'Every organization is different.',
    'Every mission is different.',
    'Every team is different.',
    'Every community is different.',
  ],
  conclusion: 'So why should every organization operate the same way?',
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
  dashboardImage: '/home/pulse-command-center.png',
  dashboardAlt:
    'The Pulse command center: a live portal showing revenue, leads, projects, pipeline, and cash flow, surrounded by the automations running quietly in the background, from lead capture and email to proposals, payments, and onboarding',
  caption: 'A real command center. One place to see your whole organization, with every step running quietly in the background.',
  quote: {
    lines: ['EVERY MISSION DESERVES', 'AN ORGANIZATION', 'DESIGNED AROUND IT.'],
    attribution: 'Efficiency Architects',
  },
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
      icon: '🏡',
      label: 'Spending time where it matters!',
      image: '/home/he-business-dinner.jpg',
      imageAlt: 'Present with family while the business keeps running',
      opener: "Let's explore what becomes possible when your business runs without you in every detail.",
      prompts: ['Getting my evenings back', 'Being present with the people I love', 'Never missing a lead again'],
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
      icon: '🙋',
      label: 'Volunteering',
      image: '/home/ch7-school.jpg',
      imageAlt: 'Volunteers giving their time and making an impact',
      opener: "Let's explore what becomes possible when your volunteers always feel supported and prepared.",
      prompts: ['Volunteers who show up ready', 'Schedules everyone can see', 'Less coordinating, more impact'],
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
  cta: { label: 'Consider The Possibilities!', href: '#chapter-10' },
  image: '/home/he-business-dinner.jpg',
  imageAlt: 'Family, community, leadership, mentorship, purpose',
  themes: ['Family', 'Community', 'Leadership', 'Mentorship', 'Purpose'],
} as const;

export const bottomCta = {
  theme: 'Every mission deserves an organization designed around it.',
  message: "Let's design yours.",
  cta: { label: 'Consider The Possibilities!', href: '/contact' },
} as const;
