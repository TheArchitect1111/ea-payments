import type { AmandaWebsiteProps } from '@/app/components/experience/themes/amanda-editorial/AmandaEditorialExperiences';

export const amandaWebsitePreview: AmandaWebsiteProps = {
  brand: { first: 'Amanda', last: 'Catherine' },
  navigation: [{ label: 'About', href: '#about' }, { label: 'Experiences', href: '#experiences' }, { label: 'Events', href: '#events' }, { label: 'Resources', href: '#resources' }],
  hero: {
    eyebrow: 'Helping people', title: 'Turn their gifts into purpose,', accent: 'impact,', tail: 'and sustainable opportunity.',
    body: 'Through creativity, wellness, education, and empowerment, we build lives and businesses that make a difference.',
    image: '/images/amanda-editorial/amanda-studio-hero.jpg', quote: 'You were created for more than you can imagine.', action: { label: 'Find Your Path', href: '#experiences' },
  },
  paths: [
    { number: '01', script: 'Create', label: 'Empower Art Collective', body: 'For artists and creatives building sustainable careers.', href: '#', image: '/images/amanda-editorial/amanda-journeys-grid.jpg', imagePosition: '0% 0%' },
    { number: '02', script: 'Heal', label: 'Aesthetikine', body: 'Wellness services and holistic care for mind, body, and spirit.', href: '#', image: '/images/amanda-editorial/amanda-journeys-grid.jpg', imagePosition: '50% 0%' },
    { number: '03', script: 'Learn', label: 'The Entrepreneurial Artist', body: 'Books, courses, and practical tools to turn talent into opportunity.', href: '#', image: '/images/amanda-editorial/amanda-journeys-grid.jpg', imagePosition: '100% 0%' },
    { number: '04', script: 'Speak', label: 'Speaking & Events', body: 'Keynotes, workshops, and transformative conversations.', href: '#', image: '/images/amanda-editorial/amanda-journeys-grid.jpg', imagePosition: '0% 100%' },
    { number: '05', script: 'Partner', label: 'Strategic Partnerships', body: 'Collaborate on impact-driven projects and initiatives.', href: '#', image: '/images/amanda-editorial/amanda-journeys-grid.jpg', imagePosition: '50% 100%' },
    { number: '06', script: 'Begin', label: 'Not sure where to start?', body: 'Answer a few questions and receive a personalized path.', href: '#', image: '/images/amanda-editorial/amanda-journeys-grid.jpg', imagePosition: '100% 100%' },
  ],
  mission: { eyebrow: 'One mission', title: 'Many ways to experience it.', body: 'Everything we do is connected by one purpose: to help you discover your gifts, develop your potential, and create a life of meaning and impact.', signature: 'Amanda Catherine' },
  identities: ['Creator', 'Entrepreneur', 'Wellness Advocate', 'Author', 'Speaker', 'Mentor'],
};

export const amandaPortalNav = [
  { id: 'journey' as const, label: 'Your Journey', href: '#' },
  { id: 'progress' as const, label: 'Progress', href: '#' },
  { id: 'documents' as const, label: 'Documents', href: '#' },
  { id: 'messages' as const, label: 'Messages', href: '#' },
  { id: 'support' as const, label: 'Support', href: '#' },
];
