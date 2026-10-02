import { AMANDA_COURSES, type AmandaPortalAudience } from './config';
import { amandaCourseReady } from './lms-policy';

export function coursesForAudience(audience: AmandaPortalAudience) {
  void audience;
  return [] as (typeof AMANDA_COURSES)[number][]; // Audience is not an entitlement.
}

export function audienceCanAccessCourse(audience: AmandaPortalAudience, courseId: string) {
  return coursesForAudience(audience).some((course) => course.id === courseId);
}

export function coursesForAccount(
  audience: AmandaPortalAudience,
  assignedCourseIds: readonly string[],
  isAdmin = false,
) {
  if (isAdmin) return AMANDA_COURSES;
  const assigned = new Set(assignedCourseIds);
  return AMANDA_COURSES.filter((course) => assigned.has(course.id) && amandaCourseReady(course.id));
}

export function accountCanAccessCourse(
  audience: AmandaPortalAudience,
  assignedCourseIds: readonly string[],
  courseId: string,
  isAdmin = false,
) {
  return coursesForAccount(audience, assignedCourseIds, isAdmin).some((course) => course.id === courseId);
}

