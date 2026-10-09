'use client';

import { usePathname } from 'next/navigation';

const ROUTE_NAMES: Record<string, string> = {
  apply: 'Application',
  book: 'Book',
  foundry: 'Foundry Mentorship',
  hub: 'Update Hub',
  calendar: 'Calendar',
  eva: 'Eva',
  enroll: 'Enrollment',
};

const THANK_YOU_COPY: Record<string, string> = {
  Application: 'Thank you for your interest in the Foundry Application. Tell us about your next step below.',
  Book: 'Thank you for choosing to book with Amanda. Continue below.',
  'Foundry Mentorship': 'Thank you for your interest in Foundry Mentorship. Details are below.',
  'Update Hub': 'Thank you for visiting the Update Hub. Recent activity and next steps are below.',
  Calendar: 'Thank you for checking Amanda’s calendar. Upcoming dates and booking options are below.',
  Eva: 'Thank you for connecting with Eva. Ask your question below.',
  Enrollment: 'Thank you for your interest in learning with Amanda. Continue below for enrollment details.',
};

export function getThankYouNote(appName: string): string {
  const normalized = appName.trim();
  return THANK_YOU_COPY[normalized] ?? `Thank you for your interest in ${normalized}. Continue below.`;
}

export default function AppHeaderNote({ appName }: { appName?: string }) {
  const pathname = usePathname() || '';
  const segments = pathname.split('/').filter(Boolean);
  const slug = segments.at(-1) ?? '';
  if (!appName && ['classes', 'waitlist', 'enroll'].includes(slug)) return null;

  const resolvedName =
    appName ??
    ROUTE_NAMES[slug] ??
    slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) ??
    'Amanda Catherine';

  return (
    <header className="amanda-app-note mx-auto mb-8 max-w-5xl rounded-2xl border border-[#e7e1d7] bg-white px-6 py-8 text-center shadow-sm md:rounded-3xl md:px-12 md:py-12">
      <p className="amanda-app-note__eyebrow mb-3 text-xs font-semibold tracking-[0.2em] text-[#657b68]">AMANDA CATHERINE</p>
      <h1 className="mb-3 font-serif text-4xl tracking-tight text-[#17211c] md:text-5xl">{resolvedName}</h1>
      <p className="mx-auto max-w-2xl text-base leading-7 text-[#4d5b52] md:text-lg">{getThankYouNote(resolvedName)}</p>
    </header>
  );
}
