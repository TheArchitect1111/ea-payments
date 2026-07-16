/**
 * Phase 1 — Opportunity Experience architecture & routing contract.
 * Run: node scripts/test-ctp-opportunity-phase1.mjs
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

const routesPath = join(root, 'lib/ctp-opportunity-routes.ts');
const viewPath = join(root, 'lib/ctp-opportunity-view.ts');
const welcomePath = join(root, 'lib/ctp-welcome-email.ts');
const sendPath = join(root, 'lib/ctp-executive-email-send.ts');
const provisionPath = join(root, 'lib/ctp-workspace-provision.ts');
const portalHomePath = join(root, 'app/portal/[slug]/page.tsx');
const portalModulesPath = join(root, 'lib/modules/portal-modules.ts');
const dashboardPath = join(root, 'app/portal/[slug]/ctp/page.tsx');
const reviewPath = join(root, 'app/portal/[slug]/ctp/review/page.tsx');
const detailPath = join(root, 'app/portal/[slug]/ctp/opportunities/[opportunityId]/page.tsx');
const progressPath = join(root, 'app/portal/[slug]/ctp/progress/page.tsx');

for (const [path, label] of [
  [routesPath, 'ctp-opportunity-routes'],
  [viewPath, 'ctp-opportunity-view'],
  [welcomePath, 'ctp-welcome-email'],
  [sendPath, 'ctp-executive-email-send'],
  [provisionPath, 'ctp-workspace-provision'],
  [portalHomePath, 'portal home'],
  [portalModulesPath, 'portal-modules'],
  [dashboardPath, 'ctp dashboard page'],
  [reviewPath, 'ctp review page'],
  [detailPath, 'ctp opportunity detail page'],
  [progressPath, 'ctp progress / Design Studio'],
]) {
  assert(existsSync(path), `Missing ${label}`);
}

const routes = readFileSync(routesPath, 'utf8');
const view = readFileSync(viewPath, 'utf8');
const welcome = readFileSync(welcomePath, 'utf8');
const send = readFileSync(sendPath, 'utf8');
const provision = readFileSync(provisionPath, 'utf8');
const portalHome = readFileSync(portalHomePath, 'utf8');
const portalModules = readFileSync(portalModulesPath, 'utf8');
const dashboard = readFileSync(dashboardPath, 'utf8');

// Canonical route module
assert(routes.includes('CTP_OPPORTUNITY_SEGMENTS'), 'Must define segment constants');
assert(routes.includes("dashboard: 'ctp'"), 'Dashboard segment must be ctp');
assert(routes.includes('designStudio:'), 'Design Studio must be secondary segment');
assert(routes.includes('opportunityDashboardPublicUrl'), 'Must export public dashboard URL');
assert(routes.includes('resolveCtpClientLandingPath'), 'Must export client landing resolver');

// Email / provision CTAs → dashboard only
assert(welcome.includes('opportunityEmailPathSuffix'), 'Welcome email must use route module');
assert(!welcome.includes("return 'ctp/progress'"), 'Welcome path must not default to Design Studio');
assert(send.includes('opportunityDashboardPublicUrl'), 'Executive email send must use dashboard public URL');
assert(provision.includes('opportunityDashboardPublicUrl'), 'Provision must use dashboard public URL');
assert(!provision.includes('ctp/progress'), 'Provision must not CTA to Design Studio');

// Portal home → dashboard (not Simplifi hub)
assert(portalHome.includes('resolveCtpClientLandingPath'), 'Portal home must use landing resolver');
assert(!portalHome.includes('ctpWelcomeStudioPath'), 'Portal home must not use studio path helper');

// Auth preserves deep link
assert(portalModules.includes('portalLoginRedirect'), 'Must preserve next= on login redirect');
assert(portalModules.includes('intendedPath'), 'Must compute intended module path before login');

// View model exists (Phase 1 contract — UI wired in later phases)
assert(view.includes('buildCtpOpportunityDashboardView'), 'View model must export dashboard builder');
assert(view.includes('buildCtpOpportunityDetailView'), 'View model must export detail builder');
assert(view.includes('buildCtpOpportunityReviewView'), 'View model must export review builder');
assert(view.includes('ctp-opportunity-routes'), 'View model must use canonical routes');

// Route files exist for journey
assert(dashboard.includes('requirePortalModule'), 'Dashboard must use portal auth');
assert(
  dashboard.includes('OpportunityDashboard') || dashboard.includes('reviewHref') || dashboard.includes('/ctp/review'),
  'Dashboard must link to review',
);

if (failures.length) {
  console.error('Phase 1 Opportunity Experience checks FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('Phase 1 Opportunity Experience (architecture & routing): PASS');
process.exit(0);
