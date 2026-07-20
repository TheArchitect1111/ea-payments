/**
 * Contract: Dynamic Guide Intelligence catalog + NBA priority engine.
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

const adapter = read('lib/ctp-guide-progress.ts');
const page = read('app/portal/[slug]/ctp/progress/page.tsx');

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

assert(adapter.includes('GUIDE_STAGE_NARRATIVES'), 'stage narrative catalog exported');
for (const stage of stages) {
  assert(adapter.includes(`${stage}:`), `narrative includes ${stage}`);
}

assert(adapter.includes('headline:'), 'narratives include headline');
assert(adapter.includes('behindTheScenes:'), 'narratives include behindTheScenes');
assert(adapter.includes('expectedDuration:'), 'narratives include expectedDuration');
assert(adapter.includes('commonQuestions:'), 'narratives include commonQuestions');
assert(adapter.includes('transitionToNext:'), 'narratives include transitionToNext');

assert(adapter.includes('whatHappened'), 'milestones include whatHappened');
assert(adapter.includes('whyItMatters'), 'milestones include whyItMatters');
assert(adapter.includes('whatItUnlocked'), 'milestones include whatItUnlocked');
assert(adapter.includes('confidenceMessage'), 'confidence messages present');
assert(adapter.includes('nothingRequired'), 'NBA supports wait / nothing required');
assert(adapter.includes('priority: 1'), 'NBA priority blocking');
assert(adapter.includes('priority: 9'), 'NBA priority wait');

const banned = [
  'AI Evaluation',
  'Executive Snapshot',
  'Admin drag',
  'Business Intelligence',
  'executive report',
  'AI production',
];
for (const term of banned) {
  assert(!adapter.toLowerCase().includes(term.toLowerCase()) || term === 'AI production', `no "${term}" in guide copy`);
}

// Stronger check: banned phrases must not appear in narrative string literals area
for (const term of ['Executive Snapshot', 'Admin drag', 'Business Intelligence', 'AI Evaluation']) {
  assert(!adapter.includes(term), `adapter must not contain "${term}"`);
}

assert(page.includes('confidenceMessage'), 'page renders confidence');
assert(page.includes('nothingRequired'), 'page handles wait NBA');
assert(page.includes('commonQuestions'), 'page renders stage FAQs');
assert(page.includes('whatHappened'), 'page renders rich milestones');

process.exit(failed ? 1 : 0);
