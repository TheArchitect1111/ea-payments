import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {writeFileSync,unlinkSync} from 'node:fs';
import {NextRequest} from 'next/server.js';
const artifact='scripts/.cigar-calendly-connection-bundle.mjs';
const ports={
 '@/lib/api/admin-route':`export async function guardAdminApi(){return {ok:false,status:401,error:'Admin authentication required.'}};export const adminApiUnauthorized=x=>Response.json({ok:false,error:x.error},{status:x.status});`,
 '@/lib/data/airtable-client':`export const airtableConfigured=()=>true;export const airtableUpdate=()=>{throw Error('Unauthorized request must not update records')};export const airtableQuery=()=>{throw Error('Unauthorized request must not read records')};`,
 '@/app/api/cigar-ctp/calendly/webhook/route':`export const POST=()=>{throw Error('Unauthorized request must not write a booking')};`,
};
const bundle=await build({stdin:{contents:"export * from './lib/cigar-ctp/calendly-connection';export * from './lib/cigar-ctp/calendly-signature';export {GET,POST} from './app/api/admin/cigar-ctp/calendly-connection/route';",resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'esm',packages:'external',plugins:[{name:'boundary-ports',setup(p){
 p.onResolve({filter:/.*/},a=>Object.hasOwn(ports,a.path)?{path:a.path,namespace:'port'}:undefined);
 p.onLoad({filter:/.*/,namespace:'port'},a=>({contents:ports[a.path],loader:'js'}));
}}]});
writeFileSync(artifact,bundle.outputFiles[0].text);const api=await import('./.cigar-calendly-connection-bundle.mjs');unlinkSync(artifact);
process.env.VERCEL_ENV='preview';delete process.env.CIGAR_CALENDLY_API_TOKEN;delete process.env.CIGAR_CALENDLY_WEBHOOK_SIGNING_KEY;
assert.equal(api.cigarCalendlySigningKey(),'');
assert.match(api.cigarCallbackUrl(),/^https:\/\/ea-payments-git-feature-fc911c-the-architects-projects-cc813778\.vercel\.app\/api\/cigar-ctp\/calendly\/webhook$/);
let calls=0;
await assert.rejects(api.findCigarBooking('qa@example.test','unused',async()=>{calls++;throw Error('Should not reach provider');}),/Save CIGAR_CALENDLY_API_TOKEN/);
assert.equal(calls,0);
process.env.CIGAR_CALENDLY_API_TOKEN='unit-test-noncredential';
const previewKey=api.cigarCalendlySigningKey();assert.equal(previewKey.length,64);
process.env.VERCEL_ENV='production';assert.notEqual(api.cigarCalendlySigningKey(),previewKey);
assert.equal(api.cigarCallbackUrl(),'https://app.efficiencyarchitects.online/api/cigar-ctp/calendly/webhook');
process.env.VERCEL_ENV='preview';
const account={uri:'https://api.calendly.com/users/UNIT_TEST_ACCOUNT',current_organization:'https://api.calendly.com/organizations/UNIT_TEST_ORG',scheduling_url:'https://calendly.com/freedom-efficiencyarchitects'};
await assert.rejects(api.connectCigarCalendly(async()=>Response.json({resource:{...account,scheduling_url:'https://calendly.com/another-account'}})),/different Calendly scheduling account/);
await assert.rejects(api.connectCigarCalendly(async()=>{throw Error('unit-test-noncredential secret should never be returned');}),error=>!error.message.includes('unit-test-noncredential')&&/could not be reached/.test(error.message));
await assert.rejects(api.connectCigarCalendly(async()=>Response.json({message:'unit-test-noncredential'},{status:403})),error=>!error.message.includes('unit-test-noncredential')&&/403/.test(error.message));
const seen=[];
const noBookings=await api.findCigarBooking('qa@example.test','unused',async(url,init)=>{
 const u=new URL(url);seen.push(u.pathname);
 assert.equal(u.origin,'https://api.calendly.com');assert.equal(init.redirect,'error');
 if(u.pathname==='/users/me')return Response.json({resource:account});
 assert.equal(u.searchParams.get('invitee_email'),'qa@example.test');
 return Response.json({collection:[],pagination:{next_page_token:null}});
});
assert.equal(noBookings,null);assert.deepEqual(seen,['/users/me','/scheduled_events']);
let registeredBody;
await assert.rejects(api.connectCigarCalendly(async(url,init)=>{
 const u=new URL(url);
 if(u.pathname==='/users/me')return Response.json({resource:account});
 if(init.method!=='POST')return Response.json({collection:[]});
 registeredBody=JSON.parse(init.body);
 return Response.json({resource:{state:'active',callback_url:registeredBody.url}});
}),/did not confirm/);
assert.equal(registeredBody.scope,'user');assert.deepEqual(registeredBody.events,['invitee.created','invitee.canceled']);assert.equal(registeredBody.signing_key,previewKey);
// Missing provider identifiers above are rejected; no provider IDs are invented as evidence.
const request=new NextRequest('https://example.test/api/admin/cigar-ctp/calendly-connection');
assert.equal((await api.GET(request)).status,401);
assert.equal((await api.POST(new NextRequest(request.url,{method:'POST',body:'{}'}))).status,401);
console.log('PASS: admin boundaries, missing-token rejection, environment-specific signatures, account ownership, fixed provider origins, no redirects, secret-safe failures, real-provider-proof requirement, and unmatched-booking rejection');
