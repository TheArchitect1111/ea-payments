import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const evidence = JSON.parse(readFileSync('config/portable-brick-evidence.json','utf8'));
const contract = JSON.parse(readFileSync('config/module-certification-contract.json','utf8'));
const certificates = JSON.parse(readFileSync('config/module-certification-evidence.json','utf8')).certificates;
const inventory = JSON.parse(readFileSync('config/capability-inventory.json','utf8')).modules;
assert.equal(evidence.moduleId, 'amanda');
assert.equal(evidence.moduleVersion, 1);
assert.equal(evidence.status, 'branch-verified');
for (const cls of contract.requiredEvidenceClasses) assert.ok(evidence.evidence[cls]?.tests?.length, cls);
for (const id of evidence.dependencies) {
  const certificate = certificates.find(c => c.moduleId === id);
  const module = inventory.find(m => m.id === id);
  assert.equal(certificate?.status, 'certified', id);
  assert.equal(certificate?.moduleVersion, module?.version, id);
  assert.equal(module?.costLicense?.decision, 'approved', id);
}
const entries = evidence.sourceFiles.map(path => [path, createHash('sha256').update(readFileSync(path)).digest('hex')]);
assert.equal(createHash('sha256').update(JSON.stringify(entries)).digest('hex'), evidence.sourceFingerprint);
console.log('Portable Amanda exact-source evidence and certified dependencies verified');
