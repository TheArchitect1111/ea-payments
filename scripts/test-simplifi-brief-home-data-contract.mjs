#!/usr/bin/env node
/**
 * Contract: Simplifi Brief home Pass 2 — grounded summaries + empty states.
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

const helper = readFileSync(join(root, 'lib/simplifi/brief-home.ts'), 'utf8');
assert(helper.includes('buildBriefHomeSummaries'), 'summary builder required');
assert(helper.includes('opportunityStatusLine'), 'opportunity status line required');
assert(helper.includes('briefHomeEmptyState'), 'empty state helper required');
assert(helper.includes('opportunities deserve'), 'attention aggregate copy required');
assert(helper.includes('proposal is ready') || helper.includes('proposals are ready'), 'proposal aggregate required');
assert(!/CPR Basketball|Mack Attack|Amanda Katherine/.test(helper), 'no mock filler');

const ws = readFileSync(join(root, 'app/simplifi/workspace/SimplifiWorkspace.tsx'), 'utf8');
assert(ws.includes('buildBriefHomeSummaries'), 'workspace must use summary builder');
assert(ws.includes('opportunityStatusLine'), 'workspace must use status lines');
assert(ws.includes('briefHomeEmptyState'), 'workspace must use empty states');
assert(ws.includes('sw-today-icon--attention') || ws.includes('item.tone'), 'tone icons wired');

const homeContract = readFileSync(join(root, 'scripts/test-simplifi-brief-home-contract.mjs'), 'utf8');
assert(homeContract.includes('sw-home-hero'), 'pass1 home contract still present');

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS simplifi-brief-home-data-contract');
