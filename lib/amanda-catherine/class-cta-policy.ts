/** Amanda's approved class CTA display policy. Prices and Square URLs stay in Creative Studio. */
export const AMANDA_AVAILABLE_CLASS_KEYS = [
  'wood-therapy',
  'non-surgical-bbl',
  'body-sculpt-certification',
  'nervous-system-reset',
  'clinical-fat-loss',
  'strategy-call',
] as const;

export const AMANDA_WAITLIST_CLASS_KEYS = [
  'advanced-body-sculpt',
  'lifeline-live',
  '90-day-package',
  'foundry-mentorship',
  'starter-kit',
  'the-entrepreneurial-artist',
] as const;

const available = new Set<string>(AMANDA_AVAILABLE_CLASS_KEYS);
const waitlist = new Set<string>(AMANDA_WAITLIST_CLASS_KEYS);

export function amandaClassCtaStatus(slug: string): 'available' | 'waitlist' | null {
  const key = slug === 'clinical-fat-loss-injectables' ? 'clinical-fat-loss' : slug;
  if (available.has(key)) return 'available';
  if (waitlist.has(key)) return 'waitlist';
  return null;
}

export function amandaClassCardDescription(description: string | null | undefined, status: 'available' | 'waitlist') {
  if (status === 'available') {
    return !description?.trim() || /waitlist|wait list|availability updates/i.test(description)
      ? 'Explore this program with Amanda.'
      : description;
  }
  return 'Join the waitlist for availability updates.';
}

export function amandaClassButtonLabel(slug: string) {
  return slug === 'starter-kit' ? 'Request Info' : 'Join Waitlist';
}
