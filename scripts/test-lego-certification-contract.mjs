import { existsSync, readFileSync } from 'node:fs';

const contract = JSON.parse(readFileSync('config/module-certification-contract.json', 'utf8'));
const inventory = JSON.parse(readFileSync('config/capability-inventory.json', 'utf8'));
const ledger = JSON.parse(readFileSync('config/module-certification-evidence.json', 'utf8'));
const registrySource = readFileSync('lib/modules/registry.ts', 'utf8');
const failures = [];
const required = contract.requiredEvidenceClasses ?? [];

const registryStart = registrySource.indexOf('export const MODULE_IDS = [');
const registryEnd = registryStart < 0 ? -1 : registrySource.indexOf('] as const;', registryStart);
if (registryStart < 0 || registryEnd < 0) failures.push('registry:unable-to-read-MODULE_IDS');
const registryBody = registryStart >= 0 && registryEnd >= 0 ? registrySource.slice(registryStart, registryEnd) : '';
const registryIds = [...registryBody.matchAll(/'([^']+)'/g)].map((match) => match[1]);
const inventoryIds = inventory.modules.map((module) => module.id);
const certifiedModules = inventory.modules.filter((module) => module.assemblyStatus === 'certified');
const certifiedIds = certifiedModules.map((module) => module.id);
const certificates = ledger.certificates ?? [];
const certificateIds = certificates.map((certificate) => certificate.moduleId);
const certificatesById = new Map(certificates.map((certificate) => [certificate.moduleId, certificate]));

function addDuplicates(label, values) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) failures.push(label + ':duplicate-id:' + value);
    seen.add(value);
  }
}

function compareIdSets(label, expected, actual) {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  for (const id of expectedSet) if (!actualSet.has(id)) failures.push(label + ':missing:' + id);
  for (const id of actualSet) if (!expectedSet.has(id)) failures.push(label + ':unexpected:' + id);
}

addDuplicates('registry', registryIds);
addDuplicates('inventory', inventoryIds);
addDuplicates('certificates', certificateIds);
compareIdSets('registry-vs-inventory', registryIds, inventoryIds);
compareIdSets('certified-inventory-vs-ledger', certifiedIds, certificateIds);

for (const module of certifiedModules) {
  const certificate = certificatesById.get(module.id);
  if (!certificate) continue;
  if (certificate.status !== 'certified') failures.push(module.id + ':not-certified');
  if (certificate.moduleVersion !== module.version) failures.push(module.id + ':version-mismatch');
  for (const evidenceClass of required) {
    const evidence = certificate.evidence?.[evidenceClass];
    if (!evidence?.tests?.length) {
      failures.push(module.id + ':' + evidenceClass + ':missing-evidence');
      continue;
    }
    for (const path of evidence.tests) {
      if (!existsSync(path)) failures.push(module.id + ':' + evidenceClass + ':missing-file:' + path);
    }
    const mappedTests = certificate.evidenceClassTests?.[evidenceClass];
    if (!Array.isArray(mappedTests) || !mappedTests.length) {
      failures.push(module.id + ':' + evidenceClass + ':missing-explicit-test-mapping');
    } else {
      const evidenceTests = [...new Set(evidence.tests)].sort();
      const classTests = [...new Set(mappedTests)].sort();
      if (JSON.stringify(evidenceTests) !== JSON.stringify(classTests)) {
        failures.push(module.id + ':' + evidenceClass + ':class-test-mapping-mismatch');
      }
      for (const path of classTests) {
        if (!existsSync(path)) failures.push(module.id + ':' + evidenceClass + ':mapped-test-missing-file:' + path);
      }
    }
  }
  if (!certificate.sourceFingerprint || !certificate.evidenceFingerprint) {
    failures.push(module.id + ':missing-fingerprint');
  }
}

console.log(JSON.stringify({
  moduleIds: {
    registry: registryIds.length,
    inventory: inventoryIds.length,
    certified: certifiedIds.length,
    certificates: certificateIds.length,
  },
  requiredEvidenceClasses: required,
  failures,
}, null, 2));
if (failures.length) process.exit(1);
