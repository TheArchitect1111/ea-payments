import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AMANDA_SELF_ENROLLMENT_COURSES } from '../lib/amanda-catherine/config';
import AmandaEnrollmentForm from '../app/portal/amanda-catherine/enroll/AmandaEnrollmentForm';

// The repository TSX compiler uses classic JSX in this offline harness.
Object.assign(globalThis, { React });
const courses = AMANDA_SELF_ENROLLMENT_COURSES.map((course) => ({ ...course, delivery: [...course.delivery] }));
for (const course of courses) {
  for (const query of [course.courseId, course.offerId]) {
    const html = renderToStaticMarkup(<AmandaEnrollmentForm courses={courses} initialCourseId={query} />);
    const selected = [...html.matchAll(/<input[^>]+>/g)].filter(([tag]) => tag.includes('type="radio"') && tag.includes('checked=""'));
    assert.equal(selected.length, 1);
    assert.ok(selected[0][0].includes(`value="${course.offerId}"`), `${query} must select the intended checkout offer`);
  }
}
const invalid = renderToStaticMarkup(<AmandaEnrollmentForm courses={courses} initialCourseId="/owner" />);
assert.ok(invalid.includes(`checked="" value="${courses[0].offerId}"`));
console.log(`Amanda enrollment selection: ${courses.length} courses and invalid query PASS`);
