import { resourcesForAmandaCourse } from './course-resources';
import { amandaCourseReady } from './lms-policy';

export function amandaMemberResources(purchasedCourseIds: readonly string[]) {
  return [...new Set(purchasedCourseIds)]
    .filter(amandaCourseReady)
    .flatMap(resourcesForAmandaCourse);
}
