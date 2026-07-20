/**
 * Smoke check for lib/os-capability-taxonomy.ts (no TypeScript compile).
 * Run: node scripts/verify-os-taxonomy.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const taxonomyPath = path.join(root, 'lib', 'os-capability-taxonomy.ts');
const lifecyclePath = path.join(root, 'lib', 'os-lifecycle.ts');
const experiencePath = path.join(root, 'lib', 'experience-registry.ts');

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

assert(fs.existsSync(taxonomyPath), `Missing ${taxonomyPath}`);
assert(fs.existsSync(lifecyclePath), `Missing ${lifecyclePath}`);

const taxonomy = fs.readFileSync(taxonomyPath, 'utf8');
const lifecycle = fs.readFileSync(lifecyclePath, 'utf8');
const experience = fs.readFileSync(experiencePath, 'utf8');

assert(
  taxonomy.includes('export const OS_CAPABILITY_TAXONOMY'),
  'OS_CAPABILITY_TAXONOMY export missing',
);
assert(lifecycle.includes("export type OsLifecycleTag"), 'OsLifecycleTag missing from os-lifecycle.ts');
assert(
  taxonomy.includes("export type OsCapabilityStatus = 'live' | 'thin' | 'admin' | 'planned'"),
  'OsCapabilityStatus union missing',
);
assert(taxonomy.includes('listOsCapabilitiesByLifecycle'), 'listOsCapabilitiesByLifecycle missing');
assert(taxonomy.includes('listOsCapabilitiesByModule'), 'listOsCapabilitiesByModule missing');
assert(taxonomy.includes('osCapabilityCoverageSummary'), 'osCapabilityCoverageSummary missing');

const idLines = taxonomy.match(/^\s*id:\s*'[a-z0-9-]+',?\s*$/gm) || [];
assert(idLines.length >= 80, `Expected >= 80 capability ids, found ${idLines.length}`);

const categories = [
  'Visibility & Intelligence',
  'Communication',
  'Social Media',
  'Lead Management',
  'Event Management',
  'Forms & Applications',
  'Workflow Automation',
  'AI Workforce',
  'Websites & Landing Pages',
  'Portals',
  'Content & Resources',
  'Document Management',
  'Team Coordination',
  'Marketing',
  'Email Systems',
  'Recruiting & Enrollment',
  'Fundraising & Sponsorships',
  'Membership Management',
  'Scheduling',
  'Analytics & Reporting',
  'Mobile Experience',
  'Branding & Customization',
  'Industry Solutions',
  'Strategic Services',
];
for (const cat of categories) {
  assert(taxonomy.includes(`category: "${cat}"`) || taxonomy.includes(`category: '${cat}'`), `Missing category: ${cat}`);
}

assert(experience.includes("from '@/lib/os-lifecycle'"), 'experience-registry should import OsLifecycleTag');
assert(experience.includes('osLifecycle?:'), 'CapabilityDefinition.osLifecycle missing');
const osLifecycleAssignments = experience.match(/osLifecycle:\s*'(capture|organize|communicate|act|measure)'/g) || [];
assert(
  osLifecycleAssignments.length >= 16,
  `Expected osLifecycle on all CAPABILITY_REGISTRY entries, found ${osLifecycleAssignments.length}`,
);

if (failures.length) {
  console.error('verify-os-taxonomy FAILED:');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log(`verify-os-taxonomy OK (${idLines.length} capability ids, ${osLifecycleAssignments.length} experience osLifecycle tags)`);
