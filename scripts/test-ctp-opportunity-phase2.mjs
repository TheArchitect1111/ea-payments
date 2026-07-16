/**
 * Phase 2 — Opportunity Experience confirmation email contract.
 * Run: node scripts/test-ctp-opportunity-phase2.mjs
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

const emailModulePath = join(root, 'lib/ctp-opportunity-email.ts');
const welcomePath = join(root, 'lib/ctp-welcome-email.ts');
const sendPath = join(root, 'lib/ctp-executive-email-send.ts');
const mailPath = join(root, 'lib/email.ts');
const submitPath = join(root, 'app/api/assessment/submit/route.ts');
const provisionPath = join(root, 'lib/ctp-workspace-provision.ts');

for (const [path, label] of [
  [emailModulePath, 'ctp-opportunity-email'],
  [welcomePath, 'ctp-welcome-email'],
  [sendPath, 'ctp-executive-email-send'],
  [mailPath, 'email sendCtpExecutiveEmail'],
  [submitPath, 'assessment submit'],
  [provisionPath, 'workspace provision'],
]) {
  assert(existsSync(path), `Missing ${label}`);
}

const emailMod = readFileSync(emailModulePath, 'utf8');
const welcome = readFileSync(welcomePath, 'utf8');
const send = readFileSync(sendPath, 'utf8');
const mail = readFileSync(mailPath, 'utf8');
const submit = readFileSync(submitPath, 'utf8');
const provision = readFileSync(provisionPath, 'utf8');

// Builder module
assert(emailMod.includes('buildOpportunityExperienceEmail'), 'Must export email builder');
assert(emailMod.includes('buildOpportunityEmailModelFromSubmission'), 'Must export submission model helper');
assert(emailMod.includes('assertOpportunityEmailLanguage'), 'Must enforce language guardrails');
assert(emailMod.includes('FORBIDDEN_EMAIL_TERMS'), 'Must define forbidden terms');

// Stage One content (prompt)
const requiredCopy = [
  "Let's Build Something You'll Be Proud To Share.",
  'Project Status',
  'Assessment Received',
  'Opportunity Dashboard Ready',
  'Project Snapshot',
  'Overall Readiness Score',
  'Opportunity Rating',
  'Opportunity Summary',
  'Your Digital Foundation',
  'Why It Matters',
  'Typical Investment',
  'Nonprofit Organizations',
  'Starting at $997',
  'Starting at $1,497',
  'Custom Proposal',
  'VIEW MY OPPORTUNITY DASHBOARD',
];
for (const copy of requiredCopy) {
  assert(emailMod.includes(copy), `Missing required copy: ${copy}`);
}

// Forbidden CTAs / jargon in email HTML template only (not guardrail constant names)
const templateStart = emailMod.indexOf('const bodyHtml = `');
const templateEnd = emailMod.indexOf('`;', templateStart + 1);
const template = templateStart >= 0 && templateEnd > templateStart
  ? emailMod.slice(templateStart, templateEnd)
  : emailMod;
const forbidden = [
  'Open Design Studio',
  'Open My Workspace',
  'Client Portal',
  'Executive Brief',
  'Project Scope',
  'Website Package',
  'Book Discovery Call',
  'Contact Us',
];
for (const term of forbidden) {
  assert(!template.includes(term), `Email template must not include: ${term}`);
}

// Send pipeline
assert(mail.includes('ctp-opportunity-email'), 'sendCtpExecutiveEmail must use Phase 2 module');
assert(send.includes('opportunityEmailSummary'), 'Send helper must pass dynamic summary');
assert(send.includes('opportunityEmailHealthRows'), 'Send helper must pass category scores');
assert(send.includes('opportunityDashboardPublicUrl'), 'Send helper must resolve dashboard URL');
assert(submit.includes('runCtpWorkspaceProvision'), 'Submit must provision before email');
assert(submit.includes('sendCtpExecutiveEmailForSubmission'), 'Submit must send confirmation email');
assert(provision.includes('sendCtpExecutiveEmailForSubmission'), 'Provision may send with portal URL');

// welcome re-exports
assert(welcome.includes('ctp-opportunity-email'), 'Welcome module must re-export Phase 2 builder');

if (failures.length) {
  console.error('Phase 2 Opportunity Experience (confirmation email) FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('Phase 2 Opportunity Experience (confirmation email): PASS');
process.exit(0);
