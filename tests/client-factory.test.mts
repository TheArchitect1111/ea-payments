import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp, mkdir, writeFile, readFile, cp, symlink, rm} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
const root=process.cwd();
const compiled=await build({entryPoints:[resolve(root,'lib/services/brickRegistrar.ts')],bundle:true,write:false,platform:'node',format:'esm',packages:'external',plugins:[{name:'transport',setup(b){b.onResolve({filter:/services\/trackingPortal$/},()=>({path:'transport',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:`export async function pushToTrackingPortal(e){return {id:e.client_id}};export async function confirmTrackingPayment(){return {}};export async function enqueueTrackingPortalRetry(){};export async function getTestTrackingRegistration(){return null};`,loader:'js'}));}}]});
async function fixture(){
 const dir=await mkdtemp(join(root,'tests/.factory-'));
 await mkdir(join(dir,'lib/services'),{recursive:true});await mkdir(join(dir,'lib/clients'),{recursive:true});await mkdir(join(dir,'scripts'));
 await writeFile(join(dir,'lib/services/brickRegistrar.ts'),compiled.outputFiles[0].text);
 await writeFile(join(dir,'lib/clients/registry.json'),'{}\n');
 await cp(join(root,'scripts/new-client.mjs'),join(dir,'scripts/new-client.mjs'));
 await writeFile(join(dir,'scripts/guard-brick-chassis.mjs'),"console.log('fixture guard passed')\n");
 await symlink(join(root,'node_modules'),join(dir,'node_modules'),'dir');
 const git=(...args:string[])=>execFileSync('git',args,{cwd:dir,encoding:'utf8'}).trim();
 git('init','-b','factory-test');git('config','user.email','test@example.com');git('config','user.name','Factory Test');
 await writeFile(join(dir,'.gitignore'),'node_modules\n');git('add','.');git('commit','-m','fixture');
 return {dir,git,run:(name:string)=>spawnSync(process.execPath,['scripts/new-client.mjs',name],{cwd:dir,encoding:'utf8'}),cleanup:()=>rm(dir,{recursive:true,force:true})};
}
test('one command creates branch, folder and shared tracking/event registration',async()=>{const f=await fixture();try{const r=f.run('Élite Client');assert.equal(r.status,0,r.stderr);assert.equal(f.git('branch','--show-current'),'client/elite-client');const config=JSON.parse(await readFile(join(f.dir,'lib/clients/registry.json'),'utf8'));assert.equal(config['elite-client'].name,'Élite Client');assert.equal(config['elite-client'].portalPath,'/portal/elite-client');assert.match(await readFile(join(f.dir,'lib/clients/elite-client/brick-events.ts'),'utf8'),/registerClientEvent\("elite-client"/);assert.match(r.stdout,/filesCreated/);}finally{await f.cleanup();}});
test('duplicate branch is rejected without overwriting client identity',async()=>{const f=await fixture();try{assert.equal(f.run('Client').status,0);f.git('add','.');f.git('commit','-m','client');const before=await readFile(join(f.dir,'lib/clients/registry.json'),'utf8');assert.notEqual(f.run('Client').status,0);assert.equal(await readFile(join(f.dir,'lib/clients/registry.json'),'utf8'),before);}finally{await f.cleanup();}});
test('dirty tree and unusable names do not create branches or files',async()=>{const f=await fixture();try{assert.notEqual(f.run('!!!').status,0);await writeFile(join(f.dir,'dirty.txt'),'preserve');assert.notEqual(f.run('New Client').status,0);assert.equal(f.git('branch','--show-current'),'factory-test');assert.equal(await readFile(join(f.dir,'lib/clients/registry.json'),'utf8'),'{}\n');}finally{await f.cleanup();}});
test('registered client event reaches canonical registrar with tenant identity and payment checks',async()=>{
 const result=await build({stdin:{contents:`export * from './lib/tb3/brick-events';`,resolveDir:root},bundle:true,write:false,platform:'node',format:'esm',packages:'external',plugins:[{name:'ports',setup(b){b.onResolve({filter:/clients\/registry.json$/},()=>({path:'registry',namespace:'mock'}));b.onLoad({filter:/registry/,namespace:'mock'},()=>({contents:'export default {"new-client":{name:"New Client",slug:"new-client",portalPath:"/portal/new-client",eventAdapter:"adapter"}}',loader:'js'}));b.onResolve({filter:/services\/trackingPortal$/},()=>({path:'transport',namespace:'transport'}));b.onLoad({filter:/.*/,namespace:'transport'},()=>({contents:`export async function pushToTrackingPortal(e){return {id:e.client_id}};export async function confirmTrackingPayment(){return {}};export async function enqueueTrackingPortalRetry(){};export async function getTestTrackingRegistration(){return null};`,loader:'js'}));}}]});
 const path=join(root,'tests/.factory-adapter.mjs');await writeFile(path,result.outputFiles[0].text);try{const api=await import(path);const event={brick_type:'forms',brick_id:'intake',registration_id:'registration-1',name:'Person',email:'person@example.com',phone:'',status:'submitted',payment_status:'unpaid',payment_reference:null,timestamp:new Date().toISOString(),source:'intake',is_test:true};assert.deepEqual(await api.registerClientEvent('new-client',event),{ok:true,id:'new-client'});assert.equal((await api.registerClientEvent('unknown',event)).ok,false);assert.equal((await api.registerClientEvent('new-client',{...event,status:'payment_confirmed',payment_status:'paid',payment_reference:'unverified'})).ok,false);}finally{await rm(path,{force:true});}
});
test('guard scans factory client directory and rejects direct transport bypass',()=>{const s=execFileSync(process.execPath,['scripts/guard-brick-chassis.mjs','--self-test'],{cwd:root,encoding:'utf8'});assert.match(s,/PASS/);assert.match(requireSource(),/'lib\/clients'/);});
function requireSource(){return execFileSync(process.execPath,['-e',"process.stdout.write(require('fs').readFileSync('scripts/guard-brick-chassis.mjs','utf8'))"],{cwd:root,encoding:'utf8'});}
