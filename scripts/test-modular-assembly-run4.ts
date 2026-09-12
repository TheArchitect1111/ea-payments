import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
  'landing',
  'pulse',
  'ctp',
  'member',
  'messaging',
  'documents',
  'events',
  'training',
  'resources',
  'ask',
  'connect',
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

const run4Wave = [
  'landing',
  'pulse',
  'ctp',
  'member',
  'messaging',
  'documents',
  'events',
  'training',
  'resources',
  'ask',
  'connect',
  'billing',
  'settings',
] as const;

for (const id of run4Wave) {
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

const documentCertification = certifications.certifications.find((item) => item.id === 'documents');
assert.match(documentCertification?.boundary ?? '', /Documenso is not required/i);

const messagingCertification = certifications.certifications.find((item) => item.id === 'messaging');
assert.match(messagingCertification?.boundary ?? '', /Novu is not required/i);

const billingCertification = certifications.certifications.find((item) => item.id === 'billing');
assert.match(billingCertification?.boundary ?? '', /platform-managed Stripe adapter/i);
assert.match(billingCertification?.boundary ?? '', /No client Stripe account/i);

const eventsPage = readFileSync('app/portal/[slug]/events/page.tsx', 'utf8');
assert.match(eventsPage, /const hasPretix = ticketed\.length > 0/);
assert.match(eventsPage, /hasPretix \? 'events' : 'calendar'/);

const documentsPage = readFileSync('app/portal/[slug]/documents/page.tsx', 'utf8');
assert.match(documentsPage, /listPortalDocuments/);
assert.doesNotMatch(documentsPage, /Documenso/i);

const messagingPage = readFileSync('app/portal/[slug]/messaging/page.tsx', 'utf8');
assert.match(messagingPage, /listPortalMessagingThreads/);
assert.doesNotMatch(messagingPage, /Novu/i);

const billingRoute = readFileSync('app/api/billing/portal/route.ts', 'utf8');
assert.match(billingRoute, /if \(!process\.env\.STRIPE_SECRET_KEY\)/);
assert.match(billingRoute, /Billing is not configured/);
assert.match(billingRoute, /billing:manage/);

assert.throws(() => requireAssemblyPlan(['calendar']), /calendar:not-certified/);
assert.throws(() => requireAssemblyPlan(['people']), /people:not-certified/);
assert.throws(() => requireAssemblyPlan(['simplifi']), /simplifi:not-certified/);

console.log('EA Modular Assembly Run 4 OK');
console.log(' - canonical Website + Portal Starter entitlement set is fully provisionable in certified mode');
console.log(' - all thirteen Run 4 Starter capabilities have explicit certification boundaries');
console.log(' - Pretix, Documenso, and Novu remain optional provider extensions, not assembly requirements');
console.log(' - Billing fails safely when the existing platform Stripe adapter is unavailable');
console.log(' - non-Starter unresolved capabilities remain fail-closed');
