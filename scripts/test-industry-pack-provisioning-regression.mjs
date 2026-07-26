#!/usr/bin/env node
/**
 * Provisioning regression: fulfill-paid-client must not be altered by IndustryPack Phase 1.
 * Run: node scripts/test-industry-pack-provisioning-regression.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const failures = [];

function assert(c, m) {
  if (!c) failures.push(m);
}

const fulfill = join(root, 'lib/fulfill-paid-client.ts');
assert(existsSync(fulfill), 'fulfill-paid-client exists');
const body = readFileSync(fulfill, 'utf8');
assert(!body.includes('portal-universal'), 'fulfill must not import portal-universal in Phase 1');
assert(!body.includes('IndustryPack'), 'fulfill must not reference IndustryPack');
assert(!body.includes('UNIVERSAL_NAV_PACKS'), 'fulfill must not depend on nav flag');
assert(body.includes('ensurePackageEntitlements') || body.includes('fulfillPaidClient'), 'fulfill still present');

const packs = readFileSync(join(root, 'lib/portal-universal/packs/index.ts'), 'utf8');
assert(!packs.includes('fulfill-paid-client'), 'packs must not import fulfill');

if (failures.length) {
  console.error('FAIL industry-pack-provisioning-regression');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}
console.log('PASS industry-pack-provisioning-regression');
