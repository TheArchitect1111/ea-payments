import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync('app/amanda-catherine/private/practitioner-kit/page.tsx', 'utf8');
const checkout = readFileSync('app/api/public/amanda/practitioner-kit/checkout/route.ts', 'utf8');
const homepage = readFileSync('app/amanda-catherine/ClientRequestedUpdates.tsx', 'utf8');
const classes = readFileSync('app/portal/amanda-catherine/(engagement)/classes/page.tsx', 'utf8');

assert.ok(page.includes("redirect('/courses/starter-kit#waitlist')"));
assert.ok(checkout.includes('{ status: 410 }'));
assert.ok(!checkout.includes('checkout.sessions.create'));
assert.ok(homepage.includes('View Classes'));
assert.ok(homepage.includes('href="/portal/amanda-catherine/classes"'));
assert.ok(classes.includes('<AmandaClassesGrid courses={courses}/>'));
const policy=readFileSync('lib/amanda-catherine/class-cta-policy.ts','utf8');
assert.ok(policy.includes("label:'Join Waitlist'"));
assert.ok(!policy.includes('Request Info'));
assert.ok(policy.includes("action:'/courses/'+encodeURIComponent(course.key)+'#waitlist'"));
console.log('Amanda practitioner kit: shared waitlist route and disabled Stripe checkout verified.');
