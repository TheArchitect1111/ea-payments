import { z } from 'zod';
import { brickHash, readBrickRecord, writeBrickRecord, type BrickTenant } from './durable';
import { loadTenantInstall } from '@/lib/modules/tenant-install';
export const FinalKind=z.enum(['pulse','amplifi','update-hub','messaging','training','landing','ask','settings','ctp']);
export type FinalKind=z.infer<typeof FinalKind>;
const Schema=z.object({key:z.string().regex(/^[a-z0-9-]{1,80}$/),title:z.string().trim().min(1).max(150),
 body:z.string().max(25000),visibility:z.enum(['member','staff']).default('member'),
 state:z.enum(['draft','submitted','delivered','responded','published','enrolled','in_progress','completed','ready']).default('draft'),
 reply:z.string().max(5000).optional(),progress:z.number().int().min(0).max(100).optional(),
 channel:z.string().max(100).optional(),source:z.string().max(150).optional()}).strict();
type FinalRecord=BrickTenant & z.infer<typeof Schema> & {id:string;kind:FinalKind;version:1};
type Role='staff'|'member';
const idOf=(t:BrickTenant,k:FinalKind,key:string)=>'final-'+brickHash([t.organizationId,k,key]);
const idxOf=(t:BrickTenant,k:FinalKind)=>'final-index-'+brickHash([t.organizationId,k]);
async function admitted(t:BrickTenant,k:FinalKind){const j=await loadTenantInstall(t.organizationId);
 if(!j||j.portalSlug!==t.portalSlug||j.state!=='installed'||!j.admitted.includes(k))throw Error('Module admission required');}
const privileged=new Set<FinalKind>(['pulse','amplifi','landing','settings','ctp']);
export async function saveFinal(t:BrickTenant,k:FinalKind,input:unknown,role:Role){
 await admitted(t,k);const v=Schema.parse(input);if(role!=='staff'&&(privileged.has(k)||!['update-hub','messaging','ask','training'].includes(k)))
 throw Error('Staff permission required');
 const id=idOf(t,k,v.key),prior=await readBrickRecord<FinalRecord>(t,id);
 if(prior){if(brickHash([prior.title,prior.body,prior.visibility,prior.channel,prior.source])!==
 brickHash([v.title,v.body,v.visibility,v.channel,v.source]))throw Error('Business identity conflict');return prior;}
 // Enforce server-owned initial workflow state, never trust a submitted "completed" or "published".
 const initial:Record<FinalKind,FinalRecord['state']>={
 pulse:'draft',amplifi:'draft','update-hub':'submitted',messaging:'submitted',
 training:'enrolled',landing:'draft',ask:'submitted',settings:'ready',ctp:'ready'};
 const row:FinalRecord={...t,...v,state:initial[k],reply:undefined,progress:k==='training'?0:undefined,
   id,kind:k,version:1};
 await writeBrickRecord(t,id,row);
 const idx=idxOf(t,k),old=await readBrickRecord<BrickTenant&{keys:string[]}>(t,idx);
 if(!old?.keys.includes(v.key))await writeBrickRecord(t,idx,{...t,keys:[...(old?.keys||[]),v.key]});
 return row;
}
export async function readFinal(t:BrickTenant,k:FinalKind,key:string,role:Role){
 await admitted(t,k);const row=await readBrickRecord<FinalRecord>(t,idOf(t,k,key));
 if(!row||row.kind!==k)throw Error('Item not found');
 if(role!=='staff'&&row.visibility==='staff')throw Error('Item access denied');return row;
}
export async function listFinal(t:BrickTenant,k:FinalKind,role:Role){
 await admitted(t,k);const idx=await readBrickRecord<BrickTenant&{keys:string[]}>(t,idxOf(t,k));
 const out:FinalRecord[]=[];
 for(const key of idx?.keys||[]){const row=await readFinal(t,k,key,'staff');if(role==='staff'||row.visibility==='member')out.push(row);}
 return out;
}
export async function transitionFinal(t:BrickTenant,k:FinalKind,key:string,input:unknown,role:Role){
 const action=z.object({state:Schema.shape.state,reply:z.string().max(5000).optional(),
  progress:z.number().int().min(0).max(100).optional()}).strict().parse(input);
 const old=await readFinal(t,k,key,role==='staff'?'staff':'member');
 if(role!=='staff'&&!(k==='training'&&['enrolled','in_progress','completed'].includes(action.state)))
 throw Error('Staff workflow permission required');
 if(k==='training'&&action.state==='completed'&&action.progress!==100)throw Error('Completion requires 100% progress');
 if(k==='training'&&action.progress!==undefined&&action.progress<(old.progress||0))
  throw Error('Training progress rollback denied');
 if(['pulse','amplifi','landing'].includes(k)&&action.state==='published'&&old.body.trim().length===0)
  throw Error('Cannot publish empty content');
 if(['update-hub','messaging','ask'].includes(k)&&action.state==='responded'&&!action.reply)throw Error('Advisor response required');
 if(['amplifi','landing'].includes(k)&&action.state==='published'&&role!=='staff')throw Error('Publication approval required');
 if(old.state===action.state&&old.reply===action.reply&&old.progress===action.progress)return old;
 const allowed:Record<FinalKind,string[]>={
 pulse:['ready','delivered'],amplifi:['ready','published'], 'update-hub':['submitted','delivered','responded'],
 messaging:['submitted','delivered','responded'],training:['enrolled','in_progress','completed'],
 landing:['ready','published'],ask:['submitted','delivered','responded'],
 settings:['ready'],ctp:['ready','in_progress','completed']};
 if(!allowed[k].includes(action.state))throw Error('Invalid workflow transition');
 return writeBrickRecord(t,old.id,{...old,state:action.state,reply:action.reply,progress:action.progress});
}
export async function finalDefaults(t:BrickTenant,k:FinalKind){
 await admitted(t,k);const existing=await readBrickRecord<FinalRecord>(t,idOf(t,k,'welcome'));
 if(existing)return existing;
 const titles:Record<FinalKind,string>={pulse:'Your Pulse',amplifi:'Your stories',
 'update-hub':'Your updates',messaging:'Advisor messages',training:'Your academy',
 landing:'Your landing page',ask:'Ask your advisor',settings:'Portal preferences',ctp:'Your journey'};
 return saveFinal(t,k,{key:'welcome',title:titles[k],body:'',visibility:'member',state:'ready'},'staff');
}

/** Source-grounded deterministic content generation. No invented provider output. */
export async function generateFinal(t:BrickTenant,k:'pulse'|'amplifi',
 input:{key:string;title:string;sourceText:string},role:Role){
 if(role!=='staff')throw Error('Staff generation permission required');
 const source=z.object({key:z.string().regex(/^[a-z0-9-]{1,80}$/),
 title:z.string().trim().min(1),sourceText:z.string().trim().min(10).max(10000)}).strict().parse(input);
 const body=k==='pulse'
  ?'Operational Pulse\\n\\n'+source.sourceText+'\\n\\nReview the underlying signals before sharing.'
  :'Amplifi content draft\\n\\n'+source.sourceText+'\\n\\nApproval required before publication.';
 return saveFinal(t,k,{key:source.key,title:source.title,body,visibility:'member',state:'draft',source:brickHash(source.sourceText)},role);
}
