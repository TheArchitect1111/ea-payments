import { readFileSync } from 'node:fs';
import { safePortalReturnPath } from '../lib/auth/portal-return-path';
import { amandaMemberResources } from '../lib/amanda-catherine/member-resources';
import { getCourseMenuRoute } from '../lib/amanda-catherine/menu-routing';
import assert from 'node:assert/strict';
import { AMANDA_COURSES } from '../lib/amanda-catherine/config';
import { amandaCourseReady, amandaSupportWindow, AMANDA_SUPPORT_WORDING } from '../lib/amanda-catherine/lms-policy';
import { coursesForAccount } from '../lib/amanda-catherine/course-access';
assert.equal(AMANDA_SUPPORT_WORDING, 'Includes 90 days of clinical integration support and business mentorship.');
assert.equal(AMANDA_COURSES.filter(c => amandaCourseReady(c.id)).length, 4);
assert.equal(amandaCourseReady('unknown'), false);
assert.deepEqual(coursesForAccount('student-trainee', []), []);
assert.deepEqual(coursesForAccount('student-trainee', ['unknown']), []);
for (const c of AMANDA_COURSES) assert.equal(coursesForAccount('student-trainee', [c.id]).length, amandaCourseReady(c.id) ? 1 : 0);
assert.equal(amandaSupportWindow(), null);
assert.equal(amandaSupportWindow('2026-02-30'), null);
assert.equal(amandaSupportWindow('2026-10-02', new Date('2026-10-01T12:00Z'))?.status, 'scheduled');
assert.equal(amandaSupportWindow('2026-10-02', new Date('2026-10-02T12:00Z'))?.daysRemaining, 90);
assert.equal(amandaSupportWindow('2026-10-02', new Date('2026-12-31T12:00Z'))?.status, 'ended');
console.log('Amanda locked v2 readiness, assignment access and support-clock tests passed.');

for (const course of AMANDA_COURSES) {
  const sales = `/courses/${course.id}`;
  assert.equal(getCourseMenuRoute(course, { purchasedCourseIds: [] }), amandaCourseReady(course.id) ? sales : `${sales}#waitlist`);
  assert.equal(getCourseMenuRoute(course, { purchasedCourseIds: [course.id] }), amandaCourseReady(course.id) ? `/portal/amanda-catherine/learning/${course.id}` : `${sales}#waitlist`);
}
const original = '/portal/amanda-catherine/learning/body-sculpt-practitioner-certification?view=progress';
const login = new URL('/portal/login', 'https://portal.invalid');
login.searchParams.set('next', original);
assert.equal(safePortalReturnPath(login.searchParams.get('next')), original);
for (const unsafe of ['https://attacker.invalid', '//attacker.invalid', '/\\attacker.invalid', '/simplifi/capture', '/path\n']) assert.equal(safePortalReturnPath(unsafe), undefined);
console.log('Purchase/readiness menu matrix and safe login return-path tests passed.');

const owner = readFileSync('app/portal/amanda-catherine/owner/[section]/page.tsx', 'utf8');
assert.equal(owner.includes('Portal destination established.'), false);
for (const path of ['app/portal/login/page.tsx', 'app/api/portal/login/route.ts', 'app/api/auth/verify-2fa/route.ts']) {
  assert.ok(readFileSync(path, 'utf8').includes('safePortalReturnPath'), `${path} must use the tested return policy`);
}
console.log('Owner placeholder removal and login policy integration checks passed.');

// A stale purchase must never bypass a course that is no longer READY.
const readyId = 'body-sculpt-practitioner-certification';
assert.equal(getCourseMenuRoute({ id: readyId, status: 'WAITLIST' }, { purchasedCourseIds: [readyId] }), `/courses/${readyId}#waitlist`);
assert.equal(getCourseMenuRoute({ id: 'unknown', status: 'READY' }, { purchasedCourseIds: ['unknown'] }), '/courses/unknown#waitlist');
assert.equal(getCourseMenuRoute({ id: readyId, slug: 'approved-sales-slug', status: 'READY' }, { purchasedCourseIds: [] }), '/courses/approved-sales-slug');
const memberMenu = readFileSync('app/portal/[slug]/member/AmandaMemberHome.tsx', 'utf8');
assert.ok(memberMenu.includes('getCourseMenuRoute(course, { purchasedCourseIds })'));
assert.ok(!memberMenu.includes("match?.[1] || 'member'"));
assert.ok(memberMenu.includes('aria-disabled="true"'));
assert.ok(memberMenu.includes("'courses-and-certifications'"));
assert.ok(memberMenu.includes("'courses-progress-and-certifications'"));
console.log('Non-READY stale purchase and explicit menu fallback regression checks passed.');


assert.deepEqual(amandaMemberResources([]), []);
assert.deepEqual(amandaMemberResources(['entrepreneurial-artist', 'unknown']), []);
const protectedResources = amandaMemberResources(['body-sculpt-practitioner-certification']);
assert.ok(protectedResources.length > 0);
assert.ok(protectedResources.every(resource => resource.courseId === 'body-sculpt-practitioner-certification'));
assert.deepEqual(amandaMemberResources(['body-sculpt-practitioner-certification', 'body-sculpt-practitioner-certification']), protectedResources);
assert.ok(memberMenu.includes("'member-profile': 'profile'"));
assert.ok(memberMenu.includes("'member-resources': 'resources'"));
assert.ok(memberMenu.includes("'/amanda-catherine/private/practitioner-kit'"));
console.log('Existing member profile/kit links and purchased READY resource selection tests passed.');
