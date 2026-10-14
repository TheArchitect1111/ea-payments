import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync('app/amanda-catherine/private/practitioner-kit/page.tsx', 'utf8');
const checkout = readFileSync('app/api/public/amanda/practitioner-kit/checkout/route.ts', 'utf8');
const homepage = readFileSync('app/amanda-catherine/ClientRequestedUpdates.tsx', 'utf8');
const classes = readFileSync('app/portal/amanda-catherine/(engagement)/classes/page.tsx', 'utf8');

assert.ok(page.includes("redirect('/courses/starter-kit#waitlist')"));
assert.ok(checkout.includes('{ status: 410 }'));
assert.ok(!checkout.includes('checkout.sessions.create'));
assert.ok(homepage.includes('Request Info'));
assert.ok(homepage.includes('href="/courses/starter-kit#waitlist"'));
assert.ok(classes.includes("c.name==='Purchase your Practitioner Kit'"));
assert.ok(classes.includes("'/courses/starter-kit#waitlist'"));
console.log('Amanda practitioner kit: inquiry-only route and disabled Stripe checkout verified.');
