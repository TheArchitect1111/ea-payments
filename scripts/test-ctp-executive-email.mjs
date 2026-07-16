/**
 * CTP executive email / Opportunity Experience contract checks.
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
const emailModulePath = join(root, 'lib/ctp-opportunity-email.ts');
const emailPath = join(root, 'lib/email.ts');
const welcomePath = join(root, 'lib/ctp-welcome-email.ts');
const sendPath = join(root, 'lib/ctp-executive-email-send.ts');
const submitPath = join(root, 'app/api/assessment/submit/route.ts');
const provisionPath = join(root, 'lib/ctp-workspace-provision.ts');
const submissionsPath = join(root, 'lib/ctp-submissions.ts');
const opportunityViewPath = join(root, 'lib/ctp-opportunity-view.ts');
const dashboardPagePath = join(root, 'app/portal/[slug]/ctp/page.tsx');
const reviewPagePath = join(root, 'app/portal/[slug]/ctp/review/page.tsx');

for (const [path, label] of [
  [briefPath, 'ctp-executive-brief.ts'],
  [emailModulePath, 'ctp-opportunity-email.ts'],
  [emailPath, 'email.ts'],
  [welcomePath, 'ctp-welcome-email.ts'],
  [sendPath, 'ctp-executive-email-send.ts'],
  [submitPath, 'assessment submit'],
  [provisionPath, 'ctp-workspace-provision'],
  [submissionsPath, 'ctp-submissions'],
  [opportunityViewPath, 'ctp-opportunity-view'],
  [dashboardPagePath, 'opportunity dashboard page'],
  [reviewPagePath, 'opportunity review page'],
]) {
  assert(existsSync(path), `Missing ${label}`);
}

const brief = readFileSync(briefPath, 'utf8');
const emailModule = readFileSync(emailModulePath, 'utf8');
const email = readFileSync(emailPath, 'utf8');
const welcome = readFileSync(welcomePath, 'utf8');
const send = readFileSync(sendPath, 'utf8');
const submit = readFileSync(submitPath, 'utf8');
const provision = readFileSync(provisionPath, 'utf8');
const submissions = readFileSync(submissionsPath, 'utf8');
const opportunityView = readFileSync(opportunityViewPath, 'utf8');
const dashboardPage = readFileSync(dashboardPagePath, 'utf8');

assert(brief.includes('buildCtpExecutiveBrief'), 'Missing buildCtpExecutiveBrief');
assert(email.includes('sendCtpExecutiveEmail'), 'Missing sendCtpExecutiveEmail');
assert(
  email.includes('ctp-opportunity-email') || emailModule.includes('buildOpportunityExperienceEmail'),
  'Email must use Opportunity Experience builder',
);
assert(emailModule.includes('VIEW MY OPPORTUNITY DASHBOARD'), 'Email CTA must open Opportunity Dashboard');
assert(emailModule.includes("Let's Build Something You'll Be Proud To Share"), 'Email hero headline required');
assert(emailModule.includes('Your Digital Foundation'), 'Email must include Digital Foundation');
assert(emailModule.includes('Typical Investment'), 'Email must include investment expectations');
assert(!emailModule.includes('Open My Design Studio'), 'Must not CTA to Design Studio');
assert(!email.includes('View My Executive Brief'), 'Must not use Executive Brief CTA label');
assert(!email.includes('Schedule Executive Strategy Session'), 'Must not use consultant strategy-session CTA');
assert(send.includes('sendCtpExecutiveEmailForSubmission'), 'Missing send helper');
assert(send.includes('publicPortalUrl') || send.includes('ctpEmailPortalUrl'), 'Send helper must resolve branded portal URL');
assert(
  welcome.includes('opportunityEmailPathSuffix') || welcome.includes("return 'ctp'"),
  'Studio path must always be Opportunity Dashboard',
);
assert(submissions.includes('executiveEmailDraft'), 'Submission must persist email draft');
assert(submissions.includes('executiveEmailSentAt'), 'Submission must track email sent timestamp');
assert(submit.includes('executiveEmailDraft'), 'Submit must persist executive email draft');
assert(submit.includes('runCtpWorkspaceProvision'), 'Submit must await workspace provision before email');
assert(submit.includes('sendCtpExecutiveEmailForSubmission'), 'Submit must use send helper');
assert(
  !submit.includes('scheduleCtpWorkspaceProvision'),
  'Submit must await provision (not fire-and-forget) so email has portal URL',
);
assert(
  opportunityView.includes('buildCtpOpportunityDashboardView'),
  'Missing opportunity dashboard view builder',
);
assert(
  opportunityView.includes('buildCtpOpportunityReviewView'),
  'Missing opportunity review view builder',
);
assert(dashboardPage.includes('OpportunityDashboard'), 'CTP overview must render Opportunity Dashboard');
assert(
  provision.includes('sendCtpExecutiveEmailForSubmission'),
  'Provision must send deferred executive email',
);
assert(
  !provision.toLowerCase().includes('executive brief'),
  'Portal-ready welcome must not say executive brief',
);

if (failures.length) {
  console.error('CTP executive email checks FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('CTP executive email checks: PASS');
process.exit(0);
