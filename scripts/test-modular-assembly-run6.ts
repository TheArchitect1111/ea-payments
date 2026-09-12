import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import certifications from '../config/capability-certifications.json';
import { requireAssemblyPlan } from '../lib/modules/assembly';

assert.equal(certifications.run, 6);
const simplifiCertification = certifications.certifications.find((item) => item.id === 'simplifi');
assert.ok(simplifiCertification, 'Simplifi must have a Run 6 certification record');
assert.equal(simplifiCertification.assemblyStatus, 'certified');
assert.equal(simplifiCertification.costLicenseDecision, 'approved');
assert.match(simplifiCertification.boundary, /No new vendor account/i);

const implementationWave = requireAssemblyPlan([
  'simplifi',
  'amplifi',
  'connect',
  'member',
  'events',
  'billing',
  'settings',
]);
assert.equal(implementationWave.blocked, false);
assert.equal(implementationWave.rejected.length, 0);
assert.ok(implementationWave.admitted.includes('simplifi'));
assert.ok(implementationWave.admitted.includes('connect'));

assert.throws(() => requireAssemblyPlan(['people']), /people:not-certified/);
assert.throws(() => requireAssemblyPlan(['calendar']), /calendar:not-certified/);
assert.throws(() => requireAssemblyPlan(['discovery']), /discovery:not-certified/);

const simplifiPage = readFileSync('app/portal/[slug]/simplifi/page.tsx', 'utf8');
assert.match(simplifiPage, /requirePortalModule\(slug, 'simplifi'\)/);
assert.match(simplifiPage, /getPortalCaptures/);
assert.match(simplifiPage, /getContentRequestsForClient/);

const peoplePage = readFileSync('app/portal/[slug]/people/page.tsx', 'utf8');
assert.match(peoplePage, /isUniversalPeopleEnabled/);
assert.match(peoplePage, /notFound\(\)/);

const registry = readFileSync('lib/modules/registry.ts', 'utf8');
assert.match(registry, /calendars connected through Nylas/);

console.log('EA Modular Assembly Run 6 OK');
console.log(' - Simplifi native capability boundary is certified');
console.log(' - Implementation specialized wave is admissible');
console.log(' - People remains fail-closed behind its feature flag');
console.log(' - Calendar remains fail-closed while Nylas is a required route dependency');
console.log(' - Discovery remains fail-closed as a demo-only capability');
