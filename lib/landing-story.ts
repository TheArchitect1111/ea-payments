import { storyImage } from './landing-visuals';

export type StoryScene = {
  id: string;
  eyebrow: string;
  currentLabel: string;
  possibleLabel: string;
  current: string;
  possible: string;
  story: string;
  currentImage: string;
  possibleImage: string;
  currentAlt: string;
  possibleAlt: string;
  guide: string;
};

export const storyScenes: StoryScene[] = [
  {
    id: 'life',
    eyebrow: 'Life beyond the work',
    currentLabel: 'Current Reality',
    possibleLabel: "What's Possible",
    current: "You didn't start this to manage systems.",
    possible: 'You started this to build a life with room for purpose.',
    story: 'A founder moves from late-night dependency to mornings coaching, creating, volunteering, and being present with family.',
    currentImage: storyImage('photo-1516321497487-e288fb19713f'),
    possibleImage: storyImage('photo-1476705147036-43cd080da2f3'),
    currentAlt: 'A business owner working alone late at night while family life continues without them',
    possibleAlt: 'A multigenerational family spending unhurried time together outdoors',
    guide: 'Freedom is the point — room for people, purpose, and life beyond operational weight.',
  },
  {
    id: 'communication',
    eyebrow: 'Communication',
    currentLabel: 'Current Reality',
    possibleLabel: "What's Possible",
    current: "Nobody knows what's happening.",
    possible: 'Everyone knows what comes next.',
    story: 'A coach stops answering the same parent questions and spends that time with athletes instead.',
    currentImage: storyImage('photo-1573497019940-88c6a86b0a2f'),
    possibleImage: storyImage('photo-1593113598148-3655c4d566bb'),
    currentAlt: 'Team members reaching out from different locations while information stays fragmented',
    possibleAlt: 'A diverse youth sports team and coach aligned in a focused pre-game huddle',
    guide: 'The cost of scattered updates is confusion. Possibility is clarity before questions begin.',
  },
  {
    id: 'training',
    eyebrow: 'Training',
    currentLabel: 'Current Reality',
    possibleLabel: "What's Possible",
    current: 'Training starts over every day.',
    possible: 'Knowledge is always available.',
    story: 'A nonprofit leader stops repeating the same explanation and lets new staff learn naturally, at the moment they need it.',
    currentImage: storyImage('photo-1582213782179-0a00d435e7de'),
    possibleImage: storyImage('photo-1523245775816-ff31a218c6be'),
    currentAlt: 'An experienced Hispanic nonprofit leader repeating the same training for a new volunteer',
    possibleAlt: 'A racially diverse group of adult learners confidently learning together at their own pace',
    guide: 'Knowledge should not live in one person. It should be repeatable, visible, and easy to pass on.',
  },
  {
    id: 'visibility',
    eyebrow: 'Visibility',
    currentLabel: 'Current Reality',
    possibleLabel: "What's Possible",
    current: "You can't see what you can't see.",
    possible: 'See what matters sooner.',
    story: 'An executive director moves from reacting all day to recognizing patterns early enough to lead with calm.',
    currentImage: storyImage('photo-1454165804606-ff69b5c36a2c'),
    possibleImage: storyImage('photo-1573496359142-b8d87734a5a2'),
    currentAlt: 'A leader reviewing scattered reports late at night trying to understand organizational health',
    possibleAlt: 'A Black woman executive director reviewing priorities with calm, early awareness',
    guide: 'Visibility is the shift from surprise to awareness — seeing signals early enough to choose, not scramble.',
  },
  {
    id: 'capacity',
    eyebrow: 'Capacity',
    currentLabel: 'Current Reality',
    possibleLabel: "What's Possible",
    current: 'Everyone is busy.',
    possible: 'People have space to thrive.',
    story: 'A stretched team stops surviving the week and starts contributing ideas, improving the work, and breathing again.',
    currentImage: storyImage('photo-1551836022-d5d88e9218df'),
    possibleImage: storyImage('photo-1517242814-67b8a5f8797'),
    currentAlt: 'Staff and volunteers overwhelmed by administrative work instead of serving their mission',
    possibleAlt: 'A diverse team with breathing room to think, mentor, and improve the work together',
    guide: 'Capacity is not about doing more. It is about removing repetition so good people can thrive.',
  },
  {
    id: 'impact',
    eyebrow: 'Impact',
    currentLabel: 'Current Reality',
    possibleLabel: "What's Possible",
    current: 'Too much potential gets lost.',
    possible: 'More of what matters gets done.',
    story: 'A community organization captures more opportunities, serves more people, and turns good intentions into visible progress.',
    currentImage: storyImage('photo-1488521787991-ed7bbaae773c'),
    possibleImage: storyImage('photo-1469571486212-0f58a3e6062a'),
    currentAlt: 'Opportunities and community needs slipping away unnoticed',
    possibleAlt: 'A racially diverse volunteer team serving meals and creating visible community impact',
    guide: 'When fewer things fall through the cracks, more people receive the help you meant to give.',
  },
];

