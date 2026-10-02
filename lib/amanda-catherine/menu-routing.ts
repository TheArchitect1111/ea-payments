import { amandaCourseReady } from './lms-policy';
export function getCourseMenuRoute(course: { id: string }, user: { purchasedCourseIds: readonly string[] }) {
  const sales = `/courses/${encodeURIComponent(course.id)}`;
  if (!amandaCourseReady(course.id)) return `${sales}#waitlist`;
  return user.purchasedCourseIds.includes(course.id)
    ? `/portal/amanda-catherine/learning/${encodeURIComponent(course.id)}` : sales;
}
