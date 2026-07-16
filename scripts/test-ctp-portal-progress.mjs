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
const overviewPath = join(root, 'app/portal/[slug]/ctp/page.tsx');
const progressPath = join(root, 'app/portal/[slug]/ctp/progress/page.tsx');

assert(existsSync(statusPath), 'Missing ctp-portal-status.ts');
assert(existsSync(overviewPath), 'Missing portal CTP overview page');
assert(existsSync(progressPath), 'Missing portal CTP progress page');

const status = readFileSync(statusPath, 'utf8');
const overview = readFileSync(overviewPath, 'utf8');
const progress = readFileSync(progressPath, 'utf8');

assert(status.includes("'assessment'"), 'Timeline must include assessment');
assert(status.includes("'digital-audit'"), 'Timeline must include digital-audit');
assert(status.includes("'executive-report'"), 'Timeline must include executive-report');
assert(status.includes("'reveal'"), 'Timeline must include reveal');
assert(status.includes('designStudio'), 'Must expose Design Studio checklist');
assert(status.includes('percentComplete'), 'Must expose percentComplete');
assert(status.includes('socialScore'), 'Progress view must expose socialScore');
assert(status.includes('gbpScore'), 'Progress view must expose gbpScore');
assert(overview.includes('buildCtpOpportunityDashboardView'), 'Root /ctp must use Opportunity Dashboard view');
assert(overview.includes('OpportunityDashboard'), 'Root /ctp must render Opportunity Dashboard');
assert(!overview.includes('buildCtpOverviewView'), 'Root /ctp must not use CRM overview hub');
assert(progress.includes('Design Studio'), 'Progress page must render Design Studio');
assert(progress.includes('PortalCtpDesignStudioForm'), 'Progress must mount Design Studio form');
assert(progress.includes('percentComplete'), 'Progress page must show progress percent');
assert(progress.includes('ctpPulse'), 'Active steps should animate');
assert(progress.includes('socialScore'), 'Progress page must surface social score');

if (failures.length) {
  console.error('CTP portal progress checks FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('CTP portal progress checks: PASS');
process.exit(0);
