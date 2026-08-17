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
assert.equal(amanda?.officialPortal, 'https://portal.efficiencyarchitects.online/amanda-catherine');
assert.equal(amanda?.githubRepo, 'TheArchitect1111/ea-payments');
assert.deepEqual(amanda?.vercelProjects, ['amanda-catherine-preview', 'ea-payments']);
assert.ok(amanda?.assetLocations.length, 'Amanda asset locations must be recorded.');
assert.equal(amanda?.missing.length, 0);
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
