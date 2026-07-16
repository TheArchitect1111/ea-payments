#!/usr/bin/env node
/**
 * Contract: Orb outcome flashes (Step 4) — real capture / opportunity actions only.
 * Run: node scripts/test-simplifi-orb-outcome-states-contract.mjs
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

const types = readFileSync(join(root, 'lib/orb/types.ts'), 'utf8');
assert(types.includes('OrbOutcomeFlash'), 'OrbOutcomeFlash type required');
assert(types.includes("'success'"), 'success flash required');
assert(types.includes("'learning'"), 'learning flash required');

const index = readFileSync(join(root, 'lib/orb/index.ts'), 'utf8');
assert(index.includes('OrbOutcomeFlash'), 'lib/orb must export OrbOutcomeFlash');

const globalOrb = readFileSync(join(root, 'app/simplifi/components/GlobalOrb.tsx'), 'utf8');
assert(globalOrb.includes('outcomeFlash'), 'GlobalOrb must hold outcomeFlash state');
assert(globalOrb.includes('flashOutcome'), 'GlobalOrb must expose flashOutcome');
assert(globalOrb.includes('displayState'), 'GlobalOrb must merge displayState');
assert(globalOrb.includes('onOutcomeFlash={flashOutcome}'), 'GlobalOrb must pass flash to SessionWorkspace');
assert(globalOrb.includes('OUTCOME_FLASH_MS'), 'flash duration constant required');

const css = readFileSync(join(root, 'app/simplifi/components/global-orb.css'), 'utf8');
assert(css.includes("[data-state='success']") || css.includes('[data-state="success"]'), 'success CSS required');
assert(css.includes("[data-state='learning']") || css.includes('[data-state="learning"]'), 'learning CSS required');
assert(css.includes("[data-state='celebration']") || css.includes('[data-state="celebration"]'), 'celebration CSS reserved');

const session = readFileSync(join(root, 'app/simplifi/components/session/SessionWorkspace.tsx'), 'utf8');
assert(session.includes('onOutcomeFlash'), 'SessionWorkspace must accept onOutcomeFlash');
assert(session.includes("onOutcomeFlash?.('success')"), 'capture success must flash success');

const actions = readFileSync(join(root, 'app/simplifi/opportunity/[id]/OpportunityActions.tsx'), 'utf8');
assert(actions.includes('onOutcomeFlash'), 'OpportunityActions must accept onOutcomeFlash');
assert(actions.includes("onOutcomeFlash?.('success')"), 'won must flash success');
assert(actions.includes("onOutcomeFlash?.('learning')"), 'Build Intelligence must flash learning');

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS simplifi-orb-outcome-states-contract');