export const futureSegments = {
  school: {
    label: 'Schools',
    lines: [
      'Imagine every parent knowing exactly what is happening before they need to ask.',
      'Imagine new staff learning the rhythm of the school in days, not months.',
      'Imagine administrators seeing small issues before they become urgent.',
    ],
    image: storyImage('photo-1580582938317-8005863959d1', 1200),
    imageAlt: 'School leaders and staff moving with clarity through a bright, welcoming campus',
  },
  nonprofit: {
    label: 'Nonprofits',
    lines: [
      'Imagine volunteers arriving prepared, confident, and clear on what matters.',
      'Imagine programs moving without every answer depending on one leader.',
      'Imagine more families helped because the work finally has room to scale.',
    ],
    image: storyImage('photo-1559027615-cd4628902d4a', 1200),
    imageAlt: 'A diverse volunteer team serving their community with confidence and joy',
  },
  sports: {
    label: 'Sports',
    lines: [
      'Imagine parents, athletes, and coaches sharing one clear rhythm.',
      'Imagine training, updates, and opportunities reaching the right people at the right time.',
      'Imagine coaches spending less time repeating details and more time developing athletes.',
    ],
    image: storyImage('photo-1518611012118-696072aa579a', 1200),
    imageAlt: 'A coach developing athletes on the field with full presence and purpose',
  },
  church: {
    label: 'Churches',
    lines: [
      'Imagine volunteers knowing exactly where to serve before Sunday morning.',
      'Imagine pastoral care continuing without every detail living in one inbox.',
      'Imagine your congregation feeling informed, connected, and ready to respond.',
    ],
    image: storyImage('photo-1438232953991-611fd813685f', 1200),
    imageAlt: 'A multicultural congregation gathered in worship, community, and shared purpose',
  },
  business: {
    label: 'Business',
    lines: [
      'Imagine your team knowing what matters without chasing you for every answer.',
      'Imagine customers feeling guided, informed, and remembered.',
      'Imagine leadership energy returning to growth, relationships, and vision.',
    ],
    image: storyImage('photo-1507679616480-389c2a94501a', 1200),
    imageAlt: 'A business owner leading with clarity while a diverse team moves with confidence',
  },
  creators: {
    label: 'Creators',
    lines: [
      'Imagine your audience receiving what you promised without you repeating yourself.',
      'Imagine your systems running while you create, teach, and build.',
      'Imagine more of your energy going into the work only you can do.',
    ],
    image: storyImage('photo-1498050108023-c5249f4df085', 1200),
    imageAlt: 'A creator working with focus while collaborators build alongside them',
  },
} as const;

export type FutureKey = keyof typeof futureSegments;

export const futureSegmentOrder: FutureKey[] = [
  'school',
  'nonprofit',
  'sports',
  'church',
  'business',
  'creators',
];
