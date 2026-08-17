import { createHash } from 'node:crypto';
import { AMANDA_COURSES, type AmandaPortalAudience } from '@/lib/amanda-catherine/config';
import { loadStudioRecord, saveStudioRecord } from '@/lib/creative-studio/persistence';
import { syntheticOrgId } from '@/lib/platform-store';

export type AmandaLessonContent = {
  title: string;
  videoUrl: string;
  notes: string;
  resourceUrl: string;
};

export type AmandaCourseContent = {
  portalSlug: string;
  courseId: string;
  lessons: AmandaLessonContent[];
  updatedAt: string;
};

function contentId(portalSlug: string, courseId: string) {
  return `amanda-course-${createHash('sha256').update(`${portalSlug}:${courseId}`).digest('hex').slice(0, 24)}`;
}

function cleanUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const parsed = new URL(trimmed);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Course links must use http or https.');
  return parsed.toString();
}

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

export async function getAmandaCourseContent(portalSlug: string, courseId: string) {
  const course = AMANDA_COURSES.find((item) => item.id === courseId);
  if (!course) throw new Error('Amanda course not found.');
  const saved = await loadStudioRecord<AmandaCourseContent>('experience', contentId(portalSlug, courseId));
  if (saved) return saved;
  return {
    portalSlug,
    courseId,
    lessons: course.lessons.map((title) => ({ title, videoUrl: '', notes: '', resourceUrl: '' })),
    updatedAt: new Date(0).toISOString(),
  } satisfies AmandaCourseContent;
}

export async function saveAmandaCourseContent(
  portalSlug: string,
  courseId: string,
  lessons: AmandaLessonContent[],
) {
  const course = AMANDA_COURSES.find((item) => item.id === courseId);
  if (!course) throw new Error('Amanda course not found.');
  const byTitle = new Map(lessons.map((lesson) => [lesson.title, lesson]));
  const content: AmandaCourseContent = {
    portalSlug,
    courseId,
    lessons: course.lessons.map((title) => {
      const lesson = byTitle.get(title);
      return {
        title,
        videoUrl: cleanUrl(lesson?.videoUrl || ''),
        notes: String(lesson?.notes || '').trim().slice(0, 4000),
        resourceUrl: cleanUrl(lesson?.resourceUrl || ''),
      };
    }),
    updatedAt: new Date().toISOString(),
  };
  const result = await saveStudioRecord({
    recordType: 'experience',
    id: contentId(portalSlug, courseId),
    organizationId: syntheticOrgId(portalSlug),
    title: `Amanda course content: ${course.title}`,
    payload: content,
  });
  if (!result.ok) throw new Error(result.error || 'Course content could not be saved.');
  return content;
}
