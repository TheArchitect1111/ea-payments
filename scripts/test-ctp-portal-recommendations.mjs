/**
 * CTP portal recommendations wiring checks.
 * Run: node scripts/test-ctp-portal-recommendations.mjs
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

const viewPath = join(root, 'lib/ctp-recommendations-view.ts');
const pagePath = join(root, 'app/portal/[slug]/ctp/recommendations/page.tsx');
const overviewViewPath = join(root, 'lib/ctp-overview-view.ts');
const adminPath = join(root, 'app/admin/ctp/CtpSubmissionsClient.tsx');

for (const [path, label] of [
  [viewPath, 'ctp-recommendations-view.ts'],
  [pagePath, 'recommendations page'],
  [overviewViewPath, 'portal overview view'],
  [adminPath, 'admin CTP client'],
]) {
  assert(existsSync(path), `Missing ${label}`);
}

const view = readFileSync(viewPath, 'utf8');
const page = readFileSync(pagePath, 'utf8');
const overviewView = readFileSync(overviewViewPath, 'utf8');
const admin = readFileSync(adminPath, 'utf8');

assert(view.includes('buildCtpRecommendationsView'), 'Must export recommendations builder');
assert(view.includes('opportunities'), 'Must include intake opportunities');
assert(view.includes('recommendedNextSteps'), 'Must include next steps');
assert(view.includes('productionPackage'), 'Must include production focus');
assert(page.includes('buildCtpRecommendationsView'), 'Page must use builder');
assert(page.includes('requirePortalModule'), 'Page must require ctp module');
assert(page.includes('Recommended next steps'), 'Page must show next steps section');
assert(overviewView.includes('/ctp/recommendations'), 'Overview must link to recommendations');
assert(admin.includes('/ctp/recommendations'), 'Admin must link to recommendations');

if (failures.length) {
  console.error('CTP portal recommendations checks FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('CTP portal recommendations checks: PASS');
process.exit(0);
