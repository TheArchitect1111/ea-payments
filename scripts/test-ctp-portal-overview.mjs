/**
 * CTP portal Overview hub wiring checks.
 * Run: node scripts/test-ctp-portal-overview.mjs
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

const viewPath = join(root, 'lib/ctp-overview-view.ts');
const overviewPath = join(root, 'app/portal/[slug]/ctp/page.tsx');
const progressPath = join(root, 'app/portal/[slug]/ctp/progress/page.tsx');

for (const [path, label] of [
  [viewPath, 'ctp-overview-view.ts'],
  [overviewPath, 'CTP overview page'],
  [progressPath, 'CTP progress page'],
]) {
  assert(existsSync(path), `Missing ${label}`);
}

const view = readFileSync(viewPath, 'utf8');
const overview = readFileSync(overviewPath, 'utf8');
const progress = readFileSync(progressPath, 'utf8');

assert(view.includes('buildCtpOverviewView'), 'Must export overview builder');
assert(view.includes('/ctp/progress'), 'Overview cards must link to progress');
assert(view.includes('/ctp/bi'), 'Overview must include BI card');
assert(view.includes('/ctp/support'), 'Overview must include support card');
assert(overview.includes('buildCtpOverviewView'), 'Root CTP page must be overview');
assert(overview.includes('Open live progress'), 'Overview must CTA to progress');
assert(progress.includes('PortalCtpDesignStudioForm'), 'Progress must keep Design Studio');
assert(progress.includes('Your live project progress'), 'Progress page title must remain');
assert(progress.includes(`href={\`/portal/\${slug}/ctp\`}`), 'Progress must link back to overview');

if (failures.length) {
  console.error('CTP portal overview checks FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('CTP portal overview checks: PASS');
process.exit(0);
