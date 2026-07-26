#!/usr/bin/env node
/**
 * Phase 1 Universal Portal — runtime certification harness (safe, no production writes).
 * Run: npx tsx scripts/test-industry-pack-runtime-cert.mts
 *
 * Exercises flag OFF/ON, pack resolution, nav labels/order, roles, stages,
 * entitlements, invalid packs, branding, and non-activation of later phases.
 * Writes JSON evidence to docs/audits/runtime-evidence-universal-portal-phase1.json
 */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  UNIVERSAL_CAPABILITY_IDS,
  UNIVERSAL_TO_MODULES,
} from '../lib/portal-universal/capability-ids.ts';
import { validateIndustryPack } from '../lib/portal-universal/validate-pack.ts';
import { resolveIndustryNav, resolvedNavToSidebarGroups } from '../lib/portal-universal/resolve-nav.ts';
import { resolvePackForOrg } from '../lib/portal-universal/resolve-pack-for-org.ts';
import { applyPackBrandingToChrome } from '../lib/portal-universal/apply-branding.ts';
import {
  INDUSTRY_PACK_REGISTRY,
  listIndustryPacks,
  getIndustryPack,
  DEFAULT_INDUSTRY_PACK_ID,
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
import type { ModuleId } from '../lib/modules/registry.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

type Row = {
  id: string;
  routes: string[];
  roles: string[];
  packIds: string[];
  flagState: 'OFF' | 'ON' | 'N/A';
  expected: string;
  actual: string;
  pass: boolean;
  notes?: string;
};

const rows: Row[] = [];
const errors: string[] = [];

function setFlag(state: 'unset' | '0' | '1') {
  if (state === 'unset') delete process.env.UNIVERSAL_NAV_PACKS;
  else process.env.UNIVERSAL_NAV_PACKS = state;
}

function record(row: Omit<Row, 'pass'> & { pass: boolean }) {
  rows.push(row);
  if (!row.pass) errors.push(`${row.id}: ${row.expected} — got: ${row.actual}`);
}

function baseChrome(): PortalWorkspaceChrome {
  return {
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
  };
}

const DEMO_SLUG = 'demo-client';
const EA_SLUG = 'ea';
const OTHER_SLUG = 'other-org-demo';

const EXEC_MODULES = new Set<ModuleId>([
  'dashboard',
  'pulse',
  'simplifi',
  'amplifi',
  'connect',
  'update-hub',
  'documents',
  'messaging',
  'events',
  'resources',
  'training',
  'ask',
  'billing',
  'ctp',
  'member',
]);

const CX_LEGACY_IDS = ['progress', 'documents', 'messages', 'support', 'journey'] as const;
const CX_LEGACY_LABELS = ['Your Project', 'Documents', 'Contact', 'Help', 'Journey'] as const;

// ---------------------------------------------------------------------------
// 1. Flag OFF — legacy CX nav unchanged
// ---------------------------------------------------------------------------
{
  setFlag('unset');
  const enabled = isUniversalNavPacksEnabled();
  const legacy = buildClientExperienceNav(DEMO_SLUG);
  const pass =
    enabled === false &&
    legacy.length === 5 &&
    legacy.map((i) => i.id).join(',') === CX_LEGACY_IDS.join(',') &&
    legacy.map((i) => i.label).join('|') === CX_LEGACY_LABELS.join('|') &&
    legacy.every((i) => i.href.startsWith(`/portal/${DEMO_SLUG}`));
  record({
    id: 'FLAG-OFF-legacy-cx-nav',
    routes: CX_LEGACY_IDS.map((id) => legacy.find((x) => x.id === id)?.href || ''),
    roles: ['guest'],
    packIds: [],
    flagState: 'OFF',
    expected: 'UNIVERSAL_NAV_PACKS unset → false; CX ids/labels/order match hardcoded legacy',
    actual: `enabled=${enabled}; ids=${legacy.map((i) => i.id).join(',')}; labels=${legacy
      .map((i) => i.label)
      .join('|')}`,
    pass,
  });
}

{
  setFlag('0');
  const enabled = isUniversalNavPacksEnabled();
  const legacy = buildClientExperienceNav(DEMO_SLUG);
  record({
    id: 'FLAG-0-legacy-cx-nav',
    routes: legacy.map((i) => i.href),
    roles: ['guest'],
    packIds: [],
    flagState: 'OFF',
    expected: 'UNIVERSAL_NAV_PACKS=0 → false; same five CX destinations',
    actual: `enabled=${enabled}; count=${legacy.length}`,
    pass: enabled === false && legacy.length === 5,
  });
}

// ---------------------------------------------------------------------------
// 2. Flag ON — ea-executive resolves
// ---------------------------------------------------------------------------
{
  setFlag('1');
  assert.equal(isUniversalNavPacksEnabled(), true);
  const pack = resolvePackForOrg({ portalSlug: EA_SLUG });
  const resolved = resolveIndustryNav({
    slug: EA_SLUG,
    pack: EA_EXECUTIVE_PACK,
    enabledModuleIds: EXEC_MODULES,
    role: 'owner',
  });
  const labels = resolved.map((i) => i.label);
  const orders = resolved.map((i) => i.order);
  const ordered = orders.every((o, idx) => idx === 0 || o >= orders[idx - 1]!);
  const noPeopleTasks = !resolved.some((i) => i.id === 'people' || i.id === 'tasks');
  const hasBilling = resolved.some((i) => i.id === 'payments' && i.label === 'Billing');
  const groups = resolvedNavToSidebarGroups(resolved);
  record({
    id: 'FLAG-ON-ea-executive',
    routes: resolved.map((i) => i.href),
    roles: ['owner'],
    packIds: ['ea-executive'],
    flagState: 'ON',
    expected:
      'Default pack ea-executive; nav ordered; Dashboard/Pulse/Simplifi…; People/Tasks hidden; Billing for owner',
    actual: `pack=${pack.id}; items=${resolved.length}; ordered=${ordered}; noPeopleTasks=${noPeopleTasks}; billing=${hasBilling}; groups=${groups.length}; first=${labels[0]}`,
    pass:
      pack.id === 'ea-executive' &&
      ordered &&
      noPeopleTasks &&
      hasBilling &&
      labels[0] === 'Dashboard' &&
      groups[0]?.items.length === resolved.length,
  });
}

// ---------------------------------------------------------------------------
// 3. Flag ON — ctp-client resolves
// ---------------------------------------------------------------------------
{
  setFlag('1');
  const pack = resolvePackForOrg({
    portalSlug: DEMO_SLUG,
    preferClientExperience: true,
  });
  const packed = buildClientExperienceNav(DEMO_SLUG);
  const fromPack = buildClientExperienceNavFromPack(DEMO_SLUG);
  const ids = packed.map((i) => i.id);
  const labels = packed.map((i) => i.label);
  const noExec = packed.every(
    (i) =>
      !i.href.includes('/simplifi') &&
      !i.href.includes('/pulse') &&
      !i.href.includes('/amplifi') &&
      !i.href.includes('/connect'),
  );
  record({
    id: 'FLAG-ON-ctp-client',
    routes: packed.map((i) => i.href),
    roles: ['guest'],
    packIds: ['ctp-client'],
    flagState: 'ON',
    expected:
      'preferClientExperience → ctp-client; five CX destinations; pack labels/order; no executive paths',
    actual: `pack=${pack.id}; ids=${ids.join(',')}; labels=${labels.join('|')}; noExec=${noExec}`,
    pass:
      pack.id === 'ctp-client' &&
      packed.length === 5 &&
      JSON.stringify(ids) === JSON.stringify([...fromPack.map((i) => i.id)]) &&
      labels.join('|') === 'Your Project|Documents|Contact|Help|Journey' &&
      packed[0]?.href.includes('/ctp/progress') &&
      noExec,
  });
}

// ---------------------------------------------------------------------------
// 4. sample-placeholder validates, not production default
// ---------------------------------------------------------------------------
{
  const v = validateIndustryPack(SAMPLE_PLACEHOLDER_PACK, { phase1Strict: true });
  const asDefault = resolvePackForOrg({ portalSlug: 'random-tenant' }).id;
  const pinned = resolvePackForOrg({
    portalSlug: 'random-tenant',
    industryPackId: 'sample-placeholder',
  }).id;
  const desc = SAMPLE_PLACEHOLDER_PACK.description || '';
  record({
    id: 'sample-placeholder-not-production',
    routes: [],
    roles: [],
    packIds: ['sample-placeholder'],
    flagState: 'N/A',
    expected: 'Validates; not default for random slug; only when pinned; describes non-production',
    actual: `ok=${v.ok}; default=${asDefault}; pinned=${pinned}; descHasNot=${/not for production/i.test(desc)}`,
    pass:
      v.ok === true &&
      asDefault === 'ea-executive' &&
      pinned === 'sample-placeholder' &&
      /not for production/i.test(desc) &&
      getIndustryPack('sample-placeholder') != null,
  });
}

// ---------------------------------------------------------------------------
// 5. Labels / order / visibility per pack
// ---------------------------------------------------------------------------
{
  const sampleNav = resolveIndustryNav({
    slug: DEMO_SLUG,
    pack: SAMPLE_PLACEHOLDER_PACK,
    enabledModuleIds: new Set(['dashboard', 'events', 'messaging', 'documents', 'resources']),
    role: 'guest',
  });
  const labels = sampleNav.map((i) => i.label);
  record({
    id: 'pack-labels-order-visibility',
    routes: sampleNav.map((i) => i.href),
    roles: ['guest'],
    packIds: ['sample-placeholder'],
    flagState: 'ON',
    expected: 'Chapter Home → Calendar → Messages → Documents → Training; people/tasks never',
    actual: labels.join(' → '),
    pass:
      labels.join(' → ') ===
        'Chapter Home → Calendar & Events → Messages → Documents & Forms → Training & Support' &&
      !sampleNav.some((i) => i.universalCapabilityId === 'people' || i.universalCapabilityId === 'tasks'),
  });
}

// ---------------------------------------------------------------------------
// 6. Role restrictions
// ---------------------------------------------------------------------------
{
  const guest = resolveIndustryNav({
    slug: EA_SLUG,
    pack: EA_EXECUTIVE_PACK,
    enabledModuleIds: EXEC_MODULES,
    role: 'guest',
  });
  const owner = resolveIndustryNav({
    slug: EA_SLUG,
    pack: EA_EXECUTIVE_PACK,
    enabledModuleIds: EXEC_MODULES,
    role: 'owner',
  });
  const staff = resolveIndustryNav({
    slug: EA_SLUG,
    pack: EA_EXECUTIVE_PACK,
    enabledModuleIds: EXEC_MODULES,
    role: 'staff',
  });
  record({
    id: 'role-restrictions-billing',
    routes: ['/portal/ea/billing'],
    roles: ['guest', 'staff', 'owner'],
    packIds: ['ea-executive'],
    flagState: 'ON',
    expected: 'payments/Billing only for owner (minRole); guest/staff hide',
    actual: `guestHas=${guest.some((i) => i.id === 'payments')}; staffHas=${staff.some(
      (i) => i.id === 'payments',
    )}; ownerHas=${owner.some((i) => i.id === 'payments')}`,
    pass:
      !guest.some((i) => i.id === 'payments') &&
      !staff.some((i) => i.id === 'payments') &&
      owner.some((i) => i.id === 'payments'),
  });
}

// ---------------------------------------------------------------------------
// 7. Journey-stage restrictions
// ---------------------------------------------------------------------------
{
  const stagePack = {
    ...EA_EXECUTIVE_PACK,
    id: 'stage-cert',
    nav: [
      {
        id: 'home',
        universalCapabilityId: 'home' as const,
        label: 'Home',
        order: 1,
        preferredModuleId: 'dashboard' as const,
        stagesInclude: ['Agreement' as const],
      },
      {
        id: 'docs',
        universalCapabilityId: 'documents' as const,
        label: 'Docs',
        order: 2,
        preferredModuleId: 'documents' as const,
        stagesExclude: ['Welcome' as const],
      },
    ],
  };
  const welcome = resolveIndustryNav({
    slug: DEMO_SLUG,
    pack: stagePack,
    enabledModuleIds: new Set(['dashboard', 'documents']),
    role: 'guest',
    guideStage: 'Welcome',
  });
  const agreement = resolveIndustryNav({
    slug: DEMO_SLUG,
    pack: stagePack,
    enabledModuleIds: new Set(['dashboard', 'documents']),
    role: 'guest',
    guideStage: 'Agreement',
  });
  record({
    id: 'journey-stage-restrictions',
    routes: agreement.map((i) => i.href),
    roles: ['guest'],
    packIds: ['stage-cert'],
    flagState: 'ON',
    expected: 'Welcome: no home (include), no docs (exclude); Agreement: home+docs',
    actual: `welcome=${welcome.map((i) => i.id).join(',') || '(none)'}; agreement=${agreement
      .map((i) => i.id)
      .join(',')}`,
    pass: welcome.length === 0 && agreement.map((i) => i.id).join(',') === 'home,docs',
  });
}

// ---------------------------------------------------------------------------
// 8. Entitlements / RBAC still remove unauthorized
// ---------------------------------------------------------------------------
{
  const limited = resolveIndustryNav({
    slug: EA_SLUG,
    pack: EA_EXECUTIVE_PACK,
    enabledModuleIds: new Set(['dashboard', 'events']),
    role: 'guest',
  });
  const ids = limited.map((i) => i.moduleId);
  record({
    id: 'entitlements-rbac-filter',
    routes: limited.map((i) => i.href),
    roles: ['guest'],
    packIds: ['ea-executive'],
    flagState: 'ON',
    expected: 'Only entitled modules surface (dashboard, events); Simplifi/Billing hidden',
    actual: `modules=${ids.join(',')}; count=${limited.length}`,
    pass:
      limited.every((i) => i.moduleId === 'dashboard' || i.moduleId === 'events') &&
      !limited.some((i) => i.moduleId === 'simplifi' || i.moduleId === 'billing') &&
      limited.length >= 1,
  });
}

{
  const withHide = resolveIndustryNav({
    slug: DEMO_SLUG,
    pack: SAMPLE_PLACEHOLDER_PACK,
    enabledModuleIds: new Set(['dashboard', 'simplifi', 'events']),
    role: 'guest',
  });
  record({
    id: 'hideModuleIds-enforced',
    routes: withHide.map((i) => i.href),
    roles: ['guest'],
    packIds: ['sample-placeholder'],
    flagState: 'ON',
    expected: 'hideModuleIds removes simplifi even if entitled',
    actual: `hasSimplifi=${withHide.some((i) => i.moduleId === 'simplifi')}`,
    pass: !withHide.some((i) => i.moduleId === 'simplifi'),
  });
}

// ---------------------------------------------------------------------------
// 9. Unknown / invalid pack IDs fall back safely
// ---------------------------------------------------------------------------
{
  const unknown = resolvePackForOrg({
    portalSlug: DEMO_SLUG,
    industryPackId: 'does-not-exist-xyz',
  });
  const empty = resolvePackForOrg({
    portalSlug: DEMO_SLUG,
    industryPackId: '   ',
  });
  const badOrg = resolvePackForOrg({
    portalSlug: DEMO_SLUG,
    organization: { industryPackId: 'bogus-pack' } as never,
  });
  process.env.INDUSTRY_PACK_BY_SLUG_JSON = JSON.stringify({
    [DEMO_SLUG]: 'not-a-real-pack',
  });
  const badEnv = resolvePackForOrg({ portalSlug: DEMO_SLUG });
  delete process.env.INDUSTRY_PACK_BY_SLUG_JSON;

  record({
    id: 'unknown-pack-fallback',
    routes: [`/portal/${DEMO_SLUG}`],
    roles: [],
    packIds: ['does-not-exist-xyz', 'bogus-pack', 'not-a-real-pack'],
    flagState: 'ON',
    expected: `Fall back to ${DEFAULT_INDUSTRY_PACK_ID}`,
    actual: `unknown=${unknown.id}; empty=${empty.id}; badOrg=${badOrg.id}; badEnv=${badEnv.id}`,
    pass:
      unknown.id === 'ea-executive' &&
      empty.id === 'ea-executive' &&
      badOrg.id === 'ea-executive' &&
      badEnv.id === 'ea-executive',
  });
}

// ---------------------------------------------------------------------------
// 10. Invalid schema versions fail safely
// ---------------------------------------------------------------------------
{
  const badVersion = validateIndustryPack({
    ...SAMPLE_PLACEHOLDER_PACK,
    id: 'bad-version-pack',
    version: '1',
  });
  const badId = validateIndustryPack({
    ...SAMPLE_PLACEHOLDER_PACK,
    id: 'Bad_ID',
  });
  const enabledPeople = validateIndustryPack(
    {
      ...SAMPLE_PLACEHOLDER_PACK,
      id: 'people-on',
      extensions: { people: { enabled: true, schemaVersion: '1.0.0' } },
    },
    { phase1Strict: true },
  );
  record({
    id: 'invalid-schema-fail-safe',
    routes: [],
    roles: [],
    packIds: ['bad-version-pack', 'Bad_ID', 'people-on'],
    flagState: 'N/A',
    expected: 'Non-semver / bad id / phase1 enabled people → ok:false; registry packs still valid',
    actual: `badVersion=${badVersion.ok}; badId=${badId.ok}; peopleOn=${enabledPeople.ok}; registry=${
      listIndustryPacks().length
    }`,
    pass:
      badVersion.ok === false &&
      badId.ok === false &&
      enabledPeople.ok === false &&
      Object.keys(INDUSTRY_PACK_REGISTRY).length === 3,
  });
}

// ---------------------------------------------------------------------------
// 11. Branding merges without overriding protected values
// ---------------------------------------------------------------------------
{
  const withOrgLogo = applyPackBrandingToChrome(baseChrome(), SAMPLE_PLACEHOLDER_PACK, {
    orgHasLogo: true,
  });
  const withoutOrgLogo = applyPackBrandingToChrome(
    { ...baseChrome(), logoSrc: '/ea-logo.png' },
    {
      ...SAMPLE_PLACEHOLDER_PACK,
      branding: {
        ...SAMPLE_PLACEHOLDER_PACK.branding,
        logoSrc: '/pack-logo.png',
      },
    },
    { orgHasLogo: false },
  );
  // Protected: platformClientId / personality from chrome stay unless pack sets personality
  const next = applyPackBrandingToChrome(baseChrome(), SAMPLE_PLACEHOLDER_PACK, {
    orgHasLogo: true,
  });
  record({
    id: 'branding-merge-protected',
    routes: [],
    roles: [],
    packIds: ['sample-placeholder'],
    flagState: 'ON',
    expected:
      'Org logo wins; pack logo applies when no org logo; homeLabel/workspaceName from pack; platformClientId untouched',
    actual: `orgLogoKept=${withOrgLogo.logoSrc}; packLogo=${withoutOrgLogo.logoSrc}; home=${next.homeLabel}; ws=${next.workspaceName}; platform=${next.platformClientId}`,
    pass:
      withOrgLogo.logoSrc === '/ea-logo.png' &&
      withoutOrgLogo.logoSrc === '/pack-logo.png' &&
      next.homeLabel === 'Chapter Home' &&
      next.workspaceName === 'Sample Chapter Portal' &&
      next.platformClientId === 'ea' &&
      next.personalityId === 'executive',
  });
}

// ---------------------------------------------------------------------------
// 12. CTP fulfillment unchanged (static import check already in regression;
//     also verify no pack registry coupling)
// ---------------------------------------------------------------------------
{
  const { readFileSync } = await import('node:fs');
  const fulfill = readFileSync(join(root, 'lib/fulfill-paid-client.ts'), 'utf8');
  const packsIdx = readFileSync(join(root, 'lib/portal-universal/packs/index.ts'), 'utf8');
  record({
    id: 'ctp-fulfillment-unchanged',
    routes: [],
    roles: [],
    packIds: [],
    flagState: 'N/A',
    expected: 'fulfill-paid-client has no IndustryPack / UNIVERSAL_NAV coupling',
    actual: `hasPortalUniversal=${fulfill.includes('portal-universal')}; hasPack=${fulfill.includes(
      'IndustryPack',
    )}; packsImportFulfill=${packsIdx.includes('fulfill-paid-client')}`,
    pass:
      !fulfill.includes('portal-universal') &&
      !fulfill.includes('IndustryPack') &&
      !fulfill.includes('UNIVERSAL_NAV_PACKS') &&
      !packsIdx.includes('fulfill-paid-client'),
  });
}

// ---------------------------------------------------------------------------
// 13. No People / Tasks / Novu / RJSF runtime activated
// ---------------------------------------------------------------------------
{
  const { readFileSync, readdirSync } = await import('node:fs');
  const packDir = join(root, 'lib/portal-universal');
  const files: string[] = [];
  function walk(dir: string) {
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, name.name);
      if (name.isDirectory()) walk(p);
      else if (/\.(ts|tsx|mjs|js)$/.test(name.name)) files.push(p);
    }
  }
  walk(packDir);
  let runtimeHits = 0;
  for (const f of files) {
    const body = readFileSync(f, 'utf8');
    if (body.includes('@rjsf/') || /@novu\//.test(body) || body.includes('from \'novu\'') || body.includes('from "novu"')) {
      runtimeHits += 1;
    }
  }
  const allExtOff =
    EA_EXECUTIVE_PACK.extensions?.people?.enabled !== true &&
    EA_EXECUTIVE_PACK.extensions?.tasks?.enabled !== true &&
    EA_EXECUTIVE_PACK.extensions?.notifications?.enabled !== true &&
    CTP_CLIENT_PACK.extensions?.people?.enabled !== true &&
    CTP_CLIENT_PACK.extensions?.tasks?.enabled !== true &&
    SAMPLE_PLACEHOLDER_PACK.extensions?.people?.enabled !== true &&
    SAMPLE_PLACEHOLDER_PACK.extensions?.notifications?.enabled !== true;
  const peopleModulesMapped = UNIVERSAL_TO_MODULES.people.includes('people');
  const tasksStillEmpty = UNIVERSAL_TO_MODULES.tasks.length === 0;
  record({
    id: 'no-later-phase-runtime',
    routes: [],
    roles: [],
    packIds: ['ea-executive', 'ctp-client', 'sample-placeholder'],
    flagState: 'N/A',
    expected:
      'No @rjsf/@novu imports under portal-universal; extensions disabled; tasks map empty; people maps to module',
    actual: `runtimeHits=${runtimeHits}; allExtOff=${allExtOff}; peopleMapped=${peopleModulesMapped}; tasksEmpty=${tasksStillEmpty}; caps=${UNIVERSAL_CAPABILITY_IDS.length}`,
    pass: runtimeHits === 0 && allExtOff && peopleModulesMapped && tasksStillEmpty,
  });
}

