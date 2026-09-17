import { listAmandaCourseProgress } from './progress-store';
import { AMANDA_CANONICAL_ACADEMY_COURSES } from './canonical-courses';

export const AMANDA_JANE_URL = process.env.AMANDA_JANE_BOOKING_URL || 'https://aesthetikine.janeapp.com/';

export async function getAmandaAcademyOperations() {
  const progress = await listAmandaCourseProgress('amanda-catherine');
  const students = new Map<string, { email: string; courses: Set<string>; certificates: number; updatedAt: string }>();
  for (const item of progress) {
    const current = students.get(item.email) || { email: item.email, courses: new Set<string>(), certificates: 0, updatedAt: item.updatedAt };
    current.courses.add(item.courseId);
    if (item.certificateIssuedAt) current.certificates += 1;
    if (item.updatedAt > current.updatedAt) current.updatedAt = item.updatedAt;
    students.set(item.email, current);
  }
  return {
    courses: AMANDA_CANONICAL_ACADEMY_COURSES,
    progress,
    students: [...students.values()].map((student) => ({ ...student, courses: [...student.courses] })),
    certificateCount: progress.filter((item) => item.certificateIssuedAt).length,
  };
}

export const AMANDA_LIFELINE_OPERATIONS = {
  program: 'LIFELINE',
  launchPackageCad: 997,
  strategyCallCad: 250,
  strategy90DayCad: 2500,
  source: 'existing Amanda business configuration',
} as const;

export const AMANDA_DOCUMENT_OPERATIONS = {
  sources: ['EA private delivery store', 'course completion records', 'certificate events'],
  duplicateStorage: false,
} as const;
