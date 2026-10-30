import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync('app/amanda-catherine/private/practitioner-kit/page.tsx', 'utf8');
const checkout = readFileSync('app/api/public/amanda/practitioner-kit/checkout/route.ts', 'utf8');
const homepage = readFileSync('app/amanda-catherine/ClientRequestedUpdates.tsx', 'utf8');
const publicPage = readFileSync('app/amanda-catherine/page.tsx', 'utf8');
const grid = readFileSync('components/amanda/AmandaClassesGrid.tsx', 'utf8');

assert.ok(page.includes("redirect('/courses/starter-kit#waitlist')"));
assert.ok(checkout.includes('{ status: 410 }'));
assert.ok(!checkout.includes('checkout.sessions.create'));
assert.ok(homepage.includes('View Classes'));
assert.ok(homepage.includes('href="#classes-grid"'), 'practitioner kit CTA must target the canonical public classes grid');
assert.ok(publicPage.includes('<AmandaClassesGrid courses={courses}/>'), 'public Amanda page must render the shared classes grid');
assert.ok(grid.includes('id="classes-grid"'), 'shared classes grid must provide the public anchor');
const policy=readFileSync('lib/amanda-catherine/class-cta-policy.ts','utf8');
assert.ok(policy.includes("label:'Join Waitlist'"));
assert.ok(policy.includes("label:'Request Info'"), 'inquiry status must retain its contact pathway');
assert.ok(policy.includes("action:'/courses/'+encodeURIComponent(course.key)+'#waitlist'"));
console.log('Amanda practitioner kit: shared waitlist route and canonical public classes grid verified.');
