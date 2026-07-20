#!/usr/bin/env node
/**
 * Contract: Experience Director Phase 2 Calibration & Benchmarking.
 * Run: node scripts/test-factory-experience-director-calibration.mjs
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

function read(rel) {
  const path = join(root, rel);
  assert(existsSync(path), `missing ${rel}`);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

const calibration = read('lib/factory-experience-director-calibration.ts');
assert(calibration.includes('goldStandards'), 'gold standard store');
assert(calibration.includes('appendGoldStandardReview'), 'append gold');
assert(calibration.includes('importValidationEntriesToGoldStandard'), 'import validation');
assert(calibration.includes('computeAiHumanComparison'), 'AI vs human');
assert(calibration.includes('agreementPercent'), 'agreement %');
assert(calibration.includes('approvalMatch'), 'approval match');
assert(calibration.includes('highDisagreementCategories'), '>10pt disagreements');
assert(calibration.includes('computeReviewerAgreementGroups'), 'reviewer agreement');
buildAssert(calibration, 'buildCalibrationDashboard', 'calibration dashboard builder');
assert(calibration.includes('industryBenchmarks'), 'industry benchmarks');
assert(calibration.includes('organizationSizeBenchmarks'), 'org size benchmarks');
assert(calibration.includes('projectTypeBenchmarks'), 'project type benchmarks');
assert(calibration.includes('correlations'), 'correlation analysis');
assert(calibration.includes('mostCommonFailures'), 'constitution analytics');
assert(calibration.includes('reviewerWeightSchemeId'), 'future reviewer weighting');
assert(calibration.includes('adaptiveProfileId'), 'future adaptive scoring');
assert(calibration.includes('modelGeneration'), 'future model comparison');

function buildAssert(src, needle, msg) {
  assert(src.includes(needle), msg);
}

const confidence = read('lib/factory-experience-director-confidence.ts');
assert(confidence.includes('Very High'), 'confidence levels');
assert(confidence.includes('reasons'), 'confidence why');

const api = read('app/api/admin/factory/experience-director/calibration/route.ts');
assert(api.includes('import_validation'), 'import action');
assert(api.includes('compare'), 'compare action');
assert(api.includes('add_gold'), 'add gold action');

const page = read('app/admin/ea-factory/experience-director/calibration/page.tsx');
assert(page.includes('Calibration & Benchmarking'), 'calibration page');

const client = read('app/admin/ea-factory/experience-director/calibration/CalibrationClient.tsx');
assert(client.includes('Dataset health'), 'dataset health');
assert(client.includes('Agreement %'), 'agreement display');
assert(client.includes('Confidence distribution'), 'confidence distribution');
assert(client.includes('Top reviewer disagreements') || client.includes('disagreements'), 'disagreements');
assert(client.includes('Most reliable categories'), 'reliable categories');
assert(client.includes('Correlation analysis'), 'correlations UI');

const publish = read('lib/factory-publish-website.ts');
assert(!publish.includes('gold-standard'), 'publish must not use gold store');
assert(!publish.includes('experience-director-calibration'), 'publish unchanged by calibration');

const manifest = read('lib/factory-capability-manifest.mjs');
assert(!manifest.includes("id: 'experience_director'"), 'no new Factory capability');

const validationStore = read('lib/factory-experience-director-validation.ts');
assert(
  validationStore.includes('experience-director-validation.json'),
  'validation store path preserved',
);
assert(
  calibration.includes('experience-director-gold-standard.json'),
  'gold store is separate file',
);

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS factory-experience-director-calibration-contract');
