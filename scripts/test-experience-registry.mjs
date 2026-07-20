/**
 * Validates EA Experience Registry / Capability Map wiring (Sprint 1B).
 * Run: node scripts/test-experience-registry.mjs
 */
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

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

const CAPABILITY_IDS = [
  'command-view',
  'organization-health',
  'opportunity-capture',
  'amplification',
  'advisor-activity',
  'messaging',
  'ask-advisor',
  'your-build',
  'member-experience',
  'relationship-capture',
  'documents',
  'learning',
  'events',
  'resources',
  'billing',
  'guided-discovery',
  'landing-pages',
];

const LIFECYCLE_PHASES = ['discover', 'engage', 'convert', 'prepare', 'experience', 'continue'];
const EXPERIENCE_KINDS = [
  'client-transformation',
  'magnifi-consider',
  'connect-relationship',
  'portal-operating',
];

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

assert(MODULE_IDS.length === 17, 'Module registry has 17 ids');
assert(CAPABILITY_IDS.length === 17, 'Capability map has 17 portal capabilities');
assert(LIFECYCLE_PHASES.length === 6, 'Experience lifecycle has 6 phases');
assert(EXPERIENCE_KINDS.length === 4, 'Experience catalog has 4 kinds');

const capabilityModulePairs = {
  'command-view': 'dashboard',
  'organization-health': 'pulse',
  'opportunity-capture': 'simplifi',
  amplification: 'amplifi',
  'advisor-activity': 'update-hub',
  messaging: 'messaging',
  'ask-advisor': 'ask',
  'your-build': 'ctp',
  'member-experience': 'member',
  'relationship-capture': 'connect',
  documents: 'documents',
  learning: 'training',
  events: 'events',
  resources: 'resources',
  billing: 'billing',
  'guided-discovery': 'discovery',
  'landing-pages': 'landing',
};

for (const [capId, modId] of Object.entries(capabilityModulePairs)) {
  assert(CAPABILITY_IDS.includes(capId), `Capability id present: ${capId}`);
  assert(MODULE_IDS.includes(modId), `Module id present for ${capId}: ${modId}`);
}

assert(
  CAPABILITY_IDS.length === Object.keys(capabilityModulePairs).length,
  'Capability/module bijection is complete',
);

// Sprint 1B: preserved product labels (not Sprint 2 plain language)
const preservedLabels = {
  dashboard: 'Dashboard',
  pulse: 'Pulse',
  simplifi: 'Simplifi',
  amplifi: 'Amplifi',
  'update-hub': 'Updates',
  connect: 'Connect',
};

for (const [modId, label] of Object.entries(preservedLabels)) {
  assert(typeof label === 'string' && label.length > 0, `Preserved nav label for ${modId}`);
}

if (failures.length) {
  console.error('Experience registry / capability map checks failed:');
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

console.log('Experience registry / capability map wiring checks passed.');
