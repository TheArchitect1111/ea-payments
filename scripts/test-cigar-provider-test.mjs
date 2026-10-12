import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {writeFileSync,unlinkSync} from 'node:fs';
import {NextRequest} from 'next/server.js';
globalThis.__cigarProviderTestAuth=false;
const mocks={
 '@/lib/api/admin-route':`export async function guardAdminApi(){return globalThis.__cigarProviderTestAuth?{ok:true}:{ok:false,status:401,error:'Admin authentication required.'}};export const adminApiUnauthorized=x=>Response.json({ok:false,error:x.error},{status:x.status});`,
 '@/lib/data/airtable-client':`export const airtableConfigured=()=>true;export const airtableCreate=()=>{throw Error('Rejected request must not write storage')};export const airtableUpdate=airtableCreate;`,
 '@ea/portal-chassis/email':`export const sendEmail=()=>{throw Error('Rejected request must not send mail')};`,
};
const bundle=await build({stdin:{contents:"export {POST as submit} from './app/api/cigar-ctp/submit/route';export {POST as providerTest} from './app/api/admin/cigar-ctp/provider-test/route';export * from './lib/cigar-ctp/provider-test';",resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'esm',packages:'external',plugins:[{name:'test-ports',setup(p){
 p.onResolve({filter:/.*/},a=>Object.hasOwn(mocks,a.path)?{path:a.path,namespace:'test-port'}:undefined);
 p.onLoad({filter:/.*/,namespace:'test-port'},a=>({contents:mocks[a.path],loader:'js'}));
}}]});
const artifact='scripts/.cigar-provider-test-bundle.mjs';
writeFileSync(artifact,bundle.outputFiles[0].text);
const api=await import('./.cigar-provider-test-bundle.mjs');unlinkSync(artifact);
const path='/api/admin/cigar-ctp/provider-test';
assert.equal(api.isCigarProviderTestRequest('production',path),false);
assert.equal(api.isCigarProviderTestRequest('preview','/api/cigar-ctp/submit'),false);
assert.equal(api.isCigarProviderTestRequest('preview',path),true);
assert.equal(api.isCigarTestRecord({businessName:'TEST Brand',contactName:'TEST Owner'}),true);
assert.equal(api.isCigarTestRecord({businessName:'TEST Brand',contactName:'Real Owner'}),false);
assert.equal(api.isCigarTestRecord({businessName:'TESTING',contactName:'TEST Owner'}),false);
const request=(url,body)=>new NextRequest('https://example.test'+url,{method:'POST',headers:{origin:'https://example.test',host:'example.test','content-type':'application/json'},body:JSON.stringify(body??{})});
process.env.VERCEL_ENV='production';
assert.equal((await api.providerTest(request(path))).status,404);
process.env.VERCEL_ENV='preview';process.env.CIGAR_CTP_LIVE_SUBMISSIONS_ENABLED='true';
assert.equal((await api.submit(request('/api/cigar-ctp/submit'))).status,503);
assert.equal((await api.providerTest(request(path))).status,401);
globalThis.__cigarProviderTestAuth=true;
assert.equal((await api.providerTest(request(path,{testOnly:true,businessName:'TEST Brand',contactName:'Real Owner'}))).status,400);
assert.equal((await api.providerTest(request(path,{businessName:'TEST Brand',contactName:'TEST Owner'}))).status,400);
console.log('PASS: production QA hidden, preview customer intake blocked, admin required, TEST names and testOnly enforced; zero provider calls');