// ---------------------------------------------------------------------------
// 14. Cross-org navigation / data leakage (slug isolation in hrefs)
// ---------------------------------------------------------------------------
{
  setFlag('1');
  const a = buildClientExperienceNav(DEMO_SLUG);
  const b = buildClientExperienceNav(OTHER_SLUG);
  const execA = resolveIndustryNav({
    slug: 'org-alpha',
    pack: EA_EXECUTIVE_PACK,
    enabledModuleIds: new Set(['dashboard', 'documents']),
    role: 'guest',
  });
  const execB = resolveIndustryNav({
    slug: 'org-beta',
    pack: EA_EXECUTIVE_PACK,
    enabledModuleIds: new Set(['dashboard', 'documents']),
    role: 'guest',
  });
  const cxIsolated =
    a.every((i) => i.href.includes(`/portal/${DEMO_SLUG}/`)) &&
    b.every((i) => i.href.includes(`/portal/${OTHER_SLUG}/`)) &&
    !a.some((i) => i.href.includes(OTHER_SLUG)) &&
    !b.some((i) => i.href.includes(DEMO_SLUG));
  const execIsolated =
    execA.every((i) => i.href.includes('/portal/org-alpha')) &&
    execB.every((i) => i.href.includes('/portal/org-beta')) &&
    !execA.some((i) => i.href.includes('org-beta'));
  record({
    id: 'cross-org-href-isolation',
    routes: [...a.map((i) => i.href), ...execA.map((i) => i.href), ...execB.map((i) => i.href)],
    roles: ['guest'],
    packIds: ['ctp-client', 'ea-executive'],
    flagState: 'ON',
    expected: 'All hrefs scoped to requesting portal slug; no cross-slug leakage',
    actual: `cxIsolated=${cxIsolated}; execIsolated=${execIsolated}`,
    pass: cxIsolated && execIsolated,
  });
}

