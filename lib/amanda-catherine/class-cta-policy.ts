/** Amanda's approved public CTA availability. Rendering-only policy.
 * Do not mutate Creative Studio statuses, prices or Square checkout URLs.
 */
const AVAILABLE_SQUARE_CLASSES = new Set([
  'wood-therapy',
  'non-surgical-bbl',
  'body-sculpt-certification',
  'nervous-system-reset',
  'clinical-fat-loss',
  'strategy-call',
]);
export function isAmandaBuyNowClass(courseKey: string): boolean {
  return AVAILABLE_SQUARE_CLASSES.has(courseKey);
}
export function isAmandaStarterKitInquiry(courseKey: string): boolean {
  return courseKey === 'starter-kit';
}
export function amandaClassCopy(description: string, available: boolean): string {
  const text = description.trim();
  if (available) return text && !/waitlist|availability updates/i.test(text)
    ? text : 'Explore this program with Amanda.';
  return 'Join the waitlist for availability updates.';
}
