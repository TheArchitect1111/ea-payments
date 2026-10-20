import { AMANDA_COURSE_RESOURCES } from './course-resources';
import { amandaCourseReady } from './lms-policy';

function resourcesForAmandaCourse(courseId: string) {
  return AMANDA_COURSE_RESOURCES[courseId as keyof typeof AMANDA_COURSE_RESOURCES] || [];
}

export function amandaMemberResources(purchasedCourseIds: readonly string[]) {
  return [...new Set(purchasedCourseIds)]
    .filter(amandaCourseReady)
    .flatMap(resourcesForAmandaCourse);
}
