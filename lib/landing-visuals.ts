/** Curated documentary-style imagery for the premium landing story. */

export function storyImage(photoId: string, width = 1400) {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&q=80`;
}

export const landingHero = {
  src: storyImage('photo-1522202176988-66273c2fd55f', 1600),
  alt: 'A diverse group of leaders, coaches, educators, and community builders engaged in purposeful conversation',
};

export const waitMomentVisual = {
  src: storyImage('photo-1504384308090-c894fdcc538d', 1600),
  alt: 'A nonprofit executive carrying every responsibility alone while others wait for direction',
};

export const goosebumpsVisual = {
  current: {
    src: storyImage('photo-1516321497487-e288fb19713f', 1400),
    alt: 'A founder working late at night while the mission waits on their shoulders',
  },
  possible: {
    src: storyImage('photo-1518611012118-696072aa579a', 1400),
    alt: 'A coach fully present with athletes on the field, leading the work they love',
  },
};

export const trustStories = [
  {
    role: 'Executive Director, Community Nonprofit',
    outcome: 'Volunteer onboarding time dropped while program reach expanded.',
    quote: 'We stopped losing families in the gaps between spreadsheets, inboxes, and one person’s memory.',
  },
  {
    role: 'Head Coach, Youth Sports Program',
    outcome: 'Parents stopped chasing updates. Coaches returned to the field.',
    quote: 'For the first time, everyone knew what came next before they had to ask.',
  },
  {
    role: 'Pastor, Multicultural Congregation',
    outcome: 'Volunteers arrived prepared. Pastoral care continued beyond Sunday.',
    quote: 'The work no longer lived in one inbox. The congregation could move together.',
  },
] as const;

export const SUPPORT_EMAIL = 'freedom@efficiencyarchitects.online';
