/**
 * Contract: Guide is the front door — entry, return, Support, Documents.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
function read(rel) {
  const p = resolve(root, rel);
  if (!existsSync(p)) throw new Error(`Missing ${rel}`);
  return readFileSync(p, 'utf8');
}

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    failed += 1;
  } else {
    console.log(`PASS: ${msg}`);
  }
}

const routes = read('lib/ctp-opportunity-routes.ts');
const fulfill = read('lib/fulfill-paid-client.ts');
const demo = read('app/api/auth/demo-enter/route.ts');
const demoWeb = read('app/api/auth/demo-website-enter/route.ts');
const reminder = read('lib/ctp-review-schedule.ts');
const reveal = read('lib/ctp-reveal.ts');
const subpage = read('app/portal/components/PortalSubpage.tsx');
const shell = read('lib/chassis/PortalShell.tsx');
const checkout = read('app/api/checkout/proposal/route.ts');
const confirmed = read('app/portal/[slug]/ctp/review/confirmed/page.tsx');
const calendly = read('lib/ctp-calendly.ts');
const support = read('lib/ctp-support-view.ts');
const supportPage = read('app/portal/[slug]/ctp/support/page.tsx');
const docs = read('lib/ctp-documents-view.ts');
const docsPage = read('app/portal/[slug]/ctp/documents/page.tsx');
const progress = read('app/portal/[slug]/ctp/progress/page.tsx');

assert(routes.includes('return designStudioPath(slug)'), 'landing resolver → Progress');
assert(routes.includes("designStudio: 'ctp/progress'"), 'designStudio segment is progress');
assert(
  routes.includes('CTP_OPPORTUNITY_SEGMENTS.designStudio') &&
    routes.includes('opportunityEmailPathSuffix'),
  'email path suffix → Progress',
);

assert(fulfill.includes('designStudioPath'), 'magic link next → Progress');
assert(demo.includes('/portal/demo-client/ctp/progress'), 'demo-enter → Progress');
assert(demoWeb.includes('designStudioPath'), 'demo-website-enter → Progress');
assert(reminder.includes("'ctp/progress'"), 'review reminder → Progress');
assert(reveal.includes("publicPortalUrl(input.slug, 'ctp/progress')"), 'reveal portalPath → Progress');
assert(subpage.includes('designStudioPath'), 'PortalSubpage back → Progress');
assert(subpage.includes('Your Project'), 'PortalSubpage label Your Project');
assert(shell.includes("'Your Project'"), 'PortalShell client home Your Project');

assert(checkout.includes('designStudioPath'), 'checkout success → Progress');
assert(checkout.includes('getCtpSubmissionByProposalId'), 'checkout looks up CTP bind');
assert(checkout.includes('payment=success'), 'checkout celebrates payment return');

assert(confirmed.includes('scheduleCtpReview'), 'Calendly confirm schedules review');
assert(confirmed.includes('parseCalendlyScheduledAt'), 'Calendly confirm parses time');
assert(confirmed.includes('designStudioPath'), 'Calendly confirm returns to Progress');
assert(confirmed.includes('meeting=confirmed'), 'Calendly confirm query for celebration');
assert(calendly.includes('parseCalendlyScheduledAt'), 'calendly parser exported');

assert(support.includes('buildGuideProgressView'), 'Support uses Guide view');
assert(support.includes('currentStage'), 'Support exposes current stage');
assert(support.includes('nbaLabel'), 'Support exposes NBA');
assert(support.includes('recentMilestones'), 'Support exposes milestones');
assert(supportPage.includes('Your project context'), 'Support page renders Guide context');
assert(supportPage.includes('Back to Your Project'), 'Support returns to Guide');

assert(docs.includes('why:'), 'Documents have why');
assert(docs.includes('when:'), 'Documents have when');
assert(docs.includes('after:'), 'Documents have after');
assert(!docs.includes('Executive Snapshot'), 'Documents drop Executive Snapshot');
assert(!docs.includes('AI production'), 'Documents drop AI production');
assert(!docs.includes('CTP Overview'), 'Documents drop CTP Overview');
assert(!docs.includes('(BI)'), 'Documents drop BI label');
assert(docsPage.includes('Why you’re receiving this') || docsPage.includes("Why you're receiving this"), 'docs page why');
assert(docsPage.includes('When to review'), 'docs page when');
assert(docsPage.includes('After you complete it'), 'docs page after');
assert(!docsPage.includes('Executive Snapshot'), 'docs page no Executive Snapshot CTA');
assert(docsPage.includes('Back to Your Project'), 'docs return to Guide');

assert(progress.includes('meetingConfirmed') || progress.includes('meeting=confirmed') || progress.includes("meeting === 'confirmed'"), 'Progress celebrates meeting return');
assert(progress.includes('paymentSuccess') || progress.includes("payment === 'success'"), 'Progress celebrates payment return');

// Do not change orchestration / intelligence engines in this sprint
assert(!confirmed.includes('ctp-guide-orchestration'), 'confirmed page does not rewrite orchestration');

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log('\nAll Guide front-door contracts passed.');
