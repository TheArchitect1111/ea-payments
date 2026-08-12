import { createHash } from 'node:crypto';
import { AMANDA_COURSES } from '@/lib/amanda-catherine/config';
import { loadStudioRecord, saveStudioRecord } from '@/lib/creative-studio/persistence';
import { syntheticOrgId } from '@/lib/platform-store';

export type AmandaCourseProgress = {
  portalSlug: string;
  email: string;
  courseId: string;
  startedAt: string;
  lessonReleaseAt: Record<string, string>;
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

function easternParts(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  return Object.fromEntries(
    formatter.formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
  );
}

function easternOffsetMs(date: Date) {
  const parts = easternParts(date);
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - date.getTime();
}

function easternLocalToUtc(year: number, month: number, day: number, hour: number, minute: number) {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  let resolved = new Date(guess.getTime() - easternOffsetMs(guess));
  resolved = new Date(guess.getTime() - easternOffsetMs(resolved));
  return resolved;
}

function firstMondayRelease(startedAt: string) {
  const start = new Date(startedAt);
  const parts = easternParts(start);
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekday = weekdays.indexOf(parts.weekday);
  const localDate = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
  let daysUntilMonday = (1 - weekday + 7) % 7;
  const todayNine = easternLocalToUtc(
    Number(parts.year),
    Number(parts.month),
    Number(parts.day),
    9,
    0,
  );
  if (daysUntilMonday === 0 && start.getTime() > todayNine.getTime()) daysUntilMonday = 7;
  localDate.setUTCDate(localDate.getUTCDate() + daysUntilMonday);
  return easternLocalToUtc(
    localDate.getUTCFullYear(),
    localDate.getUTCMonth() + 1,
    localDate.getUTCDate(),
    9,
    0,
  );
}

function buildReleaseSchedule(courseId: string, startedAt: string) {
  const course = AMANDA_COURSES.find((item) => item.id === courseId);
  if (!course) return {};
  const firstRelease = firstMondayRelease(startedAt);
  return Object.fromEntries(
    course.lessons.map((lesson, index) => [
      lesson,
      new Date(firstRelease.getTime() + index * 7 * 24 * 60 * 60 * 1000).toISOString(),
    ]),
  );
}

export function lessonIsReleased(progress: AmandaCourseProgress, lesson: string, now = new Date()) {
  const releaseAt = progress.lessonReleaseAt[lesson];
  return Boolean(releaseAt && new Date(releaseAt).getTime() <= now.getTime());
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

async function persist(progress: AmandaCourseProgress) {
  await saveStudioRecord({
    recordType: 'experience',
    id: progressId(progress.portalSlug, progress.email, progress.courseId),
    organizationId: syntheticOrgId(progress.portalSlug),
    title: `Amanda course progress: ${progress.courseId}`,
    payload: progress,
  });
  return progress;
}

export async function getAmandaCourseProgress(portalSlug: string, email: string, courseId: string) {
  const saved = await loadStudioRecord<AmandaCourseProgress>('experience', progressId(portalSlug, email, courseId));
  if (saved) {
    if (saved.startedAt && saved.lessonReleaseAt) return saved;
    const migrated: AmandaCourseProgress = {
      ...saved,
      startedAt: saved.updatedAt || new Date().toISOString(),
      lessonReleaseAt: buildReleaseSchedule(courseId, saved.updatedAt || new Date().toISOString()),
    };
    return persist(migrated);
  }
  const now = new Date().toISOString();
  return persist({
    portalSlug,
    email,
    courseId,
    startedAt: now,
    lessonReleaseAt: buildReleaseSchedule(courseId, now),
    completedLessons: [],
    practicalRequirements: [],
    updatedAt: now,
  });
}

export async function updateAmandaCourseProgress(
  portalSlug: string,
  email: string,
  courseId: string,
  patch: Partial<Pick<AmandaCourseProgress, 'completedLessons' | 'practicalRequirements'>>,
) {
  const current = await getAmandaCourseProgress(portalSlug, email, courseId);
  const course = AMANDA_COURSES.find((item) => item.id === courseId);
  if (!course) throw new Error('Amanda course not found.');

  const requestedLessons = patch.completedLessons ?? current.completedLessons;
  const lockedCompletion = requestedLessons.find(
    (lesson) => !current.completedLessons.includes(lesson) && !lessonIsReleased(current, lesson),
  );
  if (lockedCompletion) throw new Error('That lesson has not been released yet.');

  const completedLessons = requestedLessons.filter((lesson) => course.lessons.includes(lesson));
  const practicalRequirements = (patch.practicalRequirements ?? current.practicalRequirements).filter((requirement) =>
    course.practicalRequirements.includes(requirement),
  );
  const completionRequirementsMet =
    course.lessons.every((lesson) => completedLessons.includes(lesson)) &&
    course.practicalRequirements.every((requirement) => practicalRequirements.includes(requirement));

  const next: AmandaCourseProgress = {
    ...current,
    completedLessons,
    practicalRequirements,
    assessmentScore: completionRequirementsMet ? 100 : undefined,
    updatedAt: new Date().toISOString(),
  };
  if (certificateEligible(next) && !next.certificateIssuedAt) next.certificateIssuedAt = next.updatedAt;
  return persist(next);
}
