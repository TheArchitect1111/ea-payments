/**
 * CTP digital presence audit wiring checks.
 * Run: node scripts/test-ctp-digital-presence.mjs
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

const auditPath = join(root, 'lib/ctp-digital-presence.ts');
const runPath = join(root, 'lib/ctp-digital-presence-run.ts');
const submitPath = join(root, 'app/api/assessment/submit/route.ts');
const emailPath = join(root, 'lib/email.ts');
const submissionsPath = join(root, 'lib/ctp-submissions.ts');

for (const [path, label] of [
  [auditPath, 'ctp-digital-presence.ts'],
  [runPath, 'ctp-digital-presence-run.ts'],
  [submitPath, 'assessment submit'],
  [emailPath, 'email.ts'],
  [submissionsPath, 'ctp-submissions'],
]) {
  assert(existsSync(path), `Missing ${label}`);
}

const audit = readFileSync(auditPath, 'utf8');
const run = readFileSync(runPath, 'utf8');
const submit = readFileSync(submitPath, 'utf8');
const email = readFileSync(emailPath, 'utf8');
const submissions = readFileSync(submissionsPath, 'utf8');

assert(audit.includes('buildGenericDigitalPresenceAudit'), 'Must support generic baseline');
assert(audit.includes('auditDigitalPresence'), 'Missing auditDigitalPresence');
assert(audit.includes('overallScore'), 'Must expose overallScore');
assert(audit.includes('leadCapture'), 'Must score leadCapture dimension');
assert(audit.includes('socialPresence'), 'Must score socialPresence dimension');
assert(audit.includes('googleBusinessProfile'), 'Must score googleBusinessProfile dimension');
assert(audit.includes('scoreSocialAndGbp'), 'Missing scoreSocialAndGbp helper');
assert(audit.includes('extractPresenceUrls'), 'Missing extractPresenceUrls helper');
assert(run.includes('scheduleCtpDigitalPresenceAudit'), 'Missing schedule helper');
assert(run.includes('discoveryAnswers'), 'Run helper must pass discovery answers for social/GBP');
assert(submit.includes('auditDigitalPresence'), 'Submit must run digital audit');
assert(submit.includes('discoveryAnswers'), 'Submit audit must pass discovery answers');
assert(submit.includes('digitalPresenceAudit'), 'Submit must pass audit into email path');
assert(email.includes('Digital Presence Score'), 'Executive email must include digital score');
assert(submissions.includes('digitalPresenceAudit'), 'CTP submission must persist audit');

const biViewPath = join(root, 'lib/ctp-bi-view.ts');
const biPagePath = join(root, 'app/portal/[slug]/ctp/bi/page.tsx');
assert(existsSync(biViewPath), 'Missing ctp-bi-view.ts');
assert(existsSync(biPagePath), 'Missing CTP BI page');
const biView = readFileSync(biViewPath, 'utf8');
const biPage = readFileSync(biPagePath, 'utf8');
assert(biView.includes('socialScore'), 'BI view must expose socialScore');
assert(biView.includes('gbpScore'), 'BI view must expose gbpScore');
assert(biPage.includes('socialScore'), 'BI page must surface social score');
assert(biPage.includes('gbpScore'), 'BI page must surface GBP score');

if (failures.length) {
  console.error('CTP digital presence checks FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('CTP digital presence checks: PASS');
process.exit(0);
