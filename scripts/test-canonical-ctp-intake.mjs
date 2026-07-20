#!/usr/bin/env node
/**
 * Contract: only canonical CTP intake URL is recommended publicly.
 * Run: node scripts/test-canonical-ctp-intake.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const failures = [];
const CANONICAL = 'https://cc.efficiencyarchitects.online/ctp';

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function read(rel) {
  const path = join(root, rel);
  assert(existsSync(path), `missing ${rel}`);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

const urls = read('lib/platform-urls.ts');
assert(urls.includes('CANONICAL_CTP_INTAKE_URL'), 'CANONICAL_CTP_INTAKE_URL export required');
assert(urls.includes(CANONICAL), 'canonical CTP URL must match cc host /ctp');

const marketing = read('lib/marketing-urls.ts');
assert(marketing.includes(`ctp: '${CANONICAL}'`) || marketing.includes(CANONICAL), 'PUBLIC_LINKS.ctp required');
assert(marketing.includes('NOT CTP') || marketing.includes('storyDemo'), 'Magnifi must not be labeled CTP');

const fulfill = read('lib/package-fulfillment.ts');
assert(fulfill.includes('CANONICAL_CTP_INTAKE_URL'), 'fulfillment default intake must use canonical CTP');
assert(!fulfill.includes("intakePath ?? '/discover'"), 'must not default intake to /discover');

const webhook = read('app/api/webhooks/stripe/route.ts');
assert(webhook.includes('CANONICAL_CTP_INTAKE_URL'), 'stripe fallback intake must use canonical CTP');
assert(!webhook.includes("intakePath || '/discover'"), 'stripe must not fallback to /discover');

const docs = read('docs/LAUNCH-PREFLIGHT.md');
assert(docs.includes(CANONICAL), 'LAUNCH-PREFLIGHT must pin canonical CTP');
assert(!/ctp-intake as CTP intake|CTP intake.*\/discover/i.test(docs), 'preflight must not recommend wrong CTP surfaces');

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS canonical-ctp-intake-contract');
