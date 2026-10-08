import { amandaCourseReady, amandaSupportWindow } from './lms-policy';
import { createHash } from 'node:crypto';
import { AMANDA_COURSES } from '@/lib/amanda-catherine/config';
import { listStudioRecords, loadStudioRecord, saveStudioRecord } from '@/lib/creative-studio/persistence';
import { syntheticOrgId } from '@/lib/platform-store';

export type AmandaCourseProgress = {
  portalSlug: string;
  email: string;
  courseId: string;
  startedAt: string;
  trainingDate?: string;
  lessonReleaseAt: Record<string, string>;
  completedLessons: string[];
  assessmentScore?: number;
  practicalRequirements: string[];
  evidence?: { caseStudyUrl: string; quizEvidenceUrl: string; practicalEvidenceUrl: string; practicalMedia: boolean; clientConsent: boolean; submittedAt: string };
  quizVerifiedAt?: string;
  certificateApprovedBy?: string;
  certificateApprovedEvidence?: string;
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
  if (amandaCourseReady(courseId)) return Object.fromEntries(course.lessons.map((lesson) => [lesson, startedAt]));
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
  return Boolean(amandaCourseReady(course.id) && progress.evidence?.caseStudyUrl && progress.evidence.quizEvidenceUrl && progress.evidence.practicalEvidenceUrl && (!progress.evidence.practicalMedia || progress.evidence.clientConsent) && progress.quizVerifiedAt && course.lessons.every((lesson) => progress.completedLessons.includes(lesson)));
}

export function certificationEvidenceVersion(progress: AmandaCourseProgress) {
  return createHash('sha256').update(JSON.stringify([progress.evidence, [...progress.completedLessons].sort()])).digest('hex');
}
export function certificateApproved(progress: AmandaCourseProgress) {
  return Boolean(certificateEligible(progress) && progress.certificateIssuedAt && progress.certificateApprovedBy && progress.certificateApprovedEvidence === certificationEvidenceVersion(progress));
}

async function persist(progress: AmandaCourseProgress) {
  const saved = await saveStudioRecord({
    recordType: 'experience',
    id: progressId(progress.portalSlug, progress.email, progress.courseId),
    organizationId: syntheticOrgId(progress.portalSlug),
    title: `Amanda course progress: ${progress.courseId}`,
    payload: progress,
  });
  if (!saved.ok || (process.env.VERCEL_ENV === 'production' && !saved.persistedToAirtable)) throw new Error(saved.error || 'Course progress could not be saved durably.');
  return progress;
}

/** Pure read for GET/owner preview. Never creates or migrates an Airtable record. */
export async function peekAmandaCourseProgress(portalSlug: string, email: string, courseId: string, synthetic = false): Promise<AmandaCourseProgress> {
  const course = AMANDA_COURSES.find((item) => item.id === courseId);
  if (!course) throw new Error('Amanda course not found.');
  const saved = synthetic ? null : await loadStudioRecord<AmandaCourseProgress>('experience', progressId(portalSlug, email, courseId));
  if (saved) {
    const startedAt = saved.startedAt || saved.updatedAt || new Date().toISOString();
    return { ...saved, startedAt, lessonReleaseAt: saved.lessonReleaseAt && !amandaCourseReady(courseId)
      ? saved.lessonReleaseAt : buildReleaseSchedule(courseId, startedAt) };
  }
  const now = new Date().toISOString();
  return { portalSlug, email, courseId, startedAt: now, lessonReleaseAt: buildReleaseSchedule(courseId, now),
    completedLessons: [], practicalRequirements: [], updatedAt: now };
}

