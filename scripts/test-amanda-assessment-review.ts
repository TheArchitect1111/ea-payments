import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { AMANDA_COURSES, AMANDA_SELF_ENROLLMENT_COURSES } from '../lib/amanda-catherine/config';
import { saveStudioRecord } from '../lib/creative-studio/persistence';
import { certificateEligible, updateAmandaCourseProgress, submitAmandaAssessment, reviewAmandaAssessment } from '../lib/amanda-catherine/progress-store';

async function main() {
  for (const offer of AMANDA_SELF_ENROLLMENT_COURSES) {
    const course = AMANDA_COURSES.find((item) => item.id === offer.courseId)!;
    const email = `cert-test+${course.id}@example.invalid`;
    const portalSlug = 'amanda-catherine';
    const id = `amanda-progress-${createHash('sha256').update(`${portalSlug}:${email}:${course.id}`).digest('hex').slice(0, 24)}`;
    await saveStudioRecord({ recordType: 'experience', id, organizationId: 'org_amanda-catherine', payload: {
      portalSlug, email, courseId: course.id, startedAt: '2025-01-01T00:00:00Z',
      lessonReleaseAt: Object.fromEntries(course.lessons.map((lesson) => [lesson, '2025-01-01T00:00:00Z'])),
      completedLessons: [], practicalRequirements: [], updatedAt: '2025-01-01T00:00:00Z',
    } });
    const selfCompleted = await updateAmandaCourseProgress(portalSlug, email, course.id, {
      completedLessons: [...course.lessons], practicalRequirements: [...course.practicalRequirements],
    });
    assert.equal(selfCompleted.assessmentScore, undefined);
    assert.equal(selfCompleted.certificateIssuedAt, undefined);
    assert.equal(certificateEligible(selfCompleted), false);
    await assert.rejects(reviewAmandaAssessment(portalSlug, email, course.id, { score: 100, practicalApproved: true, notes: 'Reviewed', reviewerEmail: 'reviewer@example.invalid' }), /has not submitted/);
    await submitAmandaAssessment(portalSlug, email, course.id, { notes: 'Practical and written evidence submitted.' });
    const failed = await reviewAmandaAssessment(portalSlug, email, course.id, { score: course.passingScore - 1, practicalApproved: true, notes: 'Revise written assessment', reviewerEmail: 'reviewer@example.invalid' });
    assert.equal(failed.certificateIssuedAt, undefined);
    const practicalPending = await reviewAmandaAssessment(portalSlug, email, course.id, { score: 100, practicalApproved: false, notes: 'Practical pending', reviewerEmail: 'reviewer@example.invalid' });
    assert.equal(practicalPending.certificateIssuedAt, undefined);
    const approved = await reviewAmandaAssessment(portalSlug, email, course.id, { score: course.passingScore, practicalApproved: true, notes: 'Evidence reviewed and approved', reviewerEmail: 'reviewer@example.invalid' });
    assert.ok(approved.certificateIssuedAt);
    assert.equal(certificateEligible(approved), true);
  }
  console.log('Amanda assessment review: all four courses PASS; self-completion never grants certification');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
