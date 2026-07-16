#!/usr/bin/env node
/**
 * Contract: SIMPLIFI Orb System (corner intelligence layer).
 * Run: node scripts/test-simplifi-orb-system-contract.mjs
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

const files = [
  'lib/orb/types.ts',
  'lib/orb/priority.ts',
  'lib/orb/derive-state.ts',
  'lib/orb/copy.ts',
  'lib/orb/load-context.ts',
  'app/simplifi/components/GlobalOrb.tsx',
  'app/simplifi/components/SimplifiProductShell.tsx',
  'app/simplifi/components/global-orb.css',
  'docs/SIMPLIFI-ORB-SYSTEM.md',
];

for (const rel of files) {
  assert(existsSync(join(root, rel)), `missing ${rel}`);
}

const priority = readFileSync(join(root, 'lib/orb/priority.ts'), 'utf8');
assert(priority.includes("'offline'"), 'offline priority required');
assert(priority.includes("'timeSensitive'"), 'timeSensitive priority required');
assert(priority.indexOf("'offline'") < priority.indexOf("'idle'"), 'offline before idle');

const derive = readFileSync(join(root, 'lib/orb/derive-state.ts'), 'utf8');
assert(derive.includes('deriveOrbSession'), 'deriveOrbSession required');
assert(!derive.includes('fabricat'), 'must not fabricate');

const globalOrb = readFileSync(join(root, 'app/simplifi/components/GlobalOrb.tsx'), 'utf8');
assert(globalOrb.includes('Ask about your workspace'), 'expanded ask required');
assert(globalOrb.includes('Recommended next step'), 'recommendation block required');
assert(globalOrb.includes('global-orb-btn'), 'resting orb button required');
assert(globalOrb.includes('global-orb-liquid'), 'liquid-light core required');
assert(globalOrb.includes('global-orb-mark'), 'ORB wordmark required for companion presence');
assert(globalOrb.includes('global-orb-rim'), 'glass rim required');
assert(globalOrb.includes('visibilitychange'), 'must pause motion when tab hidden');
assert(globalOrb.includes('aria-controls'), 'orb button must control panel');
assert(globalOrb.includes("e.key !== 'Tab'"), 'expanded panel must trap keyboard focus');
assert(globalOrb.includes("document.body.style.overflow = 'hidden'"), 'expanded panel must lock background scroll');

const css = readFileSync(join(root, 'app/simplifi/components/global-orb.css'), 'utf8');
assert(css.includes('safe-area-inset'), 'safe-area required');
assert(css.includes('prefers-reduced-motion'), 'reduced-motion required');
assert(css.includes('#1b2b4d') || css.includes('--orb-navy'), 'navy brand required');
assert(css.includes('#c9a844') || css.includes('--orb-gold'), 'gold brand required');
assert(css.includes('global-orb-liquid'), 'liquid light CSS required');
assert(css.includes('global-orb-blossom'), 'blossom panel entrance required');
assert(css.includes('data-paused'), 'paused motion CSS required');
assert(css.includes('--orb-size') || css.includes('64px'), 'companion size required');
assert(css.includes('global-orb-mark'), 'wordmark CSS required');
assert(css.includes('global-orb-rim'), 'rim CSS required');

const workspace = readFileSync(join(root, 'app/simplifi/workspace/page.tsx'), 'utf8');
assert(workspace.includes('SimplifiProductShell'), 'workspace must use product shell');
assert(!workspace.includes("redirect('/simplifi/orb')"), 'workspace must not redirect to chat orb');

const orbPage = readFileSync(join(root, 'app/simplifi/orb/page.tsx'), 'utf8');
assert(orbPage.includes("redirect('/simplifi/workspace')"), 'orb default must redirect to workspace');
assert(orbPage.includes("chat !== '1'") || orbPage.includes('chat=1'), 'chat escape hatch required');

const workspaceClient = readFileSync(join(root, 'app/simplifi/workspace/SimplifiWorkspace.tsx'), 'utf8');
assert(!workspaceClient.includes('CompanionOrb'), 'Brief must not double-mount CompanionOrb');

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS simplifi-orb-system-contract');
