/**
 * Contract tests — Website + Portal → CTP workspace bind (Launch Blocker #1).
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    failed += 1;
  } else {
    console.log('ok:', msg);
  }
}

const fulfill = read('lib/fulfill-paid-client.ts');
assert(
  fulfill.includes('ensureCtpWorkspaceForWebsitePortal'),
  'fulfill binds CTP workspace after website provision',
);
assert(
  fulfill.includes('opportunityDashboardPath'),
  'fulfill uses CTP landing helper for magic link',
);
assert(
  fulfill.includes('ctpLanding') || fulfill.includes('opportunityDashboardPath(portalSlug)'),
  'magic link next is CTP path not hub home',
);
assert(!fulfill.includes("next: `/portal/${portalSlug}`"), 'magic link no longer lands on hub home');

const workspace = read('lib/ctp-website-portal-workspace.ts');
assert(workspace.includes('websitePortalWorkspaceProposalId'), 'deterministic proposal id');
assert(workspace.includes('getCtpSubmissionByProposalId'), 'reuse by proposal id');
assert(workspace.includes('getCtpSubmissionForPortal'), 'reuse by portal');
assert(workspace.includes("source: 'website-portal-fulfill'"), 'pulse metadata marks source');
assert(!workspace.includes('scheduleCtpProductionProvision'), 'does not re-schedule site production');
assert(!workspace.includes('createPortalAccess'), 'does not create a second portal');

const demo = read('lib/demo-website-portal.ts');
assert(demo.includes("slug: 'demo-website'"), 'dedicated demo slug');
assert(demo.includes('website_portal_starter'), 'demo uses Website + Portal offer');
assert(demo.includes('ensureCtpWorkspaceForWebsitePortal'), 'demo seeds CTP submission');
assert(!demo.includes("Package Purchased': 'Simplifi'"), 'demo is not Simplifi');

const enter = read('app/api/auth/demo-website-enter/route.ts');
assert(enter.includes('ensureDemoWebsitePortal'), 'demo-website-enter provisions fixture');
assert(enter.includes('opportunityDashboardPath'), 'demo-website-enter defaults to CTP');
assert(enter.includes('localhost'), 'demo-website-enter supports local origin');

const steps = read('lib/provisioning-engine/steps.ts');
assert(steps.includes('ensureCtpWorkspaceForWebsitePortal'), 'provisioning engine binds CTP workspace');
assert(steps.includes('opportunityDashboardPath'), 'provisioning engine magic link lands on CTP');

const modules = read('lib/modules/portal-modules.ts');
assert(modules.includes("'demo-website'"), 'demo-website is a demo portal slug');

const fallback = read('lib/demo-local-fallback.ts');
assert(fallback.includes('getDemoWebsitePortalCredentials'), 'local fallback knows website demo');
assert(fallback.includes('local-demo-website'), 'local fallback client id for website demo');

const ctpPage = read('app/portal/[slug]/ctp/page.tsx');
assert(ctpPage.includes('if (!submission)'), 'CTP page still requires submission');
assert(ctpPage.includes('ClientExperience'), 'CTP page renders Client Experience');

const home = read('app/portal/[slug]/page.tsx');
assert(home.includes('getCtpSubmissionForPortal'), 'home redirects when submission exists');
assert(home.includes('resolveCtpClientLandingPath'), 'home uses CTP landing path');

if (failed) {
  console.error(`\nFAIL website-portal-ctp-workspace (${failed} assertions)`);
  process.exit(1);
}
console.log('\nPASS website-portal-ctp-workspace');
