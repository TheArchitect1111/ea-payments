import { amandaCourseReady } from './lms-policy';
export function getCourseMenuRoute(course: { id: string; slug?: string; status?: string }, user: { purchasedCourseIds: readonly string[] }) {
  const sales = `/courses/${encodeURIComponent(course.slug || course.id)}`;
  if ((course.status !== undefined && course.status !== 'READY') || !amandaCourseReady(course.id)) return `${sales}#waitlist`;
  return user.purchasedCourseIds.includes(course.id)
    ? `/portal/amanda-catherine/learning/${encodeURIComponent(course.id)}` : sales;
}
