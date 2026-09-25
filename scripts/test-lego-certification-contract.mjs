import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

const contract=JSON.parse(readFileSync('config/module-certification-contract.json','utf8'));
const inventory=JSON.parse(readFileSync('config/capability-inventory.json','utf8'));
const ledger=JSON.parse(readFileSync('config/module-certification-evidence.json','utf8'));
const failures=[];
const required=contract.requiredEvidenceClasses;
const allowed=['certified','candidate','quarantined'];

if(!Array.isArray(required)||required.length!==10) failures.push('contract:expected-10-evidence-classes');
if(!Array.isArray(ledger.certificates)) failures.push('ledger:certificates-must-be-array');

for(const c of ledger.certificates||[]){
  const m=inventory.modules.find(x=>x.id===c.moduleId);
  if(!m){failures.push(`${c.moduleId}:unknown-module`);continue;}
  if(!allowed.includes(c.status)) failures.push(`${c.moduleId}:invalid-certificate-status`);
  if(c.moduleVersion!==m.version) failures.push(`${c.moduleId}:version-mismatch`);
  const keys=Object.keys(c.evidence||{});
  for(const cls of required){
    const e=c.evidence?.[cls];
    if(!e) {failures.push(`${c.moduleId}:missing-evidence:${cls}`); continue;}
    if(!Array.isArray(e.tests)||e.tests.length===0) failures.push(`${c.moduleId}:missing-tests:${cls}`);
    for(const p of e.tests||[]) if(!existsSync(p)) failures.push(`${c.moduleId}:missing-test-file:${cls}:${p}`);
  }
  for(const k of keys) if(!required.includes(k)) failures.push(`${c.moduleId}:unknown-evidence-class:${k}`);
  if(c.status==='certified'){
    if(!c.sourceFingerprint) failures.push(`${c.moduleId}:missing-source-fingerprint`);
    if(!c.evidenceFingerprint) failures.push(`${c.moduleId}:missing-evidence-fingerprint`);
    const evidenceFingerprint=createHash('sha256').update(JSON.stringify(c.evidence)).digest('hex');
    if(c.evidenceFingerprint!==evidenceFingerprint) failures.push(`${c.moduleId}:evidence-fingerprint-mismatch`);
    const unresolved=['dependencies','integrations','provisioning'].filter(k=>m[k]?.status==='review-required');
    if(unresolved.length && !c.certifiedBoundary?.excludedReviewRequired?.length) failures.push(`${c.moduleId}:unresolved-review-required:${unresolved.join(',')}`);
  }
}
console.log(JSON.stringify({engineVersion:2,requiredEvidenceClasses:required,certificateCount:(ledger.certificates||[]).length,failures},null,2));
if(failures.length) process.exit(1);
