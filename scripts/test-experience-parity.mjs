/**
 * Contract: Experience parity — Journey / Support / Documents honor Guide model.
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

const journeyView = read('lib/ctp-opportunity-view.ts');
const journeyUi = read('app/portal/components/ClientExperience.tsx');
const support = read('lib/ctp-support-view.ts');
const supportPage = read('app/portal/[slug]/ctp/support/page.tsx');
const docs = read('lib/ctp-documents-view.ts');
const engine = read('lib/project-state-engine.ts');

// P1 Journey
assert(journeyView.includes('buildGuideProgressView'), 'Journey view builds Guide model');
assert(journeyView.includes('nothingRequired'), 'Journey tracks nothingRequired');
assert(journeyView.includes('guide:'), 'Journey view exports guide block');
assert(
  !journeyView.includes("label: 'Schedule a Conversation'"),
  'Journey utilities no longer always Schedule',
);
assert(journeyUi.includes('view.guide?.nothingRequired'), 'Journey UI honors nothingRequired');
assert(!journeyUi.includes('Schedule your Opportunity Review'), 'Journey CTA not hard Schedule');
assert(
  journeyUi.includes("We've got everything we need") ||
    journeyUi.includes('We&apos;ve got everything we need'),
  'Journey idle reassurance copy',
);

// P2 Support
assert(support.includes('nothingRequired'), 'Support knows idle state');
assert(
  support.includes('Ask a question anytime') || support.includes('Email support'),
  'Support offers contact when idle',
);
assert(!support.includes('/updates/new'), 'Support does not push Update Hub');
assert(!support.includes('Book strategy conversation'), 'Support idle has no Calendly CTA');
assert(!support.includes('CALENDLY_URL') || support.includes("calendlyUrl: ''"), 'Calendly not primary');
assert(support.includes('behindTheScenes'), 'Support exposes behind the scenes');
assert(support.includes("We've got everything we need"), 'Support idle headline');
assert(supportPage.includes('behindTheScenes'), 'Support page renders behind the scenes');

// P3 Documents
assert(docs.includes('isAuthoritativeProposalId'), 'Documents use authoritative proposal check');
assert(docs.includes('resolveGuideStages'), 'Documents use Guide stage resolution');
assert(docs.includes('buildGuideProgressView'), 'Documents use Guide progress view');
assert(docs.includes('proposalReady'), 'Documents gate proposal readiness');
assert(!docs.includes('ready: Boolean(submission.proposalId)'), 'Documents do not use raw proposalId');
assert(docs.includes('WPS') || engine.includes('WPS-'), 'WPS filtering available');

// Engine untouched by this sprint intent — still present as SSOT
assert(engine.includes('applyProjectEvidence'), 'Project State Engine still present');

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log('\nAll experience parity contracts passed.');
