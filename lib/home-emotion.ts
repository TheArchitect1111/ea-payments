/**
 * EA Athletics Experience.
 * A coach journey, not a generic business website.
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
  bright?: boolean;
  imagePosition?: string;
};

export const heroContent = {
  headline: 'Coach Again.',
  subheadline:
    'A cinematic journey for coaches who built something meaningful and need the organization to finally work together.',
  image: '/home/he-coach-athletes.jpg',
  imageAlt: 'A coach fully present with athletes during practice',
  ctaPrimary: { label: 'Begin the Journey', href: '#experiences' },
  ctaSecondary: { label: 'See the Landing Page + Portal', href: '#athletics' },
} as const;

export const experienceStories: ExperienceStory[] = [
  {
    id: 'why-we-coach',
    headline: 'Every coach starts with a dream.',
    sentence: 'A team. A season. A young athlete who needs someone to believe in them.',
    image: '/home/he-coach-athletes.jpg',
    imageAlt: 'Coach teaching athletes with focus and care',
    bright: true,
    imagePosition: 'center 35%',
    cards: [
      { icon: '01', label: 'Purpose' },
      { icon: '02', label: 'Teaching' },
      { icon: '03', label: 'Development' },
      { icon: '04', label: 'Belonging' },
    ],
  },
  {
    id: 'success-changes',
    headline: 'Success changes everything.',
    sentence: 'One team becomes more teams. More athletes. More parents. More camps. More details.',
    image: '/home/scene-sports-org.jpg',
    imageAlt: 'Families and athletes gathered at a busy sports organization event',
    bright: true,
    imagePosition: 'center 45%',
    cards: [
      { icon: '05', label: 'Teams' },
      { icon: '06', label: 'Families' },
      { icon: '07', label: 'Camps' },
      { icon: '08', label: 'Volunteers' },
    ],
  },
  {
    id: 'the-weight',
    headline: 'Then the work starts covering the coach.',
    sentence: 'Questions, registrations, payments, waivers, schedules, hotels, film, messages, and reminders multiply.',
    image: '/home/ch2-invisible-work.jpg',
    imageAlt: 'A leader surrounded by invisible administrative work',
    bright: true,
    cards: [
      { icon: '09', label: 'Registration' },
      { icon: '10', label: 'Payments' },
      { icon: '11', label: 'Waivers' },
      { icon: '12', label: 'Messages' },
    ],
  },
  {
    id: 'landing-page',
    headline: 'The Landing Page starts the relationship.',
    sentence: 'Families see the program, understand the path, trust the standard, and register with confidence.',
    image: '/ea-athletics-samples/1000037821.png',
    imageAlt: 'Premium athletics landing page for a volleyball organization',
    bright: true,
    imagePosition: 'top center',
    cards: [
      { icon: '13', label: 'Programs' },
      { icon: '14', label: 'Coach Bios' },
      { icon: '15', label: 'Events' },
      { icon: '16', label: 'Registration' },
    ],
  },
  {
    id: 'portal',
    headline: 'The Portal keeps everyone moving.',
    sentence: 'Coaches, parents, athletes, staff, volunteers, and sponsors each see exactly what they need.',
    image: '/ea-athletics-samples/1000037823.png',
    imageAlt: 'Coach portal dashboard for a baseball organization',
    imagePosition: 'top center',
    cards: [
      { icon: '17', label: 'Schedules' },
      { icon: '18', label: 'Attendance' },
      { icon: '19', label: 'Messages' },
      { icon: '20', label: 'Resources' },
    ],
  },
  {
    id: 'while-you-coach',
    headline: 'While you coach, the organization works.',
    sentence: 'Registration complete. Payment received. Schedule updated. Reminder sent. The coach never leaves the field.',
    image: '/home/possible-coach.jpg',
    imageAlt: 'Coach fully present with athletes during practice',
    bright: true,
    imagePosition: 'center 40%',
    cards: [
      { icon: '21', label: 'Reminder Sent' },
      { icon: '22', label: 'Waiver Approved' },
      { icon: '23', label: 'Camp Filled' },
      { icon: '24', label: 'Profile Updated' },
    ],
  },
];

export type PulseFeature = { icon: string; label: string };

export type AthleticsSample = {
  id: string;
  label: string;
  kind: 'Landing Page' | 'Portal';
  sport: string;
  image: string;
  imageAlt: string;
  theme: string;
};

export const athleticsShowcase = {
  eyebrow: 'EA Athletics Experience',
  headline: 'First they see the program. Then they enter the system.',
  intro:
    'The public Landing Page builds confidence. The private Portal removes friction. Together, they become the operating system behind the season.',
  samples: [
    {
      id: 'volleyball-landing',
      label: 'Elevate Volleyball',
      kind: 'Landing Page',
      sport: 'Volleyball',
      image: '/ea-athletics-samples/1000037821.png',
      imageAlt: 'Elevate Volleyball premium landing page with hero photography, programs, family proof, and registration calls to action',
      theme: 'Black, white, and orange public program experience',
    },
    {
      id: 'tennis-landing',
      label: 'Elevate Tennis',
      kind: 'Landing Page',
      sport: 'Tennis',
      image: '/ea-athletics-samples/1000037822.png',
      imageAlt: 'Elevate Tennis premium landing page with programs, mission, recruiting, and camp pathways',
      theme: 'Navy and electric green public program experience',
    },
    {
      id: 'baseball-portal',
      label: 'Redline Baseball',
      kind: 'Portal',
      sport: 'Baseball',
      image: '/ea-athletics-samples/1000037823.png',
      imageAlt: 'Redline Baseball dark coach portal dashboard with schedules, payments, announcements, tasks, and player spotlight',
      theme: 'Dark coach command center',
    },
    {
      id: 'basketball-portal',
      label: 'Elevate Basketball',
      kind: 'Portal',
      sport: 'Basketball',
      image: '/ea-athletics-samples/1000037824.png',
      imageAlt: 'Elevate Basketball light business portal dashboard with revenue, registrations, schedules, messages, and team operations',
      theme: 'Light program director command center',
    },
  ] satisfies AthleticsSample[],
} as const;

export const pulseReveal = {
  headline: 'Everyone connected.',
  headlineAccent: 'The coach back on the field.',
  subheadline:
    'The EA Portal becomes the quiet system behind registration, communication, schedules, resources, payments, and growth.',
  dashboardImage: '/ea-athletics-samples/1000037824.png',
  dashboardAlt: 'Athletics program portal dashboard with teams, revenue, registrations, schedules, messages, and operations',
  leftFeatures: [
    { icon: 'A', label: 'Athletes' },
    { icon: 'P', label: 'Parents' },
    { icon: 'C', label: 'Coaches' },
    { icon: 'V', label: 'Volunteers' },
  ] as PulseFeature[],
  rightFeatures: [
    { icon: 'S', label: 'Schedules' },
    { icon: 'R', label: 'Registration' },
    { icon: '$', label: 'Payments' },
    { icon: 'M', label: 'Messaging' },
  ] as PulseFeature[],
} as const;

export type CoachVisionOption = {
  id: string;
  label: string;
};

export const considerContent = {
  headline: 'Imagine Your Organization',
  question: 'Answer three questions and see the shape of your Landing Page + Portal Experience.',
  sports: [
    { id: 'basketball', label: 'Basketball' },
    { id: 'football', label: 'Football' },
    { id: 'soccer', label: 'Soccer' },
    { id: 'baseball', label: 'Baseball' },
    { id: 'volleyball', label: 'Volleyball' },
    { id: 'tennis', label: 'Tennis' },
    { id: 'swimming', label: 'Swimming' },
    { id: 'track', label: 'Track' },
  ] as CoachVisionOption[],
  organizations: [
    { id: 'school', label: 'High school program' },
    { id: 'club', label: 'Club or travel team' },
    { id: 'academy', label: 'Training academy' },
    { id: 'camp', label: 'Camp or clinic business' },
    { id: 'league', label: 'League or tournament' },
    { id: 'recruiting', label: 'Recruiting service' },
  ] as CoachVisionOption[],
  athletes: [
    { id: 'under-50', label: 'Under 50 athletes' },
    { id: '50-150', label: '50-150 athletes' },
    { id: '150-500', label: '150-500 athletes' },
    { id: '500-plus', label: '500+ athletes' },
  ] as CoachVisionOption[],
} as const;
