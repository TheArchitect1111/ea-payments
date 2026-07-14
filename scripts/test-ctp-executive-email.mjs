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
const submitPath = join(root, 'app/api/assessment/submit/route.ts');
const provisionPath = join(root, 'lib/ctp-workspace-provision.ts');

for (const [path, label] of [
  [briefPath, 'ctp-executive-brief.ts'],
  [emailPath, 'email.ts'],
  [submitPath, 'assessment submit'],
  [provisionPath, 'ctp-workspace-provision'],
]) {
  assert(existsSync(path), `Missing ${label}`);
}

const brief = readFileSync(briefPath, 'utf8');
const email = readFileSync(emailPath, 'utf8');
const submit = readFileSync(submitPath, 'utf8');
const provision = readFileSync(provisionPath, 'utf8');

assert(brief.includes('buildCtpExecutiveBrief'), 'Missing buildCtpExecutiveBrief');
assert(brief.includes('executiveSummary'), 'Brief must include executiveSummary');
assert(brief.includes('Investment guidance'), 'Brief must include investment guidance');
assert(email.includes('sendCtpExecutiveEmail'), 'Missing sendCtpExecutiveEmail');
assert(email.includes('Schedule Executive Strategy Session'), 'Email must include schedule CTA');
assert(email.includes('View My Personalized Portal'), 'Email must include portal CTA copy');
assert(email.includes('Executive Brief'), 'Email title should be Executive Brief');
assert(submit.includes('sendCtpExecutiveEmail'), 'Submit must send CTP executive email');
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
