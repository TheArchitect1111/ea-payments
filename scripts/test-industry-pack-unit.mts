#!/usr/bin/env node
/**
 * Unit/integration checks for IndustryPack Phase 1 (runs via npx tsx).
 * Run: npx tsx scripts/test-industry-pack-unit.mts
 */
import assert from 'node:assert/strict';
import {
  UNIVERSAL_CAPABILITY_IDS,
  UNIVERSAL_TO_MODULES,
} from '../lib/portal-universal/capability-ids.ts';
import { validateIndustryPack, assertValidIndustryPack } from '../lib/portal-universal/validate-pack.ts';
import { migrateIndustryPack } from '../lib/portal-universal/migrations.ts';
import { resolveIndustryNav } from '../lib/portal-universal/resolve-nav.ts';
import { resolvePackForOrg } from '../lib/portal-universal/resolve-pack-for-org.ts';
import { applyPackBrandingToChrome } from '../lib/portal-universal/apply-branding.ts';
import {
  INDUSTRY_PACK_REGISTRY,
  listIndustryPacks,
  getIndustryPack,
} from '../lib/portal-universal/packs/index.ts';
import { EA_EXECUTIVE_PACK } from '../lib/portal-universal/packs/ea-executive.ts';
import { CTP_CLIENT_PACK } from '../lib/portal-universal/packs/ctp-client.ts';
import { SAMPLE_PLACEHOLDER_PACK } from '../lib/portal-universal/packs/sample-placeholder.ts';
import { isUniversalNavPacksEnabled } from '../lib/portal-universal/flags.ts';
import {
  buildClientExperienceNav,
  buildClientExperienceNavFromPack,
} from '../lib/ctp-client-nav.ts';
import type { PortalWorkspaceChrome } from '../lib/platform/portal-workspace.ts';

function setFlag(on: boolean) {
  if (on) process.env.UNIVERSAL_NAV_PACKS = '1';
  else delete process.env.UNIVERSAL_NAV_PACKS;
}

// --- capability ids ---
assert.equal(UNIVERSAL_CAPABILITY_IDS.length, 10);
assert.deepEqual(UNIVERSAL_TO_MODULES.people, ['people']);
assert.deepEqual(UNIVERSAL_TO_MODULES.tasks, []);
assert.ok(UNIVERSAL_TO_MODULES.home.includes('dashboard'));

// --- registry packs valid ---
for (const pack of listIndustryPacks()) {
  const result = validateIndustryPack(pack, { phase1Strict: true });
  assert.equal(result.ok, true, `${pack.id} should validate`);
}
assert.ok(getIndustryPack('ea-executive'));
assert.ok(getIndustryPack('ctp-client'));
assert.ok(getIndustryPack('sample-placeholder'));
assert.equal(Object.keys(INDUSTRY_PACK_REGISTRY).length, 3);

// --- invalid pack ---
const bad = validateIndustryPack({ id: 'BAD', version: '1', title: 'x', presentation: 'workspace', suggestedModuleIds: [], nav: [] });
assert.equal(bad.ok, false);

// --- migrate adds visibility default ---
const migrated = migrateIndustryPack({
  ...SAMPLE_PLACEHOLDER_PACK,
  nav: SAMPLE_PLACEHOLDER_PACK.nav.map(({ visibility: _v, ...rest }) => rest),
});
assert.ok(migrated.nav[0]);

// --- resolveIndustryNav: hide when not entitled ---
{
  const enabled = new Set(['dashboard', 'events']);
  const resolved = resolveIndustryNav({
    slug: 'demo-client',
    pack: SAMPLE_PLACEHOLDER_PACK,
    enabledModuleIds: enabled,
    role: 'guest',
  });
  assert.ok(resolved.some((i) => i.id === 'home'));
  assert.ok(resolved.some((i) => i.id === 'calendar'));
  assert.ok(!resolved.some((i) => i.id === 'messages'), 'messaging not entitled');
  assert.ok(!resolved.some((i) => i.id === 'people'), 'people never');
  assert.ok(!resolved.some((i) => i.id === 'tasks'), 'tasks never');
  assert.ok(!resolved.some((i) => i.moduleId === 'simplifi'), 'hideModuleIds');
}

// --- role filter ---
{
  const enabled = new Set(['billing', 'dashboard']);
  const asGuest = resolveIndustryNav({
    slug: 'x',
    pack: EA_EXECUTIVE_PACK,
    enabledModuleIds: enabled,
    role: 'guest',
  });
  assert.ok(!asGuest.some((i) => i.id === 'payments'));
  const asOwner = resolveIndustryNav({
    slug: 'x',
    pack: EA_EXECUTIVE_PACK,
    enabledModuleIds: enabled,
    role: 'owner',
  });
  assert.ok(asOwner.some((i) => i.id === 'payments'));
}

