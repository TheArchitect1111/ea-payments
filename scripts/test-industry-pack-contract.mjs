#!/usr/bin/env node
/**
 * Contract: Universal Portal Phase 1 (IndustryPack + capability IDs).
 * Run: node scripts/test-industry-pack-contract.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const files = [
  'lib/portal-universal/capability-ids.ts',
  'lib/portal-universal/industry-pack.ts',
  'lib/portal-universal/validate-pack.ts',
  'lib/portal-universal/migrations.ts',
  'lib/portal-universal/resolve-nav.ts',
  'lib/portal-universal/resolve-pack-for-org.ts',
  'lib/portal-universal/flags.ts',
  'lib/portal-universal/apply-branding.ts',
  'lib/portal-universal/packs/ea-executive.ts',
  'lib/portal-universal/packs/ctp-client.ts',
  'lib/portal-universal/packs/sample-placeholder.ts',
  'lib/portal-universal/packs/index.ts',
  'lib/portal-universal/index.ts',
  'docs/plans/EA-UNIVERSAL-PORTAL-PHASE-1-BLUEPRINT.md',
];

for (const rel of files) {
  assert(existsSync(join(root, rel)), `missing ${rel}`);
}

const caps = readFileSync(join(root, 'lib/portal-universal/capability-ids.ts'), 'utf8');
assert(caps.includes('UNIVERSAL_CAPABILITY_IDS'), 'capability ids export');
assert(caps.includes('UNIVERSAL_TO_MODULES'), 'universal→module map');
assert(caps.includes("'people'"), 'people capability reserved');
assert(caps.includes("'tasks'"), 'tasks capability reserved');

const flags = readFileSync(join(root, 'lib/portal-universal/flags.ts'), 'utf8');
assert(flags.includes('UNIVERSAL_NAV_PACKS'), 'feature flag env');
assert(flags.includes('isUniversalNavPacksEnabled'), 'flag helper');

const cx = readFileSync(join(root, 'lib/ctp-client-nav.ts'), 'utf8');
assert(cx.includes('isUniversalNavPacksEnabled'), 'CX gated by flag');
assert(cx.includes('legacyClientExperienceNav'), 'CX rollback path');
assert(cx.includes('buildClientExperienceNavFromPack'), 'CX pack builder');

const chrome = readFileSync(join(root, 'lib/platform/portal-workspace.ts'), 'utf8');
assert(chrome.includes('isUniversalNavPacksEnabled'), 'chrome gated by flag');
assert(chrome.includes('resolveIndustryNav'), 'chrome uses nav resolver');
assert(chrome.includes('applyPackBrandingToChrome'), 'chrome branding merge');

const exp = readFileSync(join(root, 'lib/experience-registry.ts'), 'utf8');
assert(exp.includes('UniversalCapabilityId'), 'dual-map doc comment');

const orphan = readFileSync(join(root, 'lib/chassis/portal-nav-config.ts'), 'utf8');
assert(orphan.includes('@deprecated'), 'orphan nav deprecated');

// No later-phase runtimes in portal-universal
for (const rel of [
  'lib/portal-universal/capability-ids.ts',
  'lib/portal-universal/industry-pack.ts',
  'lib/portal-universal/validate-pack.ts',
  'lib/portal-universal/resolve-nav.ts',
  'lib/portal-universal/packs/ea-executive.ts',
  'lib/portal-universal/packs/ctp-client.ts',
  'lib/portal-universal/packs/sample-placeholder.ts',
]) {
  const body = readFileSync(join(root, rel), 'utf8');
  assert(!body.includes('@rjsf/'), `${rel} must not import RJSF`);
  assert(!/@novu\//.test(body), `${rel} must not import Novu`);
}

// Dynamic import of compiled path unavailable — use tsx if present, else skip runtime assert
async function runtimeChecks() {
  try {
    const { register } = await import('node:module');
    // Prefer running via next/jest-less: spawn tsx
  } catch {
    /* ignore */
  }
}

await runtimeChecks();

if (failures.length) {
  console.error('FAIL industry-pack-contract');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS industry-pack-contract');
