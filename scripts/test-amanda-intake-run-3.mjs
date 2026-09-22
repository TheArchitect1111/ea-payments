import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const submit = readFileSync('app/api/portal/forms/submit/route.ts', 'utf8');
const form = readFileSync('app/portal/[slug]/intake/IntakeFormClient.tsx', 'utf8');
const dashboard = readFileSync('app/portal/amanda-catherine/owner/page.tsx', 'utf8');
const queue = readFileSync('app/portal/amanda-catherine/owner/OwnerApplicationQueue.tsx', 'utf8');
const routing = readFileSync('lib/amanda-catherine/application-routing.ts', 'utf8');

assert.equal((submit.match(/await notifyPortal\(pulseEvent\)/g) || []).length, 1, 'submission must notify exactly once');
assert.equal((submit.match(/emitPulseEvent\(pulseEvent\)/g) || []).length, 0, 'submission must not duplicate the portal notification');
for (const href of [
  '/portal/amanda-catherine/owner/advisory',
  '/portal/amanda-catherine/owner/speaking',
  '/portal/amanda-catherine/owner/lifeline',
]) assert.ok(routing.includes(href), `missing routed activity destination ${href}`);
for (const formId of ['founder-advisory', 'speaking-media', 'lifeline-media-guest', 'partner-vendor-application']) {
  assert.ok(routing.includes(`'${formId}'`), `missing Run 3 workflow ${formId}`);
}
assert.ok(submit.includes('confirmation: route ? { title: route.confirmation, nextStep: route.reviewStep }'));
assert.ok(form.includes('confirmation?.title'));
assert.ok(form.includes('confirmation?.nextStep'));
assert.ok(dashboard.includes('APPLICATION ACTIVITY'));
assert.ok(dashboard.includes('Requests needing attention'));
assert.ok(queue.includes('amandaApplicationHandoff'));
assert.ok(queue.includes('Next handoff'));
assert.ok(queue.includes('Email applicant'));

console.log('Amanda intake Run 3: PASS');
