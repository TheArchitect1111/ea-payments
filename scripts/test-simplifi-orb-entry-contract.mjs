#!/usr/bin/env node
/**
 * Contract: Simplifi Orb branded entry on EA domain.
 * Preferred: https://app.efficiencyarchitects.online/simplifiorb
 * Fallback:  https://efficiencyarchitects.online/simplifiorb
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const page = readFileSync(join(root, 'app/simplifiorb/page.tsx'), 'utf8');
assert(page.includes("redirect('/simplifi/workspace')"), 'simplifiorb must redirect to Brief');

const host = readFileSync(join(root, 'lib/simplifi-app-host.ts'), 'utf8');
assert(host.includes('app.efficiencyarchitects.online'), 'app host must include EA app subdomain');
assert(host.includes("'/simplifiorb'"), 'app host aliases must include /simplifiorb');
assert(host.includes('SIMPLIFI_ORB_ENTRY_URL'), 'must export SIMPLIFI_ORB_ENTRY_URL');

const marketing = readFileSync(join(root, 'lib/marketing-urls.ts'), 'utf8');
assert(
  marketing.includes('app.efficiencyarchitects.online/simplifiorb'),
  'PUBLIC_LINKS must advertise branded Orb entry',
);

const ops = readFileSync(join(root, 'lib/simplifi-pass1-ops.ts'), 'utf8');
assert(ops.includes('SIMPLIFI_ORB_ENTRY_URL') || ops.includes('simplifiorb'), 'pass1 ops must know Orb entry');
assert(ops.includes('app.efficiencyarchitects.online'), 'pass1 attention must target EA app host');

const portal = readFileSync(join(root, 'lib/ctp-portal-host.ts'), 'utf8');
assert(portal.includes("'simplifiorb'"), 'simplifiorb must be reserved (not a portal slug)');

const mw = readFileSync(join(root, 'middleware.ts'), 'utf8');
assert(mw.includes('/simplifiorb'), 'middleware matcher must include /simplifiorb');

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS simplifi-orb-entry-contract');
