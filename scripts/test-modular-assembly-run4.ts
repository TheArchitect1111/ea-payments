import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import certifications from '../config/capability-certifications.json';
import { requireAssemblyPlan } from '../lib/modules/assembly';
import {
  planClientFactoryAssembly,
  requireClientFactoryAssembly,
} from '../lib/modules/client-factory-assembly';
import { defaultModulesForPackage, getModuleDefinition } from '../lib/modules/registry';

const starterPackage = 'Website + Portal Starter';
const starterModules = defaultModulesForPackage(starterPackage);
const expectedStarterModules = [
  'dashboard',
  'amplifi',
  'update-hub',
  'member',
  'events',
  'billing',
  'settings',
  'intake',
  'applications',
  'reports',
];

assert.deepEqual(starterModules, expectedStarterModules);

const starterPlan = planClientFactoryAssembly({ packagePurchased: starterPackage });
assert.equal(starterPlan.blocked, false, 'Website + Portal Starter must be fully assembly-ready');
assert.deepEqual(starterPlan.rejected, []);
assert.deepEqual(starterPlan.admitted, expectedStarterModules);
assert.doesNotThrow(() => requireClientFactoryAssembly({ packagePurchased: starterPackage }));

for (const id of ['member', 'events', 'billing', 'settings'] as const) {
  const definition = getModuleDefinition(id);
  assert.ok(definition, `${id} must exist in the canonical module registry`);
  assert.ok(definition.pathSegment, `${id} must have a deterministic portal path`);
  const certification = certifications.certifications.find((item) => item.id === id);
  assert.ok(certification, `${id} must have an explicit Run 4 certification record`);
  assert.equal(certification.assemblyStatus, 'certified');
  assert.equal(certification.costLicenseDecision, 'approved');
  assert.ok(certification.boundary.length > 30, `${id} certification boundary must be explicit`);
}

const eventCertification = certifications.certifications.find((item) => item.id === 'events');
assert.match(eventCertification?.boundary ?? '', /Pretix is an optional extension/i);
assert.match(eventCertification?.boundary ?? '', /no Pretix account is required/i);

const billingCertification = certifications.certifications.find((item) => item.id === 'billing');
assert.match(billingCertification?.boundary ?? '', /platform-managed Stripe adapter/i);
assert.match(billingCertification?.boundary ?? '', /No client Stripe account/i);

const eventsPage = await readFile('app/portal/[slug]/events/page.tsx', 'utf8');
assert.match(eventsPage, /const hasPretix = ticketed\.length > 0/);
assert.match(eventsPage, /hasPretix \? 'events' : 'calendar'/);

const billingRoute = await readFile('app/api/billing/portal/route.ts', 'utf8');
assert.match(billingRoute, /if \(!process\.env\.STRIPE_SECRET_KEY\)/);
assert.match(billingRoute, /Billing is not configured/);
assert.match(billingRoute, /billing:manage/);

const unresolved = requireAssemblyPlan(['member', 'settings']);
assert.equal(unresolved.blocked, false);
assert.throws(() => requireAssemblyPlan(['documents']), /documents:not-certified/);
assert.throws(() => requireAssemblyPlan(['messages']), /messages:not-certified/);

console.log('EA Modular Assembly Run 4 OK');
console.log(' - Website + Portal Starter is fully provisionable in certified mode');
console.log(' - Member, Events, Billing, and Settings are certified with explicit boundaries');
console.log(' - Pretix remains optional and is not required to assemble Events');
console.log(' - Billing fails safely when the existing platform Stripe adapter is unavailable');
console.log(' - unresolved capabilities remain fail-closed');