export async function getAmandaCourseProgress(portalSlug: string, email: string, courseId: string) {
  const saved = await loadStudioRecord<AmandaCourseProgress>('experience', progressId(portalSlug, email, courseId));
  if (saved) {
    if (saved.startedAt && saved.lessonReleaseAt) {
      if (amandaCourseReady(courseId)) return { ...saved, lessonReleaseAt: buildReleaseSchedule(courseId, saved.startedAt) };
      return saved;
    }
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

export async function listAmandaCourseProgress(portalSlug: string) {
  const records = await listStudioRecords<AmandaCourseProgress>(
    'experience',
    syntheticOrgId(portalSlug),
  );
  return records
    .filter((record) => record.portalSlug === portalSlug && record.courseId && record.email && Array.isArray(record.completedLessons) && Array.isArray(record.practicalRequirements))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function updateAmandaCourseProgress(
  portalSlug: string,
  email: string,
  courseId: string,
  patch: Partial<Pick<AmandaCourseProgress, 'completedLessons' | 'practicalRequirements' | 'evidence'>>,
) {
  const current = await getAmandaCourseProgress(portalSlug, email, courseId);
  const course = AMANDA_COURSES.find((item) => item.id === courseId);
  if (!course) throw new Error('Amanda course not found.');
  const courseLessons: readonly string[] = course.lessons;
  const coursePracticalRequirements: readonly string[] = course.practicalRequirements;

  const requestedLessons = patch.completedLessons ?? current.completedLessons;
  const lockedCompletion = requestedLessons.find(
    (lesson) => !current.completedLessons.includes(lesson) && !lessonIsReleased(current, lesson),
  );
  if (lockedCompletion) throw new Error('That lesson has not been released yet.');

  const completedLessons = requestedLessons.filter((lesson) => courseLessons.includes(lesson));
  const practicalRequirements = (patch.practicalRequirements ?? current.practicalRequirements).filter((requirement) =>
    coursePracticalRequirements.includes(requirement),
  );
  let evidence = current.evidence;
  if (patch.evidence) {
    const urls = ['caseStudyUrl', 'quizEvidenceUrl', 'practicalEvidenceUrl'] as const;
    for (const key of urls) {
      const value = patch.evidence[key];
      if (typeof value !== 'string' || value.length > 2048 || new URL(value).protocol !== 'https:') throw new Error('Evidence links must use https.');
    }
    if (patch.evidence.practicalMedia !== false && patch.evidence.clientConsent !== true) throw new Error('Client consent is required for photos or video.');
    evidence = { caseStudyUrl: patch.evidence.caseStudyUrl, quizEvidenceUrl: patch.evidence.quizEvidenceUrl, practicalEvidenceUrl: patch.evidence.practicalEvidenceUrl, practicalMedia: patch.evidence.practicalMedia !== false, clientConsent: patch.evidence.clientConsent === true, submittedAt: new Date().toISOString() };
  }

  const next: AmandaCourseProgress = {
    ...current,
    completedLessons,
    practicalRequirements,
    evidence,
    updatedAt: new Date().toISOString(),
  };
  if (certificationEvidenceVersion(next) !== certificationEvidenceVersion(current)) {
    next.quizVerifiedAt = undefined; next.certificateIssuedAt = undefined;
    next.certificateApprovedBy = undefined; next.certificateApprovedEvidence = undefined;
  }
  return persist(next);
}

export async function setAmandaTrainingDate(portalSlug: string, email: string, courseId: string, trainingDate: string) {
  if (!amandaCourseReady(courseId) || !amandaSupportWindow(trainingDate)) throw new Error('A valid class/training date and READY course are required.');
  const current = await getAmandaCourseProgress(portalSlug, email, courseId);
  return persist({ ...current, trainingDate, updatedAt: new Date().toISOString() });
}

export async function approveAmandaCertification(portalSlug: string, email: string, courseId: string, adminEmail: string, evidenceVersion: string, quizPassed: boolean) {
  const current = await getAmandaCourseProgress(portalSlug, email, courseId);
  if (!quizPassed || !evidenceVersion || evidenceVersion !== certificationEvidenceVersion(current)) throw new Error('Review the current evidence and verify the quiz result before approval.');
  if (certificateApproved(current)) return current;
  const now = new Date().toISOString();
  const reviewed = { ...current, quizVerifiedAt: now };
  if (!certificateEligible(reviewed)) throw new Error('Case study, quiz, practical evidence, consent and lesson completion are required.');
  return persist({ ...reviewed, certificateIssuedAt: now, certificateApprovedBy: adminEmail, certificateApprovedEvidence: evidenceVersion, updatedAt: now });
}
