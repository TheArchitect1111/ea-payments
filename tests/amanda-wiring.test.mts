import {eventsToday} from '../lib/amanda-catherine/engagement';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {writeFileSync,unlinkSync,readFileSync,readdirSync} from 'node:fs';
import ts from 'typescript';
import {amandaCtaKey,amandaClickScope,isAmandaSource} from '../lib/amanda-catherine/tracking';
import {amandaApplicationIdentity,amandaApplicationsForQueue} from '../lib/amanda-catherine/queues';
const state={clicks:[] as any[],leads:[] as any[],paid:[] as any[]};(globalThis as any).__amandaWiring=state;
const fixture=await build({stdin:{contents:"export * from './app/api/amanda-catherine/track/route';export * from './lib/amanda-catherine/brick-events';export * from './lib/amanda-catherine/payments';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',packages:'external',write:false,
plugins:[{name:'durable-sink-fixture',setup(b){b.onResolve({filter:/^@\/lib\/services\/trackingPortal$/},a=>({path:a.path,namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:`export async function storeBrickInteraction(e){const s=globalThis.__amandaWiring;if(!s.clicks.some(x=>x.event_id===e.event_id))s.clicks.push(e);return {id:e.event_id};}export async function pushToTrackingPortal(e){globalThis.__amandaWiring.leads.push(e);return {ok:true};}export async function confirmTrackingPayment(e){globalThis.__amandaWiring.paid.push(e);return {ok:true};}export async function getTestTrackingRegistration(){return null;}export async function enqueueTrackingPortalRetry(){return false;}`,loader:'js'}));}}]});
const file='tests/.amanda-wiring-fixture.mjs';writeFileSync(file,fixture.outputFiles[0].text);const api=await import('./.amanda-wiring-fixture.mjs');unlinkSync(file);
const click={event:'cta_click',portal_slug:'amanda-catherine',event_id:crypto.randomUUID(),visitor_id:crypto.randomUUID(),cta_key:'explore-restore',cta_name:'Explore Restore',page:'/',destination:'https://amandacatherine.ca/amanda/restore',timestamp:new Date().toISOString()};
function request(body:any,origin='https://amandacatherine.ca'){return new Request('https://ea-payments.vercel.app/api/amanda-catherine/track',{method:'POST',headers:{origin,'content-type':'application/json','x-forwarded-for':crypto.randomUUID()},body:JSON.stringify(body)});}
test('homepage and Classes clicks validate, reach registrar, replay without duplicate and do not create leads',async()=>{
 process.env.VERCEL_ENV='production';
 for(const c of [click,{...click,event_id:crypto.randomUUID(),page:'/portal/amanda-catherine/classes',cta_key:'join-waitlist-nervous-system-reset',cta_name:'Join Waitlist',course_key:'nervous-system-reset'}]){
 assert.equal((await api.POST(request(c))).status,200);assert.equal((await api.POST(request(c))).status,200);
 }
 assert.equal(state.clicks.length,2);assert.equal(state.leads.length,0);assert.equal(state.paid.length,0);
 assert.equal(state.clicks[0].event,'amanda:homepage:explore-restore');assert.equal(state.clicks[1].event,'amanda:classes:join-waitlist-nervous-system-reset');
 assert.equal((await api.POST(request({...click,page:'/portal/tarris/classes'}))).status,400);
 assert.equal((await api.POST(request({...click,cta_key:'Enroll Now'}))).status,400);
 assert.equal((await api.POST(request({...click,destination:'javascript:alert(1)'}))).status,400);
 assert.equal((await api.POST(request(click,'https://attacker.example'))).status,403);
 assert.equal((await api.POST(request({...click,email:'person@example.com'}))).status,400);
});
test('normalization never produces invalid long CTA keys and source scopes stay tenant bound',()=>{
 for(const x of ['Enroll Now — Clinical Fat Loss','Ämanda!','a'.repeat(99)+' -- last'])assert.match(amandaCtaKey(x),/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
 assert.equal(amandaClickScope('/amanda/restore'),'pathway');assert.equal(isAmandaSource('/amanda-imposter'),false);
});
test('named and legacy application identities resolve to the correct owner queue',()=>{
 assert.deepEqual(amandaApplicationIdentity('amanda-apply','founder-advisory',''),{formId:'founder-advisory',ownerQueue:'advisory'});
 assert.equal(amandaApplicationIdentity('speaking-media','','').ownerQueue,'speaking');
 assert.deepEqual(amandaApplicationIdentity('partner-vendor-application','',''),{formId:'partner-vendor-application',ownerQueue:'lifeline',program:'lifeline'});
 assert.throws(()=>amandaApplicationIdentity('other-tenant','',''));
});
test('Stripe payment keeps signup identity, rejects unpaid and other tenants, isolates preview',async()=>{
 const id=crypto.randomUUID();await api.registerAmandaCheckout({registrationId:id,brickId:'kit',name:'Kit Customer',email:'kit@example.com',source:'/kit'});
 const session={id:'cs_unit',payment_status:'paid',payment_intent:'pi_unit',metadata:{portalSlug:'amanda-catherine',registrationId:id,clientName:'Kit Customer',clientEmail:'kit@example.com'}};
 await api.recordAmandaVerifiedPayment(session,'kit');assert.equal(state.paid.at(-1).registration_id,state.leads.at(-1).registration_id);
 const before=state.paid.length;await assert.rejects(api.recordAmandaVerifiedPayment({...session,payment_status:'unpaid'},'kit'));await assert.rejects(api.recordAmandaVerifiedPayment({...session,metadata:{...session.metadata,portalSlug:'tarris'}},'kit'));assert.equal(state.paid.length,before);
 process.env.VERCEL_ENV='preview';await api.recordAmandaVerifiedPayment(session,'kit');assert.equal(state.paid.at(-1).is_test,true);process.env.VERCEL_ENV='production';
});
test('every Amanda public/HQ source CTA has explicit identity; no permanently disabled billing control',()=>{
 const files:string[]=[];function walk(p:string){for(const x of readdirSync(p,{withFileTypes:true})){const q=p+'/'+x.name;if(x.isDirectory())walk(q);else if(q.endsWith('.tsx'))files.push(q);}}
 ['app/amanda-catherine','app/amanda','app/portal/amanda-catherine','app/components/amanda'].forEach(walk);
 let total=0;for(const file of files){const source=ts.createSourceFile(file,readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);function visit(n:ts.Node){if(ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n)){if(['a','Link','button'].includes(n.tagName.getText(source)) && !(ts.isJsxOpeningElement(n) && n.attributes.properties.some(x => ts.isJsxAttribute(x) && ((x.name.getText(source)==='className' && x.initializer?.getText(source).includes('ac-skip-link')) || (file==='app/amanda/page.tsx' && x.name.getText(source)==='onClick' && x.initializer?.getText(source).includes('markComplete')))))){total++;const attrs=n.attributes.properties.map(x=>(x as ts.JsxAttribute).name?.getText(source));if(attrs.includes('data-cta-name')||attrs.includes('data-cta-key')) assert.ok(attrs.includes('data-cta-name')&&attrs.includes('data-cta-key'),file+': incomplete tracked CTA identity');}}ts.forEachChild(n,visit);}visit(source);}assert.ok(total>100);
 const billing=readFileSync('app/portal/[slug]/billing/AmandaPayments.tsx','utf8');assert.ok(billing.includes('/portal/amanda-catherine/billing/setup'));assert.ok(!billing.includes('disabled style')&&!billing.includes('|| !membership.available'));
});

test('live click persistence uses Amanda registry, atomically upserts event identity and enriches course interest',async()=>{
 const writes:any[]=[];(globalThis as any).__amandaClickWrites=writes;
 const code=await build({stdin:{contents:"export {storeBrickInteraction} from './lib/services/trackingPortal';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',packages:'external',write:false,plugins:[{name:'registry-store',setup(b){b.onResolve({filter:/^@\/lib\/amanda-catherine\/registry$/},a=>({path:a.path,namespace:'registry-fixture'}));b.onLoad({filter:/.*/,namespace:'registry-fixture'},()=>({contents:`export async function registry(){return {courses:[{key:'nervous-system-reset',title:'Nervous System Reset',price:null,square_checkout_url:null}]};}export async function table(){return {id:'amanda-business-table',fields:['Title','CTA Name','Source Page','Timestamp','Status','Portal','Portal Slug','Event','Payload JSON','Course Key','Course Name','Price','Square URL'].map(name=>({id:name,name}))};}export async function airtable(path,init){const body=JSON.parse(init.body);globalThis.__amandaClickWrites.push({path,...body});return {records:[{id:'rec-click'}]};}`,loader:'js'}));}}]});
 const file='tests/.amanda-click-store.mjs';writeFileSync(file,code.outputFiles[0].text);const store=await import('./.amanda-click-store.mjs');unlinkSync(file);
 const event={event_type:'interaction',client_id:'amanda-catherine',event_id:click.event_id,visitor_id:click.visitor_id,event:'amanda:classes:join-waitlist',cta_key:'join-waitlist',cta_name:'Join Waitlist',source:'/portal/amanda-catherine/classes',destination:'/courses/nervous-system-reset',timestamp:click.timestamp,is_test:false,course_key:'nervous-system-reset'};
 await store.storeBrickInteraction(event);await store.storeBrickInteraction(event);
 assert.ok(writes.every(w=>w.path==='$base/amanda-business-table'));assert.deepEqual(writes[0].performUpsert,{fieldsToMergeOn:['Title']});assert.equal(writes[0].records[0].fields.Title,writes[1].records[0].fields.Title);assert.equal(writes[0].records[0].fields['Course Name'],'Nervous System Reset');
 await assert.rejects(store.storeBrickInteraction({...event,course_key:'foreign-course'}));assert.equal(writes.length,2);
});

test('portal enrollment metrics include canonical Enroll Now labels',()=>{
 const base={id:'click',title:'Enroll',sourcePage:'/',timestamp:new Date().toISOString(),courseName:'Course',courseKey:'course',price:null,squareUrl:'',payload:''};
 assert.equal(eventsToday([{...base,ctaName:'Enroll'},{...base,ctaName:'Enroll Now'},{...base,ctaName:'Join Waitlist'}],'UTC','Enroll').length,2);
});

test('every application identity appears in its owner queue, including legacy Foundry and general applications',()=>{
 const applications=[{payload:{formId:'founder-advisory'}},{payload:{formId:'speaking-media'}},{payload:{formId:'partner-vendor-application'}},{payload:{formId:'amanda-apply',context:'foundry'}},{payload:{formId:'amanda-apply'}},{payload:{formId:'foreign-form'}}];
 assert.equal(amandaApplicationsForQueue(applications,'advisory').length,1);assert.equal(amandaApplicationsForQueue(applications,'speaking').length,1);assert.equal(amandaApplicationsForQueue(applications,'lifeline').length,1);assert.equal(amandaApplicationsForQueue(applications,'clients').length,2);
});
