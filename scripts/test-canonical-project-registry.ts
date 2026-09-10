import assert from 'node:assert/strict';
import {
  assertCanonicalRegistry,
  CANONICAL_PROJECT_REGISTRY,
  findCanonicalProject,
} from '../lib/canonical-project-registry';

assert.equal(assertCanonicalRegistry(), true);
assert.equal(new Set(CANONICAL_PROJECT_REGISTRY.map((project) => project.id)).size, CANONICAL_PROJECT_REGISTRY.length);

const amanda = findCanonicalProject('Amanda');
assert.ok(amanda, 'Amanda must be retrievable by name.');
assert.equal(amanda?.officialWebsite, 'https://amandacatherine.ca');
assert.equal(amanda?.officialPortal, 'https://efficiencyarchitects.online/portal/amanda-catherine');
assert.equal(amanda?.githubRepo, 'TheArchitect1111/ea-payments');
assert.deepEqual(amanda?.vercelProjects, ['amanda-catherine-4', 'ea-payments']);
assert.ok(amanda?.assetLocations.includes('clients/amanda-catherine'), 'Amanda canonical package must be recorded.');
assert.ok(amanda?.assetLocations.includes('public/amanda-catherine'), 'Amanda public assets must resolve to one canonical root.');
assert.ok(amanda?.assetLocations.includes('lib/amanda-catherine/course-resources.ts'), 'Amanda private course assets must resolve through one registry.');
assert.equal(amanda?.missing.length, 0);
assert.match(amanda?.notes || '', /domain shell only/i);
assert.match(amanda?.notes || '', /retired historical Vercel projects/i);
assert.doesNotMatch(amanda?.notes || '', /website and portal are separate production surfaces/i);
assert.equal(findCanonicalProject('AesthetiKine')?.id, 'AMANDA');
assert.equal(findCanonicalProject('Amplifi')?.id, 'AMPLIFI');

for (const project of CANONICAL_PROJECT_REGISTRY) {
  assert.ok(project.name);
  assert.ok(project.aliases.length);
  assert.ok(Array.isArray(project.missing));
  if (project.status === 'active') {
    assert.equal(project.missing.length, 0, `${project.id} is marked active but incomplete.`);
    assert.ok(project.verifiedOn, `${project.id} is active without a verification date.`);
  }
}

console.log('Canonical client and product registry: PASS');
