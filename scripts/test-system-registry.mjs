import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const registry = JSON.parse(await readFile(path.join(root, 'config', 'ea-system-registry.json'), 'utf8'));
const legacySource = await readFile(path.join(root, 'lib', 'canonical-project-registry.ts'), 'utf8');

const allowedTypes = new Set(['platform', 'product', 'client', 'internal-system']);
const allowedLifecycle = new Set(['active', 'attention', 'repository-only', 'legacy', 'retired']);
const allowedVerification = new Set(['verified', 'partial', 'unverified']);
const allowedApproval = new Set(['approved', 'attention', 'unapproved']);
const ids = new Set();
let failures = 0;

function fail(message) {
  console.error(`[FAIL] ${message}`);
  failures += 1;
}

if (registry.schemaVersion !== 1) fail('schemaVersion must be 1');
if (registry.authority?.desiredState !== 'config/ea-system-registry.json') fail('desiredState authority must point to the registry itself');
if (registry.authority?.operationalProjection !== 'Airtable: Universal Manifest') fail('Universal Manifest must be the operational projection');
if (registry.authority?.commandSurface !== 'Pulse') fail('Pulse must be the command surface');

for (const entity of registry.entities || []) {
  if (!entity.id || ids.has(entity.id)) fail(`duplicate or missing entity id: ${entity.id || '(empty)'}`);
  ids.add(entity.id);
  if (!allowedTypes.has(entity.entityType)) fail(`${entity.id}: invalid entityType ${entity.entityType}`);
  if (!allowedLifecycle.has(entity.lifecycle)) fail(`${entity.id}: invalid lifecycle ${entity.lifecycle}`);
  if (!allowedVerification.has(entity.verification)) fail(`${entity.id}: invalid verification ${entity.verification}`);
  if (!allowedApproval.has(entity.approvalState)) fail(`${entity.id}: invalid approvalState ${entity.approvalState}`);
  if (!entity.recoveryPoint) fail(`${entity.id}: recoveryPoint is required`);
  if (entity.productionUrl && !entity.productionUrl.startsWith('https://')) fail(`${entity.id}: productionUrl must use https`);
  if (entity.portalUrl && !entity.portalUrl.startsWith('https://')) fail(`${entity.id}: portalUrl must use https`);
  if (entity.lifecycle === 'active') {
    for (const field of ['canonicalRepo', 'canonicalBranch', 'canonicalPath', 'deploymentTarget', 'productionUrl']) {
      if (!entity[field]) fail(`${entity.id}: active entity missing ${field}`);
    }
    if (entity.verification !== 'verified') fail(`${entity.id}: active entity must be verified`);
  }
  if (entity.lifecycle === 'repository-only' && !entity.canonicalRepo) fail(`${entity.id}: repository-only entity needs canonicalRepo`);
  if (entity.legacyProjects?.includes(entity.deploymentTarget)) fail(`${entity.id}: canonical deployment cannot also be legacy`);
}

const canonicalIds = [...legacySource.matchAll(/\bid:\s*'([^']+)'/g)].map((match) => match[1]);
for (const id of canonicalIds) {
  if (!ids.has(id)) fail(`legacy canonical registry entity ${id} is missing from EA System Registry`);
}

if ((registry.entities || []).length < canonicalIds.length) {
  fail('EA System Registry cannot be smaller than the compatibility registry');
}

if (failures) {
  console.error(`EA System Registry: FAIL (${failures} issue${failures === 1 ? '' : 's'})`);
  process.exit(1);
}

const summary = {
  total: registry.entities.length,
  active: registry.entities.filter((entity) => entity.lifecycle === 'active').length,
  attention: registry.entities.filter((entity) => entity.lifecycle === 'attention').length,
  repositoryOnly: registry.entities.filter((entity) => entity.lifecycle === 'repository-only').length,
  verified: registry.entities.filter((entity) => entity.verification === 'verified').length,
};
console.log(`EA System Registry: PASS ${JSON.stringify(summary)}`);
