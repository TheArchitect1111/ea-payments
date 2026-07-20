#!/usr/bin/env node
/**
 * Contract: Experience Director Phase 1 Validation Framework.
 * Run: node scripts/test-factory-experience-director-validation.mjs
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

const validation = read('lib/factory-experience-director-validation.ts');
assert(validation.includes('appendExperienceDirectorValidationEntry'), 'validation append');
assert(validation.includes('buildValidationAnalytics'), 'analytics builder');
assert(validation.includes('Average Overall') || validation.includes('averages'), 'averages');
assert(validation.includes('mostCommonRejectionReasons'), 'rejection reasons');
assert(validation.includes('mostCommonRequiredImprovements'), 'improvements');
assert(validation.includes('constitutionRulesFailingMost'), 'constitution failures');
assert(validation.includes('improvingOverTime'), 'trend analysis');
assert(validation.includes('industriesScoringLower'), 'industry trends');
assert(validation.includes('blueprintVersion'), 'blueprint version');
assert(validation.includes('reviewer'), 'reviewer');
assert(validation.includes('rationale'), 'rationale');

assert(validation.includes('writeStoreAtomic') || validation.includes('.tmp'), 'atomic store write');
assert(validation.includes('appendChain') || validation.includes('Serialize appends'), 'append serialization');
assert(validation.includes('isExperienceDirectorApprovalStatus'), 'approval status validation');
assert(validation.includes('quarantineCorruptStore') || validation.includes('corrupt'), 'corrupt store quarantine');

const api = read('app/api/admin/factory/experience-director/validation/route.ts');
assert(api.includes('validationMode'), 'validation mode API');
assert(api.includes('requireAdminActionFromRequest'), 'admin auth');
assert(api.includes('appendValidationEntryAndAnalytics'), 'single-read append+analytics');
assert(!api.includes('withConfidence'), 'confidence owned by createValidationEntryFromReview');

const dash = read('app/admin/ea-factory/experience-director/validation/page.tsx');
assert(dash.includes('Validation Framework'), 'validation dashboard page');

const client = read('app/admin/ea-factory/experience-director/ExperienceDirectorClient.tsx');
assert(client.includes('Validation Mode'), 'validation mode toggle');
assert(client.includes('/experience-director/validation'), 'link to validation dashboard');

const publish = read('lib/factory-publish-website.ts');
assert(
  !publish.includes('experience-director-validation'),
  'publish must not depend on validation store',
);

const manifest = read('lib/factory-capability-manifest.mjs');
assert(
  !manifest.includes("id: 'experience_director'"),
  'must not add experience_director capability',
);

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS factory-experience-director-validation-contract');
