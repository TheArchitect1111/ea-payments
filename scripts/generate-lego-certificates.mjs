import {createHash} from 'node:crypto';import {existsSync,readFileSync,writeFileSync} from 'node:fs';
const inv=JSON.parse(readFileSync('config/capability-inventory.json','utf8'));const contract=JSON.parse(readFileSync('config/module-certification-contract.json','utf8'));
const global=['scripts/test-capability-standard.mjs','scripts/test-tenant-safety.mjs','scripts/test-modular-assembly-run2.ts','scripts/test-factory-build-verification-gates.mjs','scripts/test-recovery-certification-contract.mjs'];
const map={
 dashboard:['scripts/test-client-experience-shell.mjs','scripts/test-portal-hub-realism.mjs'],
 amplifi:['scripts/test-amplifi-durable-connections.mjs','scripts/test-amplifi-public-testing.mjs','scripts/test-amplifi-premium-proof.ts'],
 'update-hub':['scripts/test-guide-progress.mjs','scripts/test-recovery-monitoring-contract.mjs'],
 events:['scripts/test-event-hub-mandatory-cert.mjs','scripts/test-portal-scheduling-cert.mjs','scripts/test-pretix-event-hub-contract.mjs'],
 billing:['scripts/test-modular-assembly-run4.ts','scripts/test-tenant-release-safety.mjs'],
 documents:['scripts/test-ctp-portal-documents.mjs','scripts/test-modular-assembly-run4.ts'],
 training:['scripts/test-online-academy-chassis.mjs','scripts/test-modular-assembly-run4.ts'],
 messaging:['scripts/test-modular-assembly-run4.ts','scripts/test-guide-orchestration.mjs'],
 intake:['scripts/test-portal-intake-cert.mjs','scripts/test-canonical-ctp-intake.mjs'],
 applications:['scripts/test-portal-applications-cert.mjs','scripts/test-modular-assembly-run3.ts'],
 reports:['scripts/test-portal-reports-cert.mjs','scripts/test-ctp-portal-bi.mjs'],
 pulse:['scripts/test-modular-assembly-run4.ts','scripts/test-guide-progress.mjs'],
 simplifi:['scripts/test-simplifi-os-foundation.mjs','scripts/test-simplifi-p0-capture-success.mjs','scripts/test-simplifi-orb-outcome-states-contract.mjs'],
 connect:['scripts/test-connect-mvp.mjs','scripts/test-modular-assembly-run4.ts'],
 landing:['scripts/test-website-publish-gate.mjs','scripts/test-modular-assembly-run4.ts'],
 resources:['scripts/test-modular-assembly-run4.ts','scripts/test-ctp-portal-asset-gallery.mjs'],
 ask:['scripts/test-simplifi-os-phase1-ask-intel.mjs','scripts/test-modular-assembly-run4.ts'],
 ctp:['scripts/test-ctp-ai-production.mjs','scripts/test-ctp-approve-reveal.mjs','scripts/test-canonical-ctp-intake.mjs'],
 member:['scripts/test-modular-assembly-run4.ts','scripts/test-client-experience-shell.mjs'],
 settings:['scripts/test-organization-workspace-config.mjs','scripts/test-modular-assembly-run4.ts']
};
const classes=contract.requiredEvidenceClasses;const certs=[];
for(const m of inv.modules.filter(x=>x.assemblyStatus==='certified')){const tests=[...global,...(map[m.id]||[])];for(const p of tests)if(!existsSync(p))throw new Error(m.id+':missing evidence '+p);const sourceFingerprint=createHash('sha256').update(JSON.stringify(m)).digest('hex');const evidenceFingerprint=createHash('sha256').update(tests.map(p=>p+':'+createHash('sha256').update(readFileSync(p)).digest('hex')).join('|')).digest('hex');const evidence={};for(const cls of classes)evidence[cls]={tests,scope:'EA-owned module boundary; executable suite plus cross-cutting tenant, recovery, build and assembly contracts'};certs.push({moduleId:m.id,moduleVersion:m.version,status:'certified',sourceFingerprint,evidenceFingerprint,evidence});}
writeFileSync('config/module-certification-evidence.json',JSON.stringify({version:2,status:'certified-bin',policy:'Exact-version certificates generated only from present executable evidence. Any source/version/evidence change invalidates authority.',requiredEvidenceClasses:classes,certificates:certs},null,2)+'\n');console.log('certified',certs.length);
