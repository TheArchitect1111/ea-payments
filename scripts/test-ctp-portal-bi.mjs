/**
 * CTP portal BI / Executive Snapshot wiring checks.
 * Run: node scripts/test-ctp-portal-bi.mjs
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

const biViewPath = join(root, 'lib/ctp-bi-view.ts');
const pagePath = join(root, 'app/portal/[slug]/ctp/bi/page.tsx');
const overviewViewPath = join(root, 'lib/ctp-overview-view.ts');
const adminPath = join(root, 'app/admin/ctp/CtpSubmissionsClient.tsx');

for (const [path, label] of [
  [biViewPath, 'ctp-bi-view.ts'],
  [pagePath, 'portal BI page'],
  [overviewViewPath, 'portal overview view'],
  [adminPath, 'admin CTP client'],
]) {
  assert(existsSync(path), `Missing ${label}`);
}

const biView = readFileSync(biViewPath, 'utf8');
const page = readFileSync(pagePath, 'utf8');
const overviewView = readFileSync(overviewViewPath, 'utf8');
const admin = readFileSync(adminPath, 'utf8');

assert(biView.includes('buildCtpBiView'), 'Must export BI view builder');
assert(biView.includes('executiveSnapshot'), 'BI view must read executive snapshot');
assert(biView.includes('scopeStack') || biView.includes('scope.stack'), 'BI must include project scope');
assert(page.includes('buildCtpBiView'), 'BI page must use view builder');
assert(page.includes('requirePortalModule'), 'BI page must require ctp module');
assert(page.includes('Project scope'), 'BI page must show project scope');
assert(overviewView.includes('/ctp/bi'), 'CTP overview must link to BI');
assert(admin.includes('/ctp/bi'), 'Admin must link to client BI view');

if (failures.length) {
  console.error('CTP portal BI checks FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('CTP portal BI checks: PASS');
process.exit(0);
