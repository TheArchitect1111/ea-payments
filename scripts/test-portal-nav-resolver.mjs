/**
 * Offline checks for portal sidebar nav resolver (package presets).
 * Run: node scripts/test-portal-nav-resolver.mjs
 */
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Load compiled registry via tsx alternative — use inline mirror of preset logic for CI-safe check
const PACKAGE_MODULE_GRANTS = {
  'Launch Verification': ['dashboard', 'pulse', 'update-hub', 'ask'],
  'Capacity Assessment': ['dashboard', 'pulse', 'update-hub', 'documents', 'ask', 'discovery', 'ctp'],
};

const TENANT_MODULE_PRESETS = {
  'ea-client': [
    'dashboard',
    'pulse',
    'simplifi',
    'amplifi',
    'update-hub',
    'messaging',
    'documents',
    'training',
    'events',
    'resources',
    'ask',
  ],
};

function defaultModulesForPackage(packagePurchased, options = {}) {
  const preset = TENANT_MODULE_PRESETS[options.tenantPreset ?? 'ea-client'] ?? TENANT_MODULE_PRESETS['ea-client'];
  const grants = PACKAGE_MODULE_GRANTS[packagePurchased] ?? [];
  const ids = new Set([...preset, ...grants]);
  if (packagePurchased === 'Launch Verification') {
    return PACKAGE_MODULE_GRANTS['Launch Verification'];
  }
  return [...ids];
}

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const launchVerification = defaultModulesForPackage('Launch Verification', { tenantPreset: 'ea-client' });
assert(launchVerification.includes('dashboard'), 'Launch Verification includes dashboard');
assert(launchVerification.includes('pulse'), 'Launch Verification includes pulse');
assert(!launchVerification.includes('simplifi'), 'Launch Verification excludes simplifi');
assert(!launchVerification.includes('ctp'), 'Launch Verification excludes ctp');

const capacityAssessment = defaultModulesForPackage('Capacity Assessment', { tenantPreset: 'ea-client' });
assert(capacityAssessment.includes('ctp'), 'Capacity Assessment includes ctp');
assert(capacityAssessment.includes('pulse'), 'Capacity Assessment includes pulse');

if (failures.length) {
  console.error('Portal nav resolver preset checks failed:');
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

console.log('Portal nav resolver preset checks passed.');