// --- stage filter ---
{
  const pack = assertValidIndustryPack({
    ...EA_EXECUTIVE_PACK,
    id: 'stage-test',
    nav: [
      {
        id: 'home',
        universalCapabilityId: 'home',
        label: 'Home',
        order: 1,
        preferredModuleId: 'dashboard',
        stagesInclude: ['Agreement'],
      },
    ],
  });
  const atWelcome = resolveIndustryNav({
    slug: 'x',
    pack,
    enabledModuleIds: new Set(['dashboard']),
    role: 'guest',
    guideStage: 'Welcome',
  });
  assert.equal(atWelcome.length, 0);
  const atAgreement = resolveIndustryNav({
    slug: 'x',
    pack,
    enabledModuleIds: new Set(['dashboard']),
    role: 'guest',
    guideStage: 'Agreement',
  });
  assert.equal(atAgreement.length, 1);
}

// --- hrefOverride ---
{
  const resolved = resolveIndustryNav({
    slug: 'acme',
    pack: CTP_CLIENT_PACK,
    enabledModuleIds: new Set(['ctp']),
    role: 'guest',
  });
  const progress = resolved.find((i) => i.id === 'progress');
  assert.equal(progress?.href, '/portal/acme/ctp/progress');
}

// --- pack resolve ---
assert.equal(resolvePackForOrg({ portalSlug: 'any' }).id, 'ea-executive');
assert.equal(
  resolvePackForOrg({ portalSlug: 'any', preferClientExperience: true }).id,
  'ctp-client',
);
assert.equal(
  resolvePackForOrg({
    portalSlug: 'any',
    organization: { industryPackId: 'sample-placeholder' } as never,
  }).id,
  'sample-placeholder',
);

// --- branding ---
{
  const base = {
    platformClientId: 'ea',
    themeId: 'ea-default-theme',
    cssVars: {},
    brandName: 'EA',
    workspaceName: 'Portal',
    logoSrc: '/ea-logo.png',
    logoAlt: 'EA',
    memberLabel: 'Portal member',
    homeLabel: 'Dashboard',
    promoTitle: 'x',
    promoCopy: 'y',
    aiContext: '',
    personalityId: 'executive',
    personalityName: 'Executive',
    sectionOrder: [],
    dashboardSections: [],
    primaryActions: [],
    emptyStateLanguage: '',
    focusLabel: 'Focus',
    attentionLabel: 'Attention',
    startLabel: 'Start',
    widgets: [],
    shellNavGroups: [],
  } satisfies PortalWorkspaceChrome;
  const next = applyPackBrandingToChrome(base, SAMPLE_PLACEHOLDER_PACK, { orgHasLogo: true });
  assert.equal(next.homeLabel, 'Chapter Home');
  assert.equal(next.logoSrc, '/ea-logo.png', 'org logo wins');
}

// --- CX flag off/on parity of destinations ---
setFlag(false);
assert.equal(isUniversalNavPacksEnabled(), false);
const legacy = buildClientExperienceNav('demo-client');
assert.equal(legacy.length, 5);
assert.deepEqual(
  legacy.map((i) => i.id),
  ['progress', 'documents', 'messages', 'support', 'journey'],
);

setFlag(true);
assert.equal(isUniversalNavPacksEnabled(), true);
const packed = buildClientExperienceNavFromPack('demo-client');
assert.equal(packed.length, 5);
assert.deepEqual(
  packed.map((i) => i.id).sort(),
  ['documents', 'journey', 'messages', 'progress', 'support'],
);
assert.equal(packed.find((i) => i.id === 'progress')?.href, '/portal/demo-client/ctp/progress');
// No executive product paths
for (const item of packed) {
  assert.ok(!item.href.includes('/simplifi'));
  assert.ok(!item.href.includes('/pulse'));
  assert.ok(!item.href.includes('/amplifi'));
}

setFlag(false);

// --- Phase 1: extensions stay disabled ---
assert.equal(EA_EXECUTIVE_PACK.extensions?.people?.enabled, false);
assert.equal(CTP_CLIENT_PACK.extensions?.tasks?.enabled, false);
assert.equal(SAMPLE_PLACEHOLDER_PACK.extensions?.notifications?.enabled, false);
assert.ok(SAMPLE_PLACEHOLDER_PACK.extensions?.formSchemaRefs?.length);

console.log('PASS industry-pack-unit');
