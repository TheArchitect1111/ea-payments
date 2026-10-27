#!/usr/bin/env node
/**
 * Configure non-secret EA Stripe Connect preview settings through the
 * already authenticated Vercel CLI. Do not use for production or secrets.
 * Run: node scripts/setup-ea-connect-preview.mjs
 */
import { spawnSync } from 'node:child_process';
const scope='the-architects-projects-cc813778';
const branch='work/ea-stripe-connect-onboarding-20261025';
const project='ea-payments';
const run=(args,input)=>{
 const r=spawnSync(process.platform==='win32'?'npx.cmd':'npx',
  ['--yes','vercel',...args,'--scope',scope],{
   encoding:'utf8',input,
   shell:process.platform==='win32',
   stdio:input===undefined?'pipe':['pipe','pipe','pipe'],timeout:45000,
 });
 if(r.status!==0)throw new Error((r.stderr||r.stdout||'Vercel CLI failed').slice(0,600));
 return r.stdout;
};
const who=run(['whoami']).trim();
if(!who)throw new Error('Vercel CLI is not authenticated');
const rows=[
 ['EA_MERCHANT_DB_URL','https://dwygvwnjjaennksddniu.supabase.co'],
 ['EA_STRIPE_CONNECT_ONBOARDING_ENABLED','false'],
 ['EA_STRIPE_CONNECT_USE_EXISTING_TEST_KEY','true']
];
for(const [key,value] of rows){
 try{
  // Do not overwrite an existing value. Exact branch-scoped preview only.
  run(['env','add',key,'preview',branch],value+'\n');
  console.log('Added '+key+' to isolated preview branch');
 }catch(error){
  if(/already exists|already been added|duplicate/i.test(error.message)) {
   console.log('Existing '+key+' left unchanged');
  } else {
   console.error('Could not add '+key+'. '+error.message);
   process.exitCode=1;
  }
 }
}
console.log('Live payment activation remains disabled. Secret credentials were not read or written.');
