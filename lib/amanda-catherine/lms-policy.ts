// Locked to specs/amanda-lms-locked-v2/SOURCE_OF_TRUTH_v2.0.md.
export const AMANDA_SUPPORT_WORDING = 'Includes 90 days of clinical integration support and business mentorship.';
export const AMANDA_READY_COURSE_IDS: readonly string[] = [
  'aesthetikine-reset-training', 'body-sculpt-practitioner-certification',
  'non-surgical-bbl-training', 'wood-therapy-certification',
];
export function amandaCourseStatus(courseId: string): 'READY' | 'WAITLIST' {
  return AMANDA_READY_COURSE_IDS.includes(courseId) ? 'READY' : 'WAITLIST';
}
export function amandaCourseReady(courseId: string) { return amandaCourseStatus(courseId) === 'READY'; }
export function amandaSupportWindow(trainingDate?: string, now = new Date()) {
  if (!trainingDate || !/^\d{4}-\d{2}-\d{2}$/.test(trainingDate)) return null;
  const start = new Date(`${trainingDate}T00:00:00Z`);
  if (!Number.isFinite(start.getTime()) || start.toISOString().slice(0, 10) !== trainingDate) return null;
  const end = new Date(start); end.setUTCDate(end.getUTCDate() + 90);
  const today = new Date(now.toISOString().slice(0, 10) + 'T00:00:00Z');
  return { startsOn: trainingDate, endsOn: end.toISOString().slice(0, 10),
    status: today < start ? 'scheduled' : today >= end ? 'ended' : 'active',
    daysRemaining: Math.max(0, Math.min(90, Math.ceil((end.getTime() - today.getTime()) / 86400000))) };
}
