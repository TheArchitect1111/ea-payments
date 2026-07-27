/**
 * Session 3 — selected-concept wire contract (no Airtable I/O).
 * Run: npx --yes tsx scripts/test-factory-wire-selected.ts
 *   or: npm run test:factory-wire-selected
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

const wireSrc = read('lib/factory-publish-selected-concept.ts');
const routeSrc = read('app/api/admin/factory/publish-selected-concept/route.ts');
const portalSrc = read('lib/experience-portal-provision.ts');
const quarantineSrc = read('lib/site-quarantine.ts');
const adminSrc = read('app/admin/ea-factory/concepts/[projectId]/page.tsx');
const pkg = JSON.parse(read('package.json')) as {
  scripts?: Record<string, string>;
};

// --- Wire core: portal + draft + ED gate + quarantine-aware draft_only ---
assert.match(wireSrc, /saveSelectedConceptDraftPage/);
assert.match(wireSrc, /provisionExperiencePortalTenant/);
assert.match(wireSrc, /savePortalMemberHome/);
assert.match(wireSrc, /buildDefaultMemberHome/);
assert.match(wireSrc, /WIRED_CHASSIS_MODULES/);
assert.match(wireSrc, /['"]simplifi['"]/);
assert.match(wireSrc, /['"]amplifi['"]/);
assert.match(wireSrc, /['"]connect['"]/);
assert.match(wireSrc, /['"]member['"]/);
assert.match(wireSrc, /draft_only/);
assert.match(wireSrc, /isSiteQuarantined/);
assert.match(wireSrc, /provisionWebsitePortalSite/);
assert.match(wireSrc, /loginCtaPresent/);
assert.match(wireSrc, /publicPortalLoginUrl/);
assert.match(wireSrc, /publicPortalUrl/);
assert.match(wireSrc, /portalCtpUrl/);
assert.match(wireSrc, /chassisModules/);
assert.match(wireSrc, /No concept selected/);
assert.match(wireSrc, /selectionStatus/);
assert.match(wireSrc, /amanda-catherine/);
assert.match(wireSrc, /EA_AMANDA_SITE_LIVE/);

// Quarantined path must short-circuit before live provision call (ignore import)
const draftOnlyIdx = wireSrc.indexOf("websiteStatus: 'draft_only'");
const provisionCallIdx = wireSrc.indexOf('await provisionWebsitePortalSite(');
assert.ok(draftOnlyIdx > 0, 'draft_only websiteStatus must exist');
assert.ok(
  provisionCallIdx > draftOnlyIdx,
  'quarantine draft_only must precede live provisionWebsitePortalSite call',
);

// --- API route: admin auth + surfaces ---
assert.match(routeSrc, /surfaces/);
assert.match(routeSrc, /publishSelectedFactoryConcept/);
assert.match(routeSrc, /requireAdminActionFromRequest/);
assert.match(routeSrc, /Session 3/);
assert.match(routeSrc, /admin:manage/);

// --- Portal provision reuses EA chassis (no parallel stack) ---
assert.match(portalSrc, /fulfillPaidClient/);
assert.match(portalSrc, /website_portal_starter/);
assert.match(portalSrc, /ensureCtpWorkspaceForWebsitePortal/);
assert.match(portalSrc, /updateOrganizationWorkspaceConfig/);

// --- Quarantine gate ---
assert.match(quarantineSrc, /EA_AMANDA_SITE_LIVE/);
assert.match(quarantineSrc, /amanda-catherine/);
assert.match(quarantineSrc, /isSiteQuarantined/);

// --- Admin UI: wire action + surfaces checklist ---
assert.match(adminSrc, /Wire selected experience/);
assert.match(adminSrc, /publish-selected-concept/);
assert.match(adminSrc, /wireSurfaces/);
assert.match(adminSrc, /Session 3 — wired surfaces/);
assert.match(adminSrc, /portalLoginUrl/);
assert.match(adminSrc, /portalCtpUrl/);
assert.match(adminSrc, /draftPreviewPath/);
assert.match(adminSrc, /chassisModules/);

// --- npm script wired ---
assert.equal(
  pkg.scripts?.['test:factory-wire-selected'],
  'npx --yes tsx scripts/test-factory-wire-selected.ts',
);

console.log('PASS: test-factory-wire-selected (Session 3 wire contract)');
