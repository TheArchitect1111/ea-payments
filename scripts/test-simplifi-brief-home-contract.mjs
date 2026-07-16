#!/usr/bin/env node
/**
 * Contract: Simplifi Brief mobile home (Pass 1).
 * Hero + Today's Brief + Recent Opportunities + mobile dock.
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

const ws = readFileSync(join(root, 'app/simplifi/workspace/SimplifiWorkspace.tsx'), 'utf8');
assert(ws.includes('sw-home-hero'), 'home hero required');
assert(ws.includes("Today&apos;s Brief") || ws.includes("Today's Brief"), "Today's Brief card required");
assert(ws.includes('Recent Opportunities'), 'Recent Opportunities required');
assert(ws.includes('sw-mobile-dock'), 'mobile dock required');
assert(ws.includes('buildBriefAmbientLead'), 'ambient lead must stay grounded');
assert(!/CPR Basketball|Mack Attack|Amanda Katherine/.test(ws), 'no mock filler rows');

const css = readFileSync(join(root, 'app/simplifi/workspace/simplifi-workspace.css'), 'utf8');
assert(css.includes('.sw-home-hero'), 'hero styles required');
assert(css.includes('.sw-today-brief'), 'brief card styles required');
assert(css.includes('.sw-recent-opps'), 'recent opps styles required');
assert(css.includes('.sw-mobile-dock'), 'dock styles required');

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS simplifi-brief-home-contract');
