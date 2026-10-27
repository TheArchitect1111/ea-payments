import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync('app/amanda-catherine/private/practitioner-kit/page.tsx', 'utf8');
const checkout = readFileSync('app/api/public/amanda/practitioner-kit/checkout/route.ts', 'utf8');
const homepage = readFileSync('app/amanda-catherine/ClientRequestedUpdates.tsx', 'utf8');
const classes = readFileSync('components/amanda/AmandaClassesGrid.tsx', 'utf8');
const publicPage = readFileSync('app/amanda-catherine/page.tsx', 'utf8');

assert.ok(page.includes("redirect('/courses/starter-kit#waitlist')"));
assert.ok(checkout.includes('{ status: 410 }'));
assert.ok(!checkout.includes('checkout.sessions.create'));
assert.ok(publicPage.includes('<AmandaClassesGrid courses={courses}/>'));
assert.ok(publicPage.includes('ClassesAnchor'));
assert.ok(classes.includes('id="classes-grid"'));
assert.ok(classes.includes('getCTA(c)'));
const policy=readFileSync('lib/amanda-catherine/class-cta-policy.ts','utf8');
assert.ok(policy.includes("label:'Join Waitlist'"));
assert.ok(policy.includes("label:'Request Info'"), 'Inquiry-only classes should be distinguishable from registration and waitlist');
assert.ok(policy.includes("action:'/courses/'+encodeURIComponent(course.key)+'#waitlist'"));
console.log('Amanda practitioner kit: shared waitlist route and disabled Stripe checkout verified.');
