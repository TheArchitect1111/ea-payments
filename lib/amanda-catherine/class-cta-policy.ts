/** Amanda class CTA policy: presentation only; prices and Square URLs stay in Creative Studio. */
export const AMANDA_BUY_NOW_KEYS = new Set([
  'wood-therapy', 'non-surgical-bbl', 'body-sculpt-certification',
  'nervous-system-reset', 'clinical-fat-loss', 'strategy-call',
]);
export function amandaIsAvailableNow(course: {key:string;square_checkout_url:string|null}) {
  return AMANDA_BUY_NOW_KEYS.has(course.key) && Boolean(course.square_checkout_url);
}
export function amandaCtaDescription(course: {key:string;description:string},available:boolean) {
  if (!available) return 'Join the waitlist for availability updates.';
  const copy=course.description.trim();
  return !copy || /waitlist|availability updates|coming soon|not available/i.test(copy)
    ? 'Explore this program with Amanda.' : copy;
}
export function amandaWaitlistLabel(key:string) {
  return key === 'starter-kit' ? 'Request Info' : 'Join Waitlist';
}
