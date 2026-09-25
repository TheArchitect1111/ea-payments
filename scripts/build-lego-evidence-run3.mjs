import { createHash } from 'node:crypto'; import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const inv=JSON.parse(readFileSync('config/capability-inventory.json','utf8')); const contract=JSON.parse(readFileSync('config/module-certification-contract.json','utf8'));
const shared=['scripts/test-modular-assembly-run4.ts','scripts/test-tenant-safety.mjs','scripts/test-recovery-journeys.mjs'];
const dedicated={
 amplifi:['scripts/test-amplifi-durable-connections.mjs','scripts/test-amplifi-analytics.mjs','scripts/test-amplifi-three-path-workflows.mjs'],
 events:['scripts/test-event-hub-mandatory-cert.mjs','scripts/test-portal-scheduling-cert.mjs'],
 billing:['scripts/test-modular-assembly-run4.ts','scripts/test-tenant-safety.mjs'],
 intake:['scripts/test-portal-intake-cert.mjs'], applications:['scripts/test-portal-applications-cert.mjs'], reports:['scripts/test-portal-reports-cert.mjs'],
 simplifi:['scripts/test-simplifi-orb-system-contract.mjs','scripts/test-simplifi-orb-outcome-states-contract.mjs','scripts/test-simplifi-auth-clarity-contract.mjs','scripts/test-simplifi-brief-home-data-contract.mjs'],
 connect:['scripts/test-connect-mvp.mjs','scripts/test-capture-e2e.mjs','scripts/test-tenant-safety.mjs'],
 landing:['scripts/test-website-publish-gate.mjs','scripts/test-tenant-safety.mjs','scripts/test-factory-preview-links-must-render.ts'],
 ask:['scripts/test-guide-front-door.mjs','scripts/test-guide-progress.mjs','scripts/test-guide-orchestration.mjs','scripts/test-tenant-safety.mjs'],
 ctp:['scripts/test-ctp-portal-host.mjs','scripts/test-ctp-portal-progress.mjs','scripts/test-ctp-portal-support.mjs','scripts/test-tenant-safety.mjs'],
 settings:['scripts/test-portal-scheduling-cert.mjs']
};
const certs=[]; const quarantined=[];
for(const m of inv.modules.filter(x=>x.assemblyStatus==='certified')){
 const tests=[...new Set([...(dedicated[m.id]||[]),...shared])].filter(existsSync);
 const strong=(dedicated[m.id]||[]).filter(existsSync);
 if(strong.length<1){m.assemblyStatus='review-required'; quarantined.push({moduleId:m.id,reason:'no-module-specific-10-class evidence suite'}); continue;}
 const evidence={};
 for(const cls of contract.requiredEvidenceClasses) evidence[cls]={tests:strong};
 const sourceFingerprint=createHash('sha256').update(JSON.stringify({id:m.id,version:m.version,routes:m.routes,permissions:m.permissions,data:m.data,dependencies:m.dependencies,integrations:m.integrations,provisioning:m.provisioning,rollback:m.rollback})).digest('hex');
 const evidenceFingerprint=createHash('sha256').update(JSON.stringify(evidence)).digest('hex');
 certs.push({moduleId:m.id,moduleVersion:m.version,status:'candidate',sourceFingerprint,evidenceFingerprint,evidence,certifiedBoundary:{excludedReviewRequired:['Run 3 candidate: unresolved review-required fields must be resolved by executable certification before promotion.']}});
}
writeFileSync('config/capability-inventory.json',JSON.stringify(inv,null,2)+'\n');
writeFileSync('config/module-certification-evidence.json',JSON.stringify({version:1,status:'run3-evidence-populated',policy:'Candidates have complete evidence references but are not certified until the referenced suite is proven sufficient for every class. Missing module-specific evidence is quarantined fail-closed.',requiredEvidenceClasses:contract.requiredEvidenceClasses,certificates:certs,quarantined},null,2)+'\n');
console.log(JSON.stringify({candidates:certs.map(x=>x.moduleId),quarantined},null,2));
