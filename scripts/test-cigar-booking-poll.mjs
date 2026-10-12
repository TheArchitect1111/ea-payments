import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {writeFileSync,unlinkSync} from 'node:fs';
import {NextRequest} from 'next/server.js';
const artifact='scripts/.cigar-booking-poll-bundle.mjs';
// Offline fixtures reuse observed TEST booking identifiers. These are not new live proof.
const submission='CIGAR-bbe7d721-ff23-4b07-b1bc-2941f925ad6d';
const eventUri='https://api.calendly.com/scheduled_events/9b0b2d7f-6f4d-4976-a7e5-8a142cd328c2';
const inviteeUri=eventUri+'/invitees/06d898b0-6038-417a-84a8-6783e381c0d6';
const record={id:'rectwRfaIFmHt2owC',fields:{'Submission ID':submission,'Business Name':'TEST brand Cigar Business','Contact Name':'TEST Owner',Email:'brickmail1@gmail.com','Email Status':'sent','Workflow Status':'emailed'}};
globalThis.cigarPollTest={records:[record],writes:[],sends:0,queries:[]};
const ports={
 '@/lib/data/airtable-client':`export const airtableConfigured=()=>true;export const escapeAirtableString=x=>x.replace(/'/g,"\\\\'");export async function airtableQuery(table,options){if(table!=='Cigar CTP Lead Intake')throw Error('Wrong table');globalThis.cigarPollTest.queries.push(options);return globalThis.cigarPollTest.records;}export async function airtableUpdate(table,id,fields){if(table!=='Cigar CTP Lead Intake')throw Error('Wrong table');const r=globalThis.cigarPollTest.records.find(x=>x.id===id);Object.assign(r.fields,fields);globalThis.cigarPollTest.writes.push(fields);return r;}`,
};
const bundle=await build({stdin:{contents:"export {syncCigarRecords,pollCigarBookings} from './lib/cigar-ctp/booking-sync';export {GET} from './app/api/cron/cigar-ctp-bookings/route';",resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'esm',packages:'external',plugins:[{name:'test-store',setup(p){p.onResolve({filter:/.*/},a=>Object.hasOwn(ports,a.path)?{path:a.path,namespace:'port'}:undefined);p.onLoad({filter:/.*/,namespace:'port'},a=>({contents:ports[a.path],loader:'js'}));}}]});
writeFileSync(artifact,bundle.outputFiles[0].text);const api=await import('./.cigar-booking-poll-bundle.mjs');unlinkSync(artifact);
Object.assign(process.env,{VERCEL_ENV:'preview',CIGAR_CTP_LIVE_SUBMISSIONS_ENABLED:'true',CIGAR_CALENDLY_API_TOKEN:'unit-test-noncredential',RESEND_API_KEY:'unit-test-noncredential',RESEND_FROM_EMAIL:'qa@example.test'});
let status='active';let wrongTracking=false;
const account={uri:'https://api.calendly.com/users/UNIT_TEST_ACCOUNT',current_organization:'https://api.calendly.com/organizations/UNIT_TEST_ORG',scheduling_url:'https://calendly.com/freedom-efficiencyarchitects'};
const event=()=>({uri:eventUri,event_type:'offline-fixture',start_time:'2026-10-13T13:00:00.000Z',end_time:'2026-10-13T13:15:00.000Z',status,event_memberships:[{user:account.uri}]});
const invitee=()=>({uri:inviteeUri,email:record.fields.Email,status,tracking:{utm_source:'ea-cigar-ctp',utm_content:wrongTracking?'unmatched':submission}});
const originalFetch=globalThis.fetch;
globalThis.fetch=async(url,init)=>{
 const u=new URL(url);
 if(u.origin==='https://api.resend.com'){globalThis.cigarPollTest.sends++;assert.match(init.headers['Idempotency-Key'],/^cigar-confirmation\/[a-f0-9]{64}$/);return Response.json({id:'01a13230-b8ae-7998-8aed-d9c123e113f7'});}
 assert.equal(u.origin,'https://api.calendly.com');assert.equal(init.redirect,'error');
 if(u.pathname==='/users/me')return Response.json({resource:account});
 if(u.pathname===new URL(eventUri).pathname)return Response.json({resource:event()});
 if(u.pathname===new URL(inviteeUri).pathname)return Response.json({resource:invitee()});
 if(u.pathname==='/scheduled_events')return Response.json({collection:status==='active'?[event()]:[]});
 if(u.pathname.endsWith('/invitees'))return Response.json({collection:[invitee()]});
 throw Error('Unexpected provider path');
};
try{
 assert.equal((await api.GET(new NextRequest('https://example.test/api/cron/cigar-ctp-bookings'))).status,401);
 process.env.CRON_SECRET='unit-cron-secret';
 const cron=()=>new NextRequest('https://example.test/api/cron/cigar-ctp-bookings',{headers:{authorization:'Bearer unit-cron-secret'}});
 assert.equal((await (await api.GET(cron())).json()).enabled,false);
 await assert.rejects(api.syncCigarRecords([{...record,fields:{...record.fields,'Business Name':'Real customer'}}]),/TEST/);
 const first=await api.pollCigarBookings();assert.equal(first.ok,true);assert.equal(record.fields['Workflow Status'],'scheduled');assert.equal(globalThis.cigarPollTest.sends,1);assert.ok(record.fields['Booking Checked At']);assert.ok(record.fields['Meeting Confirmed At']);
 await api.pollCigarBookings();assert.equal(globalThis.cigarPollTest.sends,1);
 wrongTracking=true;const wrong=await api.pollCigarBookings();assert.equal(wrong.ok,false);assert.equal(record.fields['Workflow Status'],'scheduled');assert.match(record.fields['Booking Sync Error'],/does not match/);wrongTracking=false;
 status='canceled';const canceled=await api.pollCigarBookings();assert.equal(canceled.ok,true);assert.equal(record.fields['Workflow Status'],'emailed');assert.equal(record.fields['Booking Status'],'canceled');assert.equal(record.fields['Calendly Invitee URI'],'');assert.equal(globalThis.cigarPollTest.sends,1);
 status='active';await api.pollCigarBookings();assert.equal(record.fields['Workflow Status'],'scheduled');
 record.fields['Workflow Status']='completed';const before=globalThis.cigarPollTest.writes.length;await api.syncCigarRecords([record]);assert.equal(globalThis.cigarPollTest.writes.length,before);assert.equal(record.fields['Workflow Status'],'completed');
 process.env.VERCEL_ENV='production';process.env.CIGAR_CTP_LIVE_SUBMISSIONS_ENABLED='false';assert.equal((await (await api.GET(cron())).json()).enabled,false);
 console.log('PASS: protected cron, Preview TEST isolation, real-provider matching, scheduled writeback, repeat suppression, cancellation, rebooking, completed preservation, and fair polling timestamps (offline fixtures only)');
}finally{globalThis.fetch=originalFetch;}
