#!/usr/bin/env node
/**
 * Contract: Orb ambient openers (Step 3) — grounded in Brief / Action Center only.
 * Run: node scripts/test-simplifi-orb-ambient-openers-contract.mjs
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

const ambientPath = join(root, 'lib/orb/ambient.ts');
assert(existsSync(ambientPath), 'missing lib/orb/ambient.ts');
const ambient = existsSync(ambientPath) ? readFileSync(ambientPath, 'utf8') : '';
assert(ambient.includes('buildAmbientOpeningFromSession'), 'session ambient opener required');
assert(ambient.includes('buildBriefAmbientLead'), 'Brief lead line required');
assert(ambient.includes('collectAmbientAttentionTitles'), 'attention title collector required');
assert(ambient.includes('needsAttention'), 'must source needsAttention');
assert(ambient.includes('brief.items'), 'must source brief.items');
assert(ambient.includes('buildAmbientOpening'), 'must reuse buildAmbientOpening');
assert(!/I noticed|While you (were|slept)|trending again/i.test(ambient), 'must not invent insight templates');

const index = readFileSync(join(root, 'lib/orb/index.ts'), 'utf8');
assert(index.includes('buildAmbientOpeningFromSession'), 'lib/orb must export ambient opener');
assert(index.includes('buildBriefAmbientLead'), 'lib/orb must export Brief lead');

const globalOrb = readFileSync(join(root, 'app/simplifi/components/GlobalOrb.tsx'), 'utf8');
assert(globalOrb.includes('buildAmbientOpeningFromSession'), 'GlobalOrb must use ambient opener');
assert(globalOrb.includes('ambientOpener'), 'GlobalOrb must hold ambient opener state');
assert(globalOrb.includes('ambientShownRef'), 'ambient must be one-shot per page load');
assert(globalOrb.includes('global-orb-ambient'), 'ambient must render in panel');
assert(globalOrb.includes('Review them'), 'ambient must offer Review them when findings exist');

const workspace = readFileSync(join(root, 'app/simplifi/workspace/SimplifiWorkspace.tsx'), 'utf8');
assert(workspace.includes('buildBriefAmbientLead'), 'Brief must show ambient lead');
assert(workspace.includes('sw-ambient-lead'), 'Brief lead must use ambient class');

const orbShell = readFileSync(join(root, 'app/simplifi/orb/OrbOsShell.tsx'), 'utf8');
assert(orbShell.includes('buildAmbientOpeningFromSession'), 'OrbOsShell must reuse session ambient helper');

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS simplifi-orb-ambient-openers-contract');
