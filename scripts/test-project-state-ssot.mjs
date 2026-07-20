/**
 * Contract: Project State Engine SSOT — one authority for Guide stage.
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

const engine = read('lib/project-state-engine.ts');
const stage = read('lib/ctp-guide-stage-engine.ts');
const submissions = read('lib/ctp-submissions.ts');
const progress = read('lib/ctp-guide-progress.ts');
const consulting = read('lib/ctp-consulting-narrative.ts');
const portalStatus = read('lib/ctp-portal-status.ts');
const support = read('lib/ctp-support-view.ts');
const stripe = read('app/api/webhooks/stripe/route.ts');
const wps = read('lib/ctp-website-portal-workspace.ts');

assert(engine.includes('PROJECT_TRANSITION_RULES'), 'transition rules catalog');
assert(engine.includes('payment.completed'), 'payment evidence kind');
assert(engine.includes('isAuthoritativeProposalId'), 'WPS filter for proposal truth');
assert(engine.includes('applyProjectEvidence'), 'applyProjectEvidence exported');
assert(engine.includes('bootstrapProjectStateFromLegacy'), 'legacy bootstrap');
assert(engine.includes('siteUrl / WPS'), 'docs ignore siteUrl/WPS for Agreement');

assert(!stage.includes('Boolean(view.siteUrl)'), 'stage engine no longer uses siteUrl for done');
assert(!stage.includes('Boolean(view.proposalId)'), 'stage engine no longer uses proposalId for done');
assert(stage.includes('view.guideStage'), 'stage engine reads guideStage SSOT');
assert(
  stage.includes('resolveGuideStageDone(') && stage.includes('current: GuideLifecycleStage'),
  'done map from canonical current',
);

assert(submissions.includes('guideStage'), 'submission persists guideStage');
assert(submissions.includes('projectEvidence'), 'submission persists evidence');
assert(submissions.includes('agreementPaidAt'), 'submission persists agreementPaidAt');
assert(submissions.includes('applyProjectEvidenceToSubmission'), 'evidence apply helper');
assert(submissions.includes('ensureCanonicalProjectState'), 'bootstrap on portal read');

assert(portalStatus.includes('guideStage'), 'status view carries guideStage');
assert(progress.includes('resolveGuideStages'), 'Progress uses stage resolution');
assert(progress.includes('!/^WPS-/i'), 'NBA blocks WPS proposal links');
assert(progress.includes('Continue Your Project'), 'Welcome NBA stays on Progress');
assert(!progress.includes('Continue Your Journey'), 'Welcome NBA no longer routes to Journey');

assert(consulting.includes('submission.guideStage'), 'Journey reads guideStage SSOT');
assert(!consulting.includes('Ready for Proposal'), 'Journey dropped parallel stage labels');
assert(!consulting.includes('Opening Your Workspace'), 'Journey dropped provisioning stage labels');

assert(support.includes('buildGuideProgressView'), 'Support still Guide-aware via Progress view');

assert(stripe.includes('payment.completed'), 'Stripe payment emits payment.completed');
assert(stripe.includes('isAuthoritativeProposalId'), 'Stripe checks real proposal id');

assert(wps.includes('portal.bound'), 'W+P bind emits portal.bound');
assert(wps.includes('never Agreement'), 'W+P comments siteUrl not Agreement');

// Runtime: synthetic WPS is not authoritative
const { pathToFileURL } = await import('node:url');
// Lightweight inline checks without TS compile
assert(engine.includes("if (/^WPS-/i.test(id)) return false"), 'WPS- rejected');

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log('\nAll Project State SSOT contracts passed.');
