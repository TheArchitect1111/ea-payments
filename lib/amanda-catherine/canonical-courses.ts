export type AmandaCanonicalCourse = {
  id: string;
  offerId: string;
  title: string;
  priceCad: number;
  compareAtPriceCad?: number;
  saleLabel?: string;
  delivery: readonly ('in-person' | 'virtual')[];
  certificateTitle: string;
  legacyIds: readonly string[];
  requiresAuthorizedMedicalProfessionalForInjections?: boolean;
};

/**
 * Canonical commercial catalog. Existing stable offer/course IDs are deliberately
 * preserved so checkout, fulfillment, entitlements, progress and certificates do
 * not fork into duplicate records while display copy follows the approved V2 site.
 */
export const AMANDA_CANONICAL_ACADEMY_COURSES = [
  {
    id: 'aesthetikine-reset-training',
    offerId: 'aesthetikine-reset-training',
    title: 'Nervous System Reset Training',
    priceCad: 997,
    delivery: ['in-person', 'virtual'],
    certificateTitle: 'Nervous System Reset Training — Certificate of Completion',
    legacyIds: ['aesthetikine-nervous-system-reset-training'],
  },
  {
    id: 'body-sculpt-practitioner-certification',
    offerId: 'body-sculpt-practitioner-certification',
    title: 'Body Sculpt Practitioner Certification',
    priceCad: 2497,
    compareAtPriceCad: 4997,
    saleLabel: 'Limited-time sale',
    delivery: ['in-person'],
    certificateTitle: 'Body Sculpt Practitioner Certification — Certificate of Completion',
    legacyIds: [],
  },
  {
    id: 'non-surgical-bbl-training',
    offerId: 'non-surgical-bbl-training',
    title: 'Non-Surgical BBL Training',
    priceCad: 1497,
    delivery: ['in-person', 'virtual'],
    certificateTitle: 'Non-Surgical BBL Training — Certificate of Completion',
    legacyIds: [],
  },
  {
    id: 'non-surgical-tummy-tuck-training',
    offerId: 'non-surgical-tummy-tuck-training',
    title: 'Tummy Tuck Sculpt with Fat-Dissolving Injection Integration',
    priceCad: 2497,
    delivery: ['in-person'],
    certificateTitle: 'Tummy Tuck Sculpt with Fat-Dissolving Injection Integration — Certificate of Completion',
    legacyIds: ['tummy-tuck-sculpt-injection-integration'],
    requiresAuthorizedMedicalProfessionalForInjections: true,
  },
] as const satisfies readonly AmandaCanonicalCourse[];

export type AmandaCanonicalCourseId = (typeof AMANDA_CANONICAL_ACADEMY_COURSES)[number]['id'];
const aliasToCanonicalId = new Map<string, AmandaCanonicalCourseId>();
for (const course of AMANDA_CANONICAL_ACADEMY_COURSES) {
  aliasToCanonicalId.set(course.id, course.id);
  for (const legacyId of course.legacyIds) aliasToCanonicalId.set(legacyId, course.id);
}
export function resolveAmandaCanonicalCourseId(id: string): AmandaCanonicalCourseId | null {
  return aliasToCanonicalId.get(id) ?? null;
}
export function getAmandaCanonicalCourse(id: string) {
  const canonicalId = resolveAmandaCanonicalCourseId(id);
  if (!canonicalId) return null;
  return AMANDA_CANONICAL_ACADEMY_COURSES.find((course) => course.id === canonicalId) ?? null;
}
export const AMANDA_CANONICAL_SELF_ENROLLMENT_COURSES = AMANDA_CANONICAL_ACADEMY_COURSES.map((course) => ({
  offerId: course.offerId,
  courseId: course.id,
  title: course.title,
  priceCad: course.priceCad,
  ...('compareAtPriceCad' in course ? { compareAtPriceCad: course.compareAtPriceCad } : {}),
  ...('saleLabel' in course ? { saleLabel: course.saleLabel } : {}),
  delivery: course.delivery,
}));
