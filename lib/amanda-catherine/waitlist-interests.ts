import { AMANDA_COURSES } from './config';
import { amandaCourseReady } from './lms-policy';
export const AMANDA_WAITLIST_MENU_IDS = ['preparation-and-aftercare', 'wellness-plan', 'practitioner-directory', 'referrals', 'professional-opportunities', 'community-directory', 'groups-and-discussions', 'production-status', 'schedule-and-assignments', 'policies-and-training', 'participation-hours', 'assigned-work', 'users-and-permissions', 'automations-and-communications'] as const;
export function findAmandaWaitlistInterest(slug: string) {
 const course = AMANDA_COURSES.find(c => c.id === slug);
 if (course) return amandaCourseReady(course.id) ? null : { id: course.id, title: course.title };
 return AMANDA_WAITLIST_MENU_IDS.find(id => id === slug) ? { id: slug, title: slug.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join(' ') } : null;
}
