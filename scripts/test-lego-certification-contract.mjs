import { readFileSync } from 'node:fs';
const contract=JSON.parse(readFileSync('config/module-certification-contract.json','utf8'));
const inventory=JSON.parse(readFileSync('config/capability-inventory.json','utf8'));
const failures=[];
for(const m of inventory.modules.filter((x)=>x.assemblyStatus==='certified')){
  if(!m.version) failures.push(`${m.id}:missing-version`);
  if(m.costLicense?.decision!=='approved') failures.push(`${m.id}:cost-license-not-approved`);
  if(!m.routes?.length) failures.push(`${m.id}:missing-route`);
  if(!m.healthCheck) failures.push(`${m.id}:missing-health-check`);
  if(!m.rollback) failures.push(`${m.id}:missing-rollback`);
  if(!m.tests || (Array.isArray(m.tests)&&m.tests.length===0)) failures.push(`${m.id}:missing-test-evidence`);
}
console.log(JSON.stringify({contractVersion:contract.version,requiredEvidenceClasses:contract.requiredEvidenceClasses,certifiedModules:inventory.modules.filter(x=>x.assemblyStatus==='certified').map(x=>x.id),structuralFailures:failures},null,2));
if(failures.length) process.exit(1);
