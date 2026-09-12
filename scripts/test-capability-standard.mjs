import { readFileSync } from 'node:fs';

const standard = JSON.parse(readFileSync('config/capability-standard.json', 'utf8'));
const inventory = JSON.parse(readFileSync('config/capability-inventory.json', 'utf8'));
const registry = readFileSync('lib/modules/registry.ts', 'utf8');
const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const required = [
  'id',
  'name',
  'class',
  'version',
  'ui',
  'routes',
  'navigation',
  'data',
  'permissions',
  'dependencies',
  'integrations',
  'provisioning',
  'healthCheck',
  'tests',
  'rollback',
  'costLicense',
];
for (const field of required) {
  assert(standard.requiredContractFields.includes(field), `missing contract field ${field}`);
}

assert(
  standard.openSourceAcceptanceGate.defaultOnUncertainty === 'review-required',
  'open-source uncertainty must fail closed',
);
assert(
  standard.openSourceAcceptanceGate.requirements.includes('self-hostable-without-vendor-cloud-account'),
  'self-host gate missing',
);
assert(
  standard.openSourceAcceptanceGate.requirements.includes('no-mandatory-per-client-or-per-user-fee'),
  'per-client/user fee gate missing',
);
assert(
  standard.candidateDecisions.formbricks.decision === 'rejected',
  'Formbricks must remain rejected for embedded Forms',
);
assert(
  standard.candidateDecisions.documenso.decision === 'isolated',
  'Documenso must remain isolated pending integration boundary',
);
assert(
  standard.candidateDecisions.pretix.decision === 'review-required',
  'pretix must remain review-required',
);

const moduleIdsMatch = registry.match(/export const MODULE_IDS = \[([\s\S]*?)\] as const;/);
const registryIds = moduleIdsMatch
  ? [...moduleIdsMatch[1].matchAll(/'([^']+)'/g)].map((match) => match[1])
  : [];
const inventoryById = new Map(inventory.modules.map((capabilityModule) => [capabilityModule.id, capabilityModule]));
assert(registryIds.length > 0, 'could not parse module registry ids');
assert(
  inventory.modules.length === registryIds.length,
  'inventory must classify every registered module exactly once',
);
assert(
  new Set(inventory.modules.map((capabilityModule) => capabilityModule.id)).size === inventory.modules.length,
  'inventory contains duplicate module ids',
);
for (const id of registryIds) {
  assert(inventoryById.has(id), `inventory missing registered module ${id}`);
}
for (const capabilityModule of inventory.modules) {
  assert(registryIds.includes(capabilityModule.id), `inventory contains unknown module ${capabilityModule.id}`);
  assert(
    ['core', 'business', 'specialized'].includes(capabilityModule.class),
    `${capabilityModule.id} has invalid class ${capabilityModule.class}`,
  );
  for (const field of required) {
    assert(Object.hasOwn(capabilityModule, field), `${capabilityModule.id} missing contract field ${field}`);
  }
}

const targetClasses = Object.entries(standard.classes).flatMap(([className, value]) =>
  value.target.map((id) => [id, className]),
);
for (const [id, expectedClass] of targetClasses) {
  const capabilityModule = inventoryById.get(id);
  assert(capabilityModule, `standard target ${id} missing from inventory`);
  if (capabilityModule) {
    assert(capabilityModule.class === expectedClass, `${id} must be classified ${expectedClass}`);
  }
}

const certifiedCore = inventory.modules.filter(
  (capabilityModule) => capabilityModule.class === 'core' && capabilityModule.assemblyStatus === 'certified',
);
assert(
  certifiedCore.length === standard.classes.core.target.length,
  'every core target must be certified before universal-core expansion',
);
for (const id of standard.classes.core.target) {
  const capabilityModule = inventoryById.get(id);
  assert(capabilityModule?.assemblyStatus === 'certified', `${id} must be certified core`);
  assert(
    capabilityModule?.costLicense?.decision === 'approved',
    `${id} cost/license decision must be approved`,
  );
  assert(
    capabilityModule?.provisioning?.required === true,
    `${id} must provision automatically with every tenant`,
  );
}

const chassisMatch = registry.match(/CHASSIS_STANDARD_MODULE_IDS: ModuleId\[\] = \[([^\n]+)\]/);
const chassisIds = chassisMatch
  ? [...chassisMatch[1].matchAll(/'([^']+)'/g)].map((match) => match[1])
  : [];
for (const id of standard.classes.core.target) {
  assert(
    chassisIds.includes(id),
    `${id} certified core is not enforced by CHASSIS_STANDARD_MODULE_IDS`,
  );
}

const uncertified = inventory.modules.filter(
  (capabilityModule) => capabilityModule.assemblyStatus !== 'certified',
);
for (const capabilityModule of uncertified) {
  assert(
    capabilityModule.costLicense?.decision !== 'approved' || capabilityModule.assemblyStatus === 'certified',
    `${capabilityModule.id} cannot be silently approved before certification`,
  );
}

if (failures.length) {
  console.error('EA Capability Standard / Run 1 FAILED');
  failures.forEach((failure) => console.error(' -', failure));
  process.exit(1);
}
console.log('EA Capability Standard / Run 1 OK');
console.log(` - ${required.length} required capability contract fields`);
console.log(` - ${inventory.modules.length} registered modules classified`);
console.log(` - ${certifiedCore.length} universal core capabilities certified and enforced`);
console.log(` - ${uncertified.length} non-core capabilities remain fail-closed until certified`);
