import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const publicUpdates = readFileSync('app/amanda-catherine/ClientRequestedUpdates.tsx', 'utf8');
const config = readFileSync('lib/amanda-catherine/config.ts', 'utf8');
const applyPage = readFileSync('app/portal/[slug]/apply/page.tsx', 'utf8');
const formClient = readFileSync('app/portal/[slug]/intake/IntakeFormClient.tsx', 'utf8');
const submitRoute = readFileSync('app/api/portal/forms/submit/route.ts', 'utf8');

const routes = [
  '/portal/amanda-catherine/apply?form=founder-advisory',
  '/portal/amanda-catherine/apply?form=speaking-media',
  '/portal/amanda-catherine/apply?form=lifeline-media-guest',
  '/portal/amanda-catherine/apply?form=partner-vendor-application&amp;program=lifeline',
];
for (const route of routes) assert.ok(publicUpdates.includes(route), `missing CTA route: ${route}`);
assert.ok(!publicUpdates.includes('mailto:'), 'primary Create CTA module must not use email actions');

for (const formId of ['founder-advisory', 'speaking-media', 'lifeline-media-guest', 'partner-vendor-application']) {
  assert.ok(config.includes(`id: '${formId}'`), `missing Amanda form: ${formId}`);
}

assert.ok(applyPage.includes('searchParams: Promise'), 'apply page must use async searchParams');
assert.ok(applyPage.includes('initialFormId={form ||'), 'apply page must pass preselected form');
assert.ok(formClient.includes("useState(initialFormId)"), 'form client must initialize selected form');
assert.ok(formClient.includes("program === 'lifeline'"), 'form client must stamp approved LIFELINE program');
assert.ok(formClient.includes('aria-hidden="true"'), 'form must include hidden bot trap');

for (const guard of ['validateAmandaApplication', 'checkRateLimit', 'allowedPayloadKeys', 'Enter a valid email address']) {
  assert.ok(submitRoute.includes(guard), `missing server submission guard: ${guard}`);
}

console.log('Amanda intake Run 1: PASS');
