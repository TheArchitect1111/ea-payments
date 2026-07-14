/**
 * CTP executive email / brief contract checks.
 * Run: node scripts/test-ctp-executive-email.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const briefPath = join(root, 'lib/ctp-executive-brief.ts');
const emailPath = join(root, 'lib/email.ts');
const sendPath = join(root, 'lib/ctp-executive-email-send.ts');
const submitPath = join(root, 'app/api/assessment/submit/route.ts');
const provisionPath = join(root, 'lib/ctp-workspace-provision.ts');
const submissionsPath = join(root, 'lib/ctp-submissions.ts');

for (const [path, label] of [
  [briefPath, 'ctp-executive-brief.ts'],
  [emailPath, 'email.ts'],
  [sendPath, 'ctp-executive-email-send.ts'],
  [submitPath, 'assessment submit'],
  [provisionPath, 'ctp-workspace-provision'],
  [submissionsPath, 'ctp-submissions'],
]) {
  assert(existsSync(path), `Missing ${label}`);
}

const brief = readFileSync(briefPath, 'utf8');
const email = readFileSync(emailPath, 'utf8');
const send = readFileSync(sendPath, 'utf8');
const submit = readFileSync(submitPath, 'utf8');
const provision = readFileSync(provisionPath, 'utf8');
const submissions = readFileSync(submissionsPath, 'utf8');

assert(brief.includes('buildCtpExecutiveBrief'), 'Missing buildCtpExecutiveBrief');
assert(brief.includes('executiveSummary'), 'Brief must include executiveSummary');
assert(brief.includes('Investment guidance'), 'Brief must include investment guidance');
assert(email.includes('sendCtpExecutiveEmail'), 'Missing sendCtpExecutiveEmail');
assert(email.includes('Schedule Executive Strategy Session'), 'Email must include schedule CTA');
assert(email.includes('View My Personalized Portal'), 'Email must include portal CTA copy');
assert(email.includes('Executive Brief'), 'Email title should be Executive Brief');
assert(send.includes('sendCtpExecutiveEmailForSubmission'), 'Missing send helper');
assert(send.includes('publicPortalUrl'), 'Send helper must resolve vanity portal URL');
assert(send.includes('executiveEmailDraft'), 'Send helper must use email draft');
assert(submissions.includes('executiveEmailDraft'), 'Submission must persist email draft');
assert(submissions.includes('executiveEmailSentAt'), 'Submission must track email sent timestamp');
assert(submit.includes('executiveEmailDraft'), 'Submit must persist executive email draft');
assert(submit.includes('deferExecutiveEmail'), 'Submit must defer portal-track executive email');
assert(submit.includes('sendCtpExecutiveEmailForSubmission'), 'Submit must use send helper');
assert(
  !submit.includes('await sendCtpExecutiveEmail({'),
  'Submit must not send executive email inline without portal URL path',
);
assert(
  provision.includes('sendCtpExecutiveEmailForSubmission'),
  'Provision must send deferred executive email',
);
assert(
  provision.includes("publicPortalUrl(portalSlug, 'ctp')"),
  'Provision must attach vanity CTP portalUrl',
);
assert(
  provision.includes('executive brief') || provision.includes('Executive Strategy Session'),
  'Portal-ready welcome should point to executive brief / strategy session',
);

if (failures.length) {
  console.error('CTP executive email checks FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('CTP executive email checks: PASS');
process.exit(0);
