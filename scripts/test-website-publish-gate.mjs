#!/usr/bin/env node
/**
 * Contract: unified publish gate is the only publish implementation.
 * Run: node scripts/test-website-publish-gate.mjs
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

assert(existsSync(join(root, 'lib/website-publish-gate.ts')), 'website-publish-gate.ts required');

const gate = read('lib/website-publish-gate.ts');
assert(gate.includes('publishWebsiteThroughDirectorGate'), 'unified publish function required');
assert(gate.includes('evaluateExperienceForDirector'), 'must run Experience Director');
assert(gate.includes('assertExperienceDirectorPublishGate'), 'must assert Approved gate');
assert(gate.includes("status: 'published'"), 'must set published only after approval');

const provision = read('lib/provision-website-portal.ts');
assert(
  provision.includes('publishWebsiteThroughDirectorGate'),
  'provision must delegate to unified gate',
);
assert(
  !provision.includes("status: 'published'"),
  'provision must not publish independently of the gate',
);

const fulfill = read('lib/fulfill-paid-client.ts');
assert(fulfill.includes('provisionWebsitePortalSite'), 'fulfill uses provisioner');
assert(
  fulfill.includes('Website publish blocked by Experience Director') ||
    fulfill.includes('unified publish gate'),
  'fulfill must fail closed when Director rejects',
);

const factory = read('lib/factory-publish-website.ts');
assert(factory.includes('provisionWebsitePortalSite'), 'factory must reuse provisioner');
assert(
  !factory.includes('getLatestExperienceReviewFromProject'),
  'factory must not use a separate ED pre-check bypass path',
);

const publishPage = read('lib/experience-builder/publish-page.ts');
assert(
  publishPage.includes('publishExistingExperiencePageThroughDirectorGate'),
  'Experience Builder publish must use unified gate',
);

const pageStore = read('lib/experience-builder/page-store.ts');
assert(
  pageStore.includes('bypasses the unified publish gate'),
  'markExperiencePagePublished must refuse direct bypass',
);

if (failures.length) {
  console.error('FAIL website-publish-gate');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS website-publish-gate-contract');
