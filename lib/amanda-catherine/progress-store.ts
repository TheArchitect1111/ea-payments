import { createHash } from 'node:crypto';
import { AMANDA_COURSES } from '@/lib/amanda-catherine/config';
import { loadStudioRecord, saveStudioRecord } from '@/lib/creative-studio/persistence';
import { syntheticOrgId } from '@/lib/platform-store';

export type AmandaCourseProgress = {
  portalSlug: string;
  email: string;
  courseId: string;
  completedLessons: string[];
  assessmentScore?: number;
  practicalRequirements: string[];
  certificateIssuedAt?: string;
  updatedAt: string;
};

function progressId(portalSlug: string, email: string, courseId: string) {
  const identity = `${portalSlug}:${email.toLowerCase()}:${courseId}`;
  return `amanda-progress-${createHash('sha256').update(identity).digest('hex').slice(0, 24)}`;
}

export function certificateEligible(progress: AmandaCourseProgress) {
  const course = AMANDA_COURSES.find((item) => item.id === progress.courseId);
  if (!course) return false;
  return (
    course.lessons.every((lesson) => progress.completedLessons.includes(lesson)) &&
    (progress.assessmentScore ?? 0) >= course.passingScore &&
    course.practicalRequirements.every((item) => progress.practicalRequirements.includes(item))
  );
}

export async function getAmandaCourseProgress(portalSlug: string, email: string, courseId: string) {
  const saved = await loadStudioRecord<AmandaCourseProgress>('experience', progressId(portalSlug, email, courseId));
  return saved ?? {
    portalSlug,
    email,
    courseId,
    completedLessons: [],
    practicalRequirements: [],
    updatedAt: new Date().toISOString(),
  };
}

export async function updateAmandaCourseProgress(
  portalSlug: string,
  email: string,
  courseId: string,
  patch: Partial<Pick<AmandaCourseProgress, 'completedLessons' | 'assessmentScore' | 'practicalRequirements'>>,
) {
  const current = await getAmandaCourseProgress(portalSlug, email, courseId);
  const next: AmandaCourseProgress = { ...current, ...patch, updatedAt: new Date().toISOString() };
  if (certificateEligible(next) && !next.certificateIssuedAt) next.certificateIssuedAt = next.updatedAt;
  await saveStudioRecord({
    recordType: 'experience',
    id: progressId(portalSlug, email, courseId),
    organizationId: syntheticOrgId(portalSlug),
    title: `Amanda course progress: ${courseId}`,
    payload: next,
  });
  return next;
}
