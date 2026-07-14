/**
 * CTP portal progress + Design Studio wiring checks.
 * Run: node scripts/test-ctp-portal-progress.mjs
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

const statusPath = join(root, 'lib/ctp-portal-status.ts');
const pagePath = join(root, 'app/portal/[slug]/ctp/page.tsx');

assert(existsSync(statusPath), 'Missing ctp-portal-status.ts');
assert(existsSync(pagePath), 'Missing portal CTP page');

const status = readFileSync(statusPath, 'utf8');
const page = readFileSync(pagePath, 'utf8');

assert(status.includes("'assessment'"), 'Timeline must include assessment');
assert(status.includes("'digital-audit'"), 'Timeline must include digital-audit');
assert(status.includes("'executive-report'"), 'Timeline must include executive-report');
assert(status.includes("'reveal'"), 'Timeline must include reveal');
assert(status.includes('designStudio'), 'Must expose Design Studio checklist');
assert(status.includes('percentComplete'), 'Must expose percentComplete');
assert(page.includes('Design Studio'), 'Portal page must render Design Studio');
assert(page.includes('percentComplete'), 'Portal page must show progress percent');
assert(page.includes('ctpPulse'), 'Active steps should animate');

if (failures.length) {
  console.error('CTP portal progress checks FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('CTP portal progress checks: PASS');
process.exit(0);
