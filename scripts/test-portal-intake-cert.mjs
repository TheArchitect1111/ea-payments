#!/usr/bin/env node
/**
 * Portal Intake cert — registry, form ledger, API, CX pack nav.
 * Run: node scripts/test-portal-intake-cert.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const required = [
  'lib/portal-forms/types.ts',
  'lib/portal-forms/store.ts',
  'app/api/portal/forms/submit/route.ts',
  'app/api/portal/forms/status/route.ts',
  'app/portal/[slug]/intake/page.tsx',
  'lib/portal-universal/packs/website-portal.ts',
  'scripts/ensure-portal-forms-airtable-schema.mjs',
];

for (const rel of required) {
  assert(existsSync(join(root, rel)), `missing ${rel}`);
}

const registry = readFileSync(join(root, 'lib/modules/registry.ts'), 'utf8');
assert(registry.includes("'intake'"), 'module registry must include intake');
assert(registry.includes("pathSegment: 'intake'"), 'intake pathSegment required');

const experience = readFileSync(join(root, 'lib/experience-registry.ts'), 'utf8');
assert(experience.includes("'client-intake'"), 'experience registry must include client-intake');

const presets = readFileSync(join(root, 'vendor/payments-contract/src/presets.ts'), 'utf8');
assert(presets.includes("'intake'"), 'LAUNCH_EDITION must include intake');

const store = readFileSync(join(root, 'lib/portal-forms/store.ts'), 'utf8');
assert(store.includes('platformStoreConfigured'), 'form store must gate on platformStoreConfigured');
assert(store.includes('Portal Form Submissions'), 'form store must define Airtable table');
assert(store.includes('createPortalFormSubmission'), 'form store must export create');
assert(store.includes('listPortalFormSubmissions'), 'form store must export list');
assert(store.includes('updatePortalFormSubmissionStatus'), 'form store must export status update');

const submitRoute = readFileSync(join(root, 'app/api/portal/forms/submit/route.ts'), 'utf8');
assert(submitRoute.includes('emitPulseEvent'), 'submit route must emit Pulse');
assert(submitRoute.includes('portal.form.submitted'), 'submit route must use portal.form.submitted');

const cxNav = readFileSync(join(root, 'lib/ctp-client-nav.ts'), 'utf8');
assert(cxNav.includes("'intake'"), 'ClientExperienceNavId must include intake');
assert(cxNav.includes('buildClientExperienceNavFromPack'), 'pack-driven CX nav required');
assert(cxNav.includes('resolvePackForOrg'), 'async nav must resolve pack for org');

const websitePack = readFileSync(join(root, 'lib/portal-universal/packs/website-portal.ts'), 'utf8');
assert(websitePack.includes("id: 'intake'"), 'website-portal pack must include intake nav');
assert(websitePack.includes('/portal/{slug}/intake'), 'website-portal intake href required');

const realEstate = readFileSync(join(root, 'lib/portal-universal/packs/real-estate.ts'), 'utf8');
assert(realEstate.includes("id: 'intake'"), 'real-estate pack must include intake nav');

const resolvePack = readFileSync(join(root, 'lib/portal-universal/resolve-pack-for-org.ts'), 'utf8');
const inferSrc = readFileSync(join(root, 'lib/portal-universal/infer-industry-pack.ts'), 'utf8');
assert(resolvePack.includes('inferIndustryPackFromCommerce'), 'resolve must use commerce pack inference');
assert(inferSrc.includes("'website-portal'"), 'infer must return website-portal for website_portal_starter');

if (failures.length) {
  console.error('FAIL portal-intake-cert');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS portal-intake-cert');
