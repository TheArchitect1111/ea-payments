#!/usr/bin/env node
/**
 * Contract: Orb language → existing Simplifi routes.
 * Run: node scripts/test-simplifi-orb-route-intents-contract.mjs
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

const routesPath = join(root, 'lib/orb-os/routes.ts');
assert(existsSync(routesPath), 'missing lib/orb-os/routes.ts');

const routes = readFileSync(routesPath, 'utf8');
assert(routes.includes('resolveOrbSurfaceHref'), 'resolveOrbSurfaceHref required');
assert(routes.includes('resolveOrbIntentHref'), 'resolveOrbIntentHref required');
assert(routes.includes("'/simplifi/inbox'"), 'inbox route required');
assert(routes.includes("'/simplifi/follow-ups'"), 'follow-ups route required');
assert(routes.includes("'/simplifi/calendar'"), 'calendar route required');
assert(routes.includes("'/simplifi/capture'"), 'capture route required');
assert(routes.includes("'/simplifi/workspace'"), 'workspace route required');
assert(routes.includes("'/simplifi/ask'"), 'ask route required');

const index = readFileSync(join(root, 'lib/orb-os/index.ts'), 'utf8');
assert(index.includes('resolveOrbIntentHref'), 'orb-os index must export resolveOrbIntentHref');

const globalOrb = readFileSync(join(root, 'app/simplifi/components/GlobalOrb.tsx'), 'utf8');
assert(globalOrb.includes('interpretOrbIntent'), 'GlobalOrb must interpret intent');
assert(globalOrb.includes('resolveOrbIntentHref'), 'GlobalOrb must resolve href');
assert(globalOrb.includes('router.push'), 'GlobalOrb must navigate');
assert(globalOrb.includes('f.href'), 'findings must be linkable');
assert(globalOrb.includes('viewAllHref'), 'View All must be context-aware');

const askClient = readFileSync(join(root, 'app/simplifi/ask/AskClient.tsx'), 'utf8');
assert(askClient.includes('interpretOrbIntent'), 'AskClient must interpret intent');
assert(askClient.includes('resolveOrbIntentHref'), 'AskClient must resolve href');

const orbShell = readFileSync(join(root, 'app/simplifi/orb/OrbOsShell.tsx'), 'utf8');
assert(orbShell.includes('resolveOrbIntentHref'), 'OrbOsShell must reuse route resolver');

// Lightweight pure assertions via dynamic import of compiled TS is unavailable;
// mirror the path table expected by resolveOrbSurfaceHref for documentation.
const expected = {
  inbox: '/simplifi/inbox',
  followups: '/simplifi/follow-ups',
  calendar: '/simplifi/calendar',
  capture: '/simplifi/capture',
  brief: '/simplifi/workspace',
  settings: '/simplifi/settings',
};
for (const [surface, href] of Object.entries(expected)) {
  assert(routes.includes(`'${href}'`) || routes.includes(`"${href}"`), `${surface} → ${href}`);
}

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS simplifi-orb-route-intents-contract');
