/**
 * Contract: Guided Project Orchestration — stage engine + conductor hooks.
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

const engine = read('lib/ctp-guide-stage-engine.ts');
const orch = read('lib/ctp-guide-orchestration.ts');
const notices = read('lib/ctp-guide-notifications.ts');
const progress = read('lib/ctp-guide-progress.ts');
const page = read('app/portal/[slug]/ctp/progress/page.tsx');
const submissions = read('lib/ctp-submissions.ts');
const pulse = read('lib/pulse-bus.ts');

const stages = [
  'Welcome',
  'Discovery',
  'Strategy',
  'Proposal',
  'Agreement',
  'Design',
  'Build',
  'Review',
  'Launch',
  'Care',
];

assert(engine.includes('GUIDE_STAGE_DEFINITIONS'), 'stage definitions catalog');
assert(engine.includes('entryConditions'), 'entry conditions defined');
assert(engine.includes('exitConditions'), 'exit conditions defined');
assert(engine.includes('completionEvents'), 'completion events defined');
assert(engine.includes('documentsUnlocked'), 'document unlocks defined');
assert(engine.includes('detectGuideTransition'), 'transition detection exported');
assert(engine.includes('resolveGuideStages'), 'stage resolution exported');

for (const stage of stages) {
  assert(engine.includes(`stage: '${stage}'`), `definition for ${stage}`);
}

assert(engine.includes('Welcome → Discovery') || engine.includes("next: 'Discovery'"), 'Welcome→Discovery edge');
assert(engine.includes("next: 'Strategy'"), 'Discovery→Strategy edge');
assert(engine.includes("next: 'Proposal'"), 'Strategy→Proposal edge');
assert(engine.includes("next: 'Agreement'"), 'Proposal→Agreement edge');
assert(engine.includes("next: 'Design'"), 'Agreement→Design edge');
assert(engine.includes("next: 'Build'"), 'Design→Build edge');
assert(engine.includes("next: 'Review'"), 'Build→Review edge');
assert(engine.includes("next: 'Launch'"), 'Review→Launch edge');
assert(engine.includes("next: 'Care'"), 'Launch→Care edge');

assert(engine.includes('Discovery Complete'), 'celebration Discovery Complete');
assert(engine.includes('Proposal Approved'), 'celebration Proposal Approved');
assert(engine.includes('Website Ready for Review'), 'celebration Website Ready for Review');
assert(engine.includes('Project Launched'), 'celebration Project Launched');

assert(
  engine.includes('Your proposal is ready') || notices.includes('Your proposal is ready'),
  'notify proposal ready',
);
assert(
  engine.includes('Your approval has been received') ||
    notices.includes('Your approval has been received'),
  'notify approval',
);
assert(
  engine.includes('We’ve started designing your website') ||
    engine.includes("We've started designing your website"),
  'notify design started',
);
assert(engine.includes('Your project has moved into development'), 'notify development');

assert(orch.includes('planGuideOrchestration'), 'planGuideOrchestration exported');
assert(orch.includes('applyGuideOrchestration'), 'applyGuideOrchestration exported');
assert(orch.includes('orchestrateGuideAfterSubmissionUpdate'), 'submission hook exported');
assert(orch.includes('dedupeKey'), 'idempotent dedupe keys');
assert(orch.includes('nothingRequired') || progress.includes('nothingRequired'), 'NBA wait support retained');

assert(submissions.includes('orchestrateGuideAfterSubmissionUpdate'), 'hooked into updateCtpSubmission');
assert(pulse.includes('guide.stage.advanced'), 'pulse guide.stage.advanced');
assert(pulse.includes('guide.milestone.completed'), 'pulse guide.milestone.completed');
assert(pulse.includes('guide.celebrate'), 'pulse guide.celebrate');

assert(progress.includes('resolveGuideStages'), 'progress uses stage engine');
assert(progress.includes('timeline:'), 'auto timeline on progress view');
assert(progress.includes('documentsAvailable'), 'document availability on progress view');
assert(progress.includes('celebrationMessage'), 'celebration message on progress view');

assert(page.includes('celebrationMessage'), 'page renders celebration');
assert(page.includes('documentsAvailable'), 'page renders documents');
assert(!page.includes('Executive Snapshot'), 'page has no Executive Snapshot');
assert(!page.includes('AI Evaluation'), 'page has no AI Evaluation');

// No second status field / no auth-routing-provisioning churn in orchestration
assert(!orch.includes('requirePortalSession'), 'orchestration does not touch auth');
assert(!orch.includes('fulfillPaidClient'), 'orchestration does not touch provisioning');
assert(!orch.includes('redirect('), 'orchestration does not change routing');

for (const term of ['Executive Snapshot', 'Admin drag', 'Business Intelligence', 'AI Evaluation']) {
  assert(!engine.includes(term), `engine must not contain "${term}"`);
  assert(!orch.includes(term), `orchestration must not contain "${term}"`);
  assert(!notices.includes(term), `notices must not contain "${term}"`);
}

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log('\nAll guide orchestration contracts passed.');
