#!/usr/bin/env node
/**
 * Contract: Experience Director review artifact + publish gate.
 * Run: node scripts/test-factory-experience-director.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const failures = [];
const require = createRequire(import.meta.url);

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function read(rel) {
  const path = join(root, rel);
  assert(existsSync(path), `missing ${rel}`);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

const artifact = require('../lib/factory-artifact.mjs');
assert(
  artifact.ARTIFACT_KINDS.includes('experience_review'),
  'experience_review must be a registered artifact kind',
);

const reviewSrc = read('lib/factory-experience-review.ts');
assert(reviewSrc.includes("Approved'"), 'Approved status');
assert(reviewSrc.includes('Needs Refinement'), 'Needs Refinement status');
assert(reviewSrc.includes('Rejected'), 'Rejected status');
assert(reviewSrc.includes('assertExperienceDirectorPublishGate'), 'publish gate helper');

const directorSrc = read('lib/factory-experience-director.ts');
assert(directorSrc.includes('evaluateExperienceForDirector'), 'evaluator required');
assert(directorSrc.includes('getLatestExperienceReviewFromProject'), 'latest review loader');
assert(!directorSrc.includes('CAPABILITY_MANIFEST'), 'must not wire Launch capability manifest');

const publish = read('lib/factory-publish-website.ts');
assert(publish.includes('assertExperienceDirectorPublishGate'), 'publish requires director gate');

const dash = read('app/admin/ea-factory/experience-director/ExperienceDirectorClient.tsx');
assert(dash.includes('Overall Score'), 'overall score');
assert(dash.includes('Story Score'), 'story score');
assert(dash.includes('Visual Score'), 'visual score');
assert(dash.includes('Originality Score'), 'originality score');
assert(dash.includes('Executive Experience Score'), 'executive score');
assert(dash.includes('Wow Score'), 'wow score');
assert(dash.includes('requiredImprovements'), 'required improvements');
assert(dash.includes('!canPublish'), 'publish disabled unless Approved');

const api = read('app/api/admin/factory/experience-director/route.ts');
assert(api.includes('runExperienceDirectorReview'), 'API can append review');
assert(api.includes('requireAdminActionFromRequest'), 'API requires admin');

const manifest = read('lib/factory-capability-manifest.mjs');
assert(
  !manifest.includes("id: 'experience_director'"),
  'must not register experience_director in Launch orchestration yet',
);

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS factory-experience-director-contract');
