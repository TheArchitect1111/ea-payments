/**
 * Portal Skin pack (S3) — brand tokens + member home + entitlements.
 * Run: node scripts/test-portal-skin-pack.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

assert(existsSync(join(root, 'lib/portal-member-home.ts')), 'portal-member-home module missing');
assert(existsSync(join(root, 'app/portal/[slug]/member/page.tsx')), 'member portal page missing');

const registry = read('lib/modules/registry.ts');
assert(registry.includes("'member'"), 'MODULE_IDS must include member');
assert(registry.includes("id: 'member'"), 'TECHNICAL_MODULE_REGISTRY must define member');
assert(registry.includes("pathSegment: 'member'"), 'member pathSegment required');

const experience = read('lib/experience-registry.ts');
assert(experience.includes("id: 'member-experience'"), 'capability member-experience missing');
assert(experience.includes("moduleId: 'member'"), 'capability must map to member module');

const presets = read('vendor/payments-contract/src/presets.ts');
assert(presets.includes("'member'"), 'payments-contract presets must include member');
assert(
  /WEBSITE_PORTAL_MODULES[\s\S]*'member'/.test(presets),
  'WEBSITE_PORTAL_MODULES must include member',
);
assert(
  /IMPLEMENTATION_MODULES[\s\S]*'member'/.test(presets),
  'IMPLEMENTATION_MODULES must include member',
);

const idMap = read('vendor/capability-registry/src/id-map.ts');
assert(idMap.includes("moduleId: 'member'"), 'capability-registry id-map missing member');
assert(idMap.includes("capabilityId: 'member-experience'"), 'id-map missing member-experience');

const provision = read('lib/provision-website-portal.ts');
assert(provision.includes('syncOrganizationPortalSkin'), 'provision must sync org portal skin');
assert(provision.includes('updateOrganizationWorkspaceConfig'), 'skin sync must write Organizations');
assert(provision.includes('ensureDefaultMemberHome'), 'provision must seed member home');

const factoryPublish = read('lib/factory-publish-website.ts');
assert(
  factoryPublish.includes('buildMemberHomeFromOpportunityBrief'),
  'factory publish must write OIB member home',
);
assert(factoryPublish.includes('savePortalMemberHome'), 'factory publish must persist member home');

const workspace = read('lib/platform/portal-workspace.ts');
assert(
  workspace.includes('getPortalMemberHome'),
  'portal chrome must read member persona for memberLabel',
);

const memberPage = read('app/portal/[slug]/member/page.tsx');
assert(memberPage.includes("requirePortalModule(slug, 'member')"), 'member page must gate on module');
assert(memberPage.includes('resolvePortalMemberHome'), 'member page must resolve home content');

const memberHome = read('lib/portal-member-home.ts');
assert(memberHome.includes('buildMemberHomeFromOpportunityBrief'), 'OIB → member home builder');
assert(memberHome.includes("source: 'factory-oib'"), 'factory-oib source tag');

if (failures.length) {
  console.error('Portal skin pack checks failed:');
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

console.log('Portal skin pack (S3) contract checks passed.');