// ---------------------------------------------------------------------------
// 15. Flag OFF does not use pack chrome path for CX (parity check)
// ---------------------------------------------------------------------------
{
  setFlag('unset');
  const off = buildClientExperienceNav(DEMO_SLUG);
  setFlag('1');
  const on = buildClientExperienceNav(DEMO_SLUG);
  // Destinations should match structurally (same ids); pack may use same labels
  record({
    id: 'flag-off-vs-on-cx-destination-parity',
    routes: [...off.map((i) => i.href), ...on.map((i) => i.href)],
    roles: ['guest'],
    packIds: ['ctp-client'],
    flagState: 'ON',
    expected: 'Same five CX ids under both modes; hrefs remain under /portal/demo-client/ctp*',
    actual: `offIds=${off.map((i) => i.id).join(',')}; onIds=${on.map((i) => i.id).join(',')}`,
    pass:
      off.map((i) => i.id).sort().join(',') === on.map((i) => i.id).sort().join(',') &&
      off.length === on.length,
  });
  setFlag('unset');
}

// ---------------------------------------------------------------------------
// Evidence write
// ---------------------------------------------------------------------------
const outDir = join(root, 'docs', 'audits');
mkdirSync(outDir, { recursive: true });
const evidencePath = join(outDir, 'runtime-evidence-universal-portal-phase1.json');
const summary = {
  generatedAt: new Date().toISOString(),
  harness: 'scripts/test-industry-pack-runtime-cert.mts',
  demoFixtures: { DEMO_SLUG, EA_SLUG, OTHER_SLUG },
  passCount: rows.filter((r) => r.pass).length,
  failCount: rows.filter((r) => !r.pass).length,
  rows,
};
writeFileSync(evidencePath, JSON.stringify(summary, null, 2), 'utf8');

if (errors.length) {
  console.error('FAIL industry-pack-runtime-cert');
  for (const e of errors) console.error(' -', e);
  console.error(`Evidence: ${evidencePath}`);
  process.exit(1);
}

console.log('PASS industry-pack-runtime-cert');
console.log(`Evidence: ${evidencePath}`);
console.log(`Checks: ${rows.length} passed`);
