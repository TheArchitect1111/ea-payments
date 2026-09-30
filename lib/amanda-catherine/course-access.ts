import { AMANDA_COURSES, type AmandaPortalAudience } from './config';

export function coursesForAudience(audience: AmandaPortalAudience) {
  if (audience === 'admin') return AMANDA_COURSES;
  return AMANDA_COURSES.filter((course) => course.audience === audience);
}

export function audienceCanAccessCourse(audience: AmandaPortalAudience, courseId: string) {
  return coursesForAudience(audience).some((course) => course.id === courseId);
}

export function coursesForAccount(
  audience: AmandaPortalAudience,
  assignedCourseIds: readonly string[],
  isAdmin = false,
) {
  if (isAdmin || audience === 'admin') return AMANDA_COURSES;
  if (assignedCourseIds.length) {
    const assigned = new Set(assignedCourseIds);
    return AMANDA_COURSES.filter((course) => assigned.has(course.id));
  }
  return coursesForAudience(audience);
}

export function accountCanAccessCourse(
  audience: AmandaPortalAudience,
  assignedCourseIds: readonly string[],
  courseId: string,
  isAdmin = false,
) {
  return coursesForAccount(audience, assignedCourseIds, isAdmin).some((course) => course.id === courseId);
}

