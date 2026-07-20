/**
 * Validates Capability Framework bridge (OS packages + ea-payments bootstrap).
 * Run: node scripts/test-capability-framework.mjs
 *
 * Does not require a full Next build — parses ID map + checks module coverage.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const home = resolve(root, '../..');
const osRoot = join(home, 'ea-operating-system');
const vendorIdMap = join(root, 'vendor/capability-registry/src/id-map.ts');
const osIdMap = join(osRoot, 'packages/capability-registry/src/id-map.ts');
const idMapPath = existsSync(vendorIdMap) ? vendorIdMap : osIdMap;
const bootstrapPath = join(root, 'lib/platform/capability-bootstrap.ts');
const apiPath = join(root, 'app/api/platform/capabilities/route.ts');
const pkgPath = join(root, 'package.json');

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

assert(existsSync(idMapPath), `Missing capability ID map at ${idMapPath}`);
assert(existsSync(bootstrapPath), 'Missing lib/platform/capability-bootstrap.ts');
assert(existsSync(apiPath), 'Missing app/api/platform/capabilities/route.ts');
assert(
  existsSync(join(root, 'vendor/capability-registry/package.json')),
  'Missing vendored @ea/capability-registry (run npm run sync-platform-packages)',
);

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
assert(
  Boolean(pkg.dependencies?.['@ea/capability-registry']),
  'package.json missing @ea/capability-registry dependency',
);
assert(
  Boolean(pkg.dependencies?.['@ea/module-engine']),
  'package.json missing @ea/module-engine dependency',
);
assert(
  String(pkg.dependencies?.['@ea/capability-registry'] || '').includes('vendor/'),
  '@ea/capability-registry must resolve via file:./vendor/ for CI',
);

const MODULE_IDS = [
  'dashboard',
  'pulse',
  'simplifi',
  'amplifi',
  'connect',
  'update-hub',
  'training',
  'landing',
  'discovery',
  'documents',
  'messaging',
  'events',
  'resources',
  'ask',
  'billing',
  'ctp',
  'member',
];

const idMap = readFileSync(idMapPath, 'utf8');
for (const id of MODULE_IDS) {
  assert(
    idMap.includes(`moduleId: '${id}'`),
    `ID map missing moduleId: ${id}`,
  );
}

const bootstrap = readFileSync(bootstrapPath, 'utf8');
assert(bootstrap.includes('adaptEaPortalRegistries'), 'Bootstrap must adapt EA registries');
assert(bootstrap.includes('getPlatformCapabilityRegistry'), 'Bootstrap must export registry getter');
assert(bootstrap.includes('assembleSurfaceForModuleIds'), 'Bootstrap must assemble surfaces');

const nextConfig = readFileSync(join(root, 'next.config.ts'), 'utf8');
assert(
  nextConfig.includes('@ea/capability-registry') && nextConfig.includes('@ea/module-engine'),
  'next.config.ts must transpile @ea/capability-registry and @ea/module-engine',
);


assert(existsSync(join(root, 'lib/platform/client-configs.ts')), 'Missing client-configs.ts');
assert(existsSync(join(root, 'app/api/platform/clients/route.ts')), 'Missing clients API');
assert(Boolean(pkg.dependencies?.['@ea/theme-engine']), 'missing @ea/theme-engine');
assert(Boolean(pkg.dependencies?.['@ea/personality-engine']), 'missing @ea/personality-engine');
assert(
  nextConfig.includes('@ea/theme-engine') && nextConfig.includes('@ea/personality-engine'),
  'next.config must transpile theme + personality engines',
);


assert(Boolean(pkg.dependencies?.['@ea/website-engine']), 'missing @ea/website-engine');
assert(nextConfig.includes('@ea/website-engine'), 'next.config must transpile @ea/website-engine');
assert(existsSync(join(root, 'lib/platform/website-bridge.ts')), 'Missing website-bridge.ts');
assert(existsSync(join(root, 'app/api/platform/website/route.ts')), 'Missing website API');


assert(Boolean(pkg.dependencies?.['@ea/workspace-engine']), 'missing @ea/workspace-engine');
assert(nextConfig.includes('@ea/workspace-engine'), 'next.config must transpile @ea/workspace-engine');
assert(existsSync(join(root, 'lib/platform/workspace-bridge.ts')), 'Missing workspace-bridge.ts');
assert(existsSync(join(root, 'app/api/platform/workspace/route.ts')), 'Missing workspace API');
assert(existsSync(join(root, 'lib/platform/portal-workspace.ts')), 'Missing portal-workspace.ts');
assert(
  readFileSync(join(root, 'lib/platform/workspace-bridge.ts'), 'utf8').includes('resolveWorkspaceConfigFromOrg'),
  'workspace-bridge must resolve org overrides',
);
assert(
  readFileSync(join(root, 'lib/organizations.ts'), 'utf8').includes('Platform Client Id'),
  'organizations must map Platform Client Id',
);
assert(existsSync(join(root, 'app/api/admin/organization-workspace/route.ts')), 'Missing organization-workspace API');
assert(Boolean(pkg.dependencies?.['@ea/payments-contract']), 'missing @ea/payments-contract');
assert(nextConfig.includes('@ea/payments-contract'), 'next.config must transpile @ea/payments-contract');
assert(existsSync(join(root, 'lib/platform/payments-bridge.ts')), 'Missing payments-bridge.ts');
assert(existsSync(join(root, 'app/api/platform/payments/route.ts')), 'Missing payments API');
assert(existsSync(join(root, 'app/api/checkout/offers/route.ts')), 'Missing checkout offers API');
assert(existsSync(join(root, 'lib/platform/cpr-readiness.ts')), 'Missing cpr-readiness bridge');
assert(existsSync(join(root, 'app/api/platform/cpr-readiness/route.ts')), 'Missing cpr-readiness API');
assert(existsSync(join(root, 'lib/platform/foundation-status.ts')), 'Missing foundation-status');
assert(existsSync(join(root, 'app/api/platform/foundation/route.ts')), 'Missing foundation API');
assert(existsSync(join(root, 'lib/platform/package-sync-health.ts')), 'Missing package-sync-health');
assert(
  readFileSync(join(root, 'lib/platform/foundation-status.ts'), 'utf8').includes('getPackageSyncHealth'),
  'foundation-status must include package sync health',
);
assert(
  readFileSync(join(root, 'lib/mission-control-data.ts'), 'utf8').includes('getPackageSyncHealth'),
  'Mission Control must surface package sync attention',
);
assert(
  readFileSync(join(root, 'lib/entitlements.ts'), 'utf8').includes('setModulesEnabledBulk'),
  'entitlements must support bulk enable/disable',
);
assert(
  readFileSync(join(root, 'app/api/admin/entitlements/route.ts'), 'utf8').includes('enable-mapped'),
  'entitlements API must support enable-mapped bulk action',
);
assert(
  readFileSync(join(root, 'app/api/admin/entitlements/route.ts'), 'utf8').includes('platformCapabilityId'),
  'entitlements API must expose platform capability ids',
);
assert(existsSync(join(root, 'app/api/admin/organizations/route.ts')), 'Missing organizations list API');
assert(
  readFileSync(join(root, 'lib/organizations.ts'), 'utf8').includes('listOrganizations'),
  'organizations must export listOrganizations',
);
assert(
  readFileSync(join(root, 'lib/chassis/PortalShell.tsx'), 'utf8').includes('chromeProp'),
  'PortalShell must accept pre-resolved chrome',
);
assert(
  existsSync(join(root, 'lib/chassis/PortalChromeContext.tsx')),
  'Missing PortalChromeContext',
);
assert(
  readFileSync(join(root, 'app/portal/components/PortalSubpage.tsx'), 'utf8').includes(
    'PortalModuleChromeStrip',
  ),
  'PortalSubpage must render module chrome strip',
);
assert(
  existsSync(join(root, 'vendor/capability-registry/src/cpr-readiness.ts')) ||
    existsSync(join(osRoot, 'packages/capability-registry/src/cpr-readiness.ts')),
  'Missing cpr-readiness package module (vendor or OS)',
);
assert(
  existsSync(join(root, 'vendor/module-engine/src/adapters/cpr-hub.ts')) ||
    existsSync(join(osRoot, 'packages/module-engine/src/adapters/cpr-hub.ts')),
  'Missing CPR hub adapter (vendor or OS)',
);
assert(
  readFileSync(join(root, 'app/api/checkout/route.ts'), 'utf8').includes('resolveCheckoutOffer'),
  'one-time checkout must use resolveCheckoutOffer',
);
assert(
  readFileSync(join(root, 'app/api/checkout/subscription/route.ts'), 'utf8').includes('buildCommerceCheckoutMetadata'),
  'subscription checkout must use commerce metadata',
);
assert(
  readFileSync(join(root, 'app/api/webhooks/stripe/route.ts'), 'utf8').includes('resolveCheckoutOffer'),
  'stripe webhook must resolve commerce offers',
);
const offersPath = existsSync(join(root, 'vendor/payments-contract/src/offers.ts'))
  ? join(root, 'vendor/payments-contract/src/offers.ts')
  : join(osRoot, 'packages/payments-contract/src/offers.ts');
assert(
  existsSync(offersPath) &&
    readFileSync(offersPath, 'utf8').includes('COMMERCE_OFFERS'),
  'payments-contract must define COMMERCE_OFFERS',
);

if (failures.length) {
  console.error('Capability Framework verify FAILED:');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}


console.log('Capability Framework verify OK');
console.log(` - ${MODULE_IDS.length} MODULE_IDS mapped in OS ID map`);
console.log(' - bootstrap + marketplace API present');
console.log(' - package dependencies declared');
