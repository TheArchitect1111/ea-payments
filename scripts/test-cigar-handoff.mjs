import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {writeFileSync,unlinkSync} from 'node:fs';
import {NextRequest} from 'next/server.js';
const artifact='scripts/.cigar-handoff-bundle.mjs';
globalThis.handoffFixture={authorized:false,record:{id:'rectwRfaIFmHt2owC',fields:{'Business Name':'TEST brand Cigar Business','Contact Name':'TEST Owner','Workflow Status':'scheduled','Booking Status':'active','Meeting Ends At':new Date(Date.now()+3600000).toISOString()}}};
const ports={
'@/lib/api/admin-route':`export async function guardAdminApi(){return globalThis.handoffFixture.authorized?{ok:true}:{ok:false,status:401}};export const adminApiUnauthorized=x=>Response.json({ok:false},{status:x.status});`,
'@/lib/data/airtable-client':`export const airtableConfigured=()=>true;export async function airtableQuery(t){if(t!=='Cigar CTP Lead Intake')throw Error('wrong table');return [globalThis.handoffFixture.record]};export async function airtableUpdate(t,id,f){if(t!=='Cigar CTP Lead Intake')throw Error('wrong table');Object.assign(globalThis.handoffFixture.record.fields,f);return globalThis.handoffFixture.record;}`};
const bundle=await build({stdin:{contents:"export {POST,GET} from './app/api/admin/cigar-ctp/handoff/route';",resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'esm',packages:'external',plugins:[{name:'isolated-handoff',setup(p){p.onResolve({filter:/.*/},a=>Object.hasOwn(ports,a.path)?{path:a.path,namespace:'port'}:undefined);p.onLoad({filter:/.*/,namespace:'port'},a=>({contents:ports[a.path],loader:'js'}));}}]});
writeFileSync(artifact,bundle.outputFiles[0].text);const api=await import('./.cigar-handoff-bundle.mjs');unlinkSync(artifact);
const req=(action='complete')=>new NextRequest('https://example.test/api/admin/cigar-ctp/handoff',{method:'POST',body:JSON.stringify({action,recordId:'rectwRfaIFmHt2owC'})});
assert.equal((await api.POST(req('complete-test'))).status,401);globalThis.handoffFixture.authorized=true;
assert.equal((await api.POST(req())).status,409);
assert.equal((await api.POST(req('complete-test'))).status,200);
assert.equal(globalThis.handoffFixture.record.fields['Workflow Status'],'completed');
assert.equal(globalThis.handoffFixture.record.fields['Meeting Completed At'],undefined);
assert.equal((await (await api.POST(req('complete-test'))).json()).alreadyCompleted,true);
Object.assign(globalThis.handoffFixture.record.fields,{'Business Name':'Customer business','Contact Name':'Customer','Workflow Status':'scheduled'});
assert.equal((await api.POST(req('complete-test'))).status,403);assert.equal((await api.POST(req())).status,409);
globalThis.handoffFixture.record.fields['Meeting Ends At']=new Date(Date.now()-1000).toISOString();assert.equal((await api.POST(req())).status,200);assert.ok(globalThis.handoffFixture.record.fields['Meeting Completed At']);
const response=await api.GET(new NextRequest('https://example.test/api/admin/cigar-ctp/handoff'));assert.equal((await response.json()).leads[0].isTest,false);
console.log('PASS: admin required, TEST-only manual completion, no invented attendance timestamp, replay handling, customer override rejection and ended-meeting guard');
