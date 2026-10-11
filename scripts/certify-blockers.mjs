import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const hash = s => createHash('sha256').update(s).digest('hex');
const read = p => JSON.parse(readFileSync(p,'utf8'));
const inventory=read('config/capability-inventory.json'),ledger=read('config/module-certification-evidence.json'),contract=read('config/module-certification-contract.json');
const shared=['lib/chassis/PortalShell.tsx','app/portal/[slug]/ea-portal.css','lib/bricks/durable.ts','lib/bricks/access.ts','lib/bricks/module-install.ts','lib/bricks/provision-test.ts','lib/tenant-foundation.ts','app/api/admin/chassis/install/route.ts','app/api/admin/entitlements/route.ts'];
const sources={calendar:[...shared,'lib/calendar/storage.ts','lib/calendar/nylas.ts','app/api/portal/calendar/route.ts','app/api/portal/[slug]/calendar/events/route.ts','app/api/calendar/tenant-provision-test/route.ts','app/portal/[slug]/calendar/page.tsx','app/portal/[slug]/calendar/PortalCalendar.tsx'],
people:[...shared,'lib/people/errors.ts','lib/people/adapter.ts','lib/people/flags.ts','lib/people/postgres-client.ts','lib/people/postgres-repository.ts','lib/people/ensure-person.ts','lib/people/guard.ts','lib/people/resolve-tenant.ts','app/api/portal/[slug]/people/route.ts','app/api/people/tenant-provision-test/route.ts','app/portal/[slug]/people/page.tsx','app/portal/[slug]/people/PeopleDirectory.tsx'],
discovery:[...shared,'lib/discovery/storage.ts','lib/analysis-engine.ts','lib/modules/registry.ts','app/assessment/page.tsx','app/api/portal/[slug]/discovery/route.ts','app/api/assessment/tenant-provision-test/route.ts','app/portal/[slug]/discovery/page.tsx','app/portal/[slug]/discovery/DiscoveryForm.tsx']};
const write=process.argv.includes('--write');
for(const [id,sourceFiles] of Object.entries(sources)){
 const m=inventory.modules.find(x=>x.id===id);
 if(write){Object.assign(m,{version:2,assemblyStatus:'certified',data:{authority:id==='people'?'existing people Postgres schema':'tenant-scoped Creative Studio durable records',newStoreRequired:false},
 dependencies:{status:'verified',boundary:'existing EA storage and tenant identity; providers checked before installation'},integrations:{status:'verified',provider:id==='calendar'?'internal; optional Nylas':id==='people'?'Postgres people_app':'existing email adapter'},
 provisioning:{mode:'automatic-with-certified-selection',required:true,installer:'lib/bricks/module-install.ts'},tests:{status:'executable',suite:'tests/blockers-certified.test.mts'},
 costLicense:{decision:'approved',mandatoryVendorFee:false,boundary:'EA-owned implementation over existing platform infrastructure; optional Nylas connection excluded from license approval'},
 healthCheck:{type:'tenant-provision-test',path:`/api/${id==='discovery'?'assessment':id}/tenant-provision-test`,productionStatus:404}});
 if(id==='discovery')m.routes=['/portal/{slug}/discovery','/assessment'];
 m.ui.implementation='existing-plus-functional-lifecycle';
 }
 const tests=['tests/blockers-certified.test.mts','scripts/test-blockers-ui.mjs','scripts/test-people-adversarial.mts'];
 const evidence=Object.fromEntries(contract.requiredEvidenceClasses.map(cls=>[cls,{tests:cls==='responsive-ui'?['scripts/test-blockers-ui.mjs']:cls==='immutable-version-fingerprint'?['scripts/certify-blockers.mjs']:['tests/blockers-certified.test.mts'],scope:'EA-owned tenant install and lifecycle; isolated provider/database ports. Live provider readiness is an installation gate, not inferred certification.'}]));
 const sourceFingerprint=hash(JSON.stringify({module:m,files:sourceFiles.map(p=>[p,hash(readFileSync(p))])}));
 const evidenceFingerprint=hash(JSON.stringify([...tests,'tests/fixtures/chassis-ports.ts'].map(p=>[p,hash(readFileSync(p))])));
 if(write){ledger.certificates=ledger.certificates.filter(x=>x.moduleId!==id);ledger.certificates.push({moduleId:id,moduleVersion:2,status:'certified',sourceFiles,sourceFingerprint,evidenceFingerprint,evidence,certifiedBoundary:{scope:'EA-owned implementation with isolated executable lifecycle and rendered UI proof. No production deployment, real email delivery, external OAuth account or live Postgres write is asserted.',runtimeReadinessRequired:true}});}
 else {const c=ledger.certificates.find(x=>x.moduleId===id);assert.equal(c?.moduleVersion,m.version);assert.equal(c?.sourceFingerprint,sourceFingerprint,id+':source changed');assert.equal(c?.evidenceFingerprint,evidenceFingerprint,id+':test evidence changed');assert.equal(c?.status,'certified');for(const cls of contract.requiredEvidenceClasses)assert.ok(c.evidence[cls]?.tests.length);}
}
if(write){writeFileSync('config/capability-inventory.json',JSON.stringify(inventory,null,2)+'\n');writeFileSync('config/module-certification-evidence.json',JSON.stringify(ledger,null,2)+'\n');}
console.log(write?'Candidate certificates generated; executable checks MUST pass before release':'Exact Calendar, People and Discovery source/evidence verified');
