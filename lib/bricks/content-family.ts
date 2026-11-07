import { z } from 'zod';
import { CustomerEmail, bindCustomerOwnership, assertCustomerRecord, customerRecordAllowed, isAyf, type CustomerActor } from '@/lib/ayf/customer-access';
import { brickHash, readBrickRecord, writeBrickRecord, type BrickTenant } from './durable';
import { loadTenantInstall } from '@/lib/modules/tenant-install';
export const ContentKind=z.enum(['documents','resources','dashboard','reports']);
export type ContentKind=z.infer<typeof ContentKind>;
const ContentInput=z.object({key:z.string().regex(/^[a-z0-9-]{1,80}$/),title:z.string().trim().min(1).max(200),
  customerEmail:CustomerEmail.optional(),visibility:z.enum(['staff','member']),body:z.string().max(250000).optional(),
  source:z.string().max(500).optional(),mediaType:z.string().max(100).optional()}).strict();
type ContentRow=BrickTenant & z.infer<typeof ContentInput> & {customerMembershipId?:string;kind:ContentKind;id:string;version:1;state:'ready'|'queued'|'complete';artifact?:string};
export type ContentRole='staff'|'member';
const rowId=(t:BrickTenant,k:ContentKind,key:string)=>'content-'+brickHash([t.organizationId,k,key]);
const indexId=(t:BrickTenant,k:ContentKind)=>'content-index-'+brickHash([t.organizationId,k]);
async function ensureContentIndex(t:BrickTenant,k:ContentKind,key:string){
 const id=indexId(t,k);
 const index=await readBrickRecord<BrickTenant & {version:1;kind:ContentKind;keys:string[]}>(t,id);
 if(index?.keys.includes(key))return;
 await writeBrickRecord(t,id,{...t,version:1 as const,kind:k,keys:[...(index?.keys||[]),key]});
}
async function admitted(t:BrickTenant,k:ContentKind){const j=await loadTenantInstall(t.organizationId);
 if(!j||j.portalSlug!==t.portalSlug||j.state!=='installed'||!j.admitted.includes(k))throw Error('Content tenant not admitted');}
export async function saveContent(t:BrickTenant,k:ContentKind,input:unknown,role:ContentRole,actor?:CustomerActor){
 await admitted(t,k);if(role!=='staff')throw Error('Staff content permission required');
 const parsed=ContentInput.parse(input);const v={...parsed,...(isAyf(t)?await bindCustomerOwnership(t,parsed.customerEmail):{})};
 if(isAyf(t)){if(!v.customerEmail)throw Error('Customer owner required');await assertCustomerRecord(t,v,v.visibility,actor,true);}
 const id=rowId(t,k,v.key);const prior=await readBrickRecord<ContentRow>(t,id);
 if(prior){await assertCustomerRecord(t,prior,prior.visibility,actor,true);if(brickHash([prior.customerMembershipId,prior.customerEmail,prior.title,prior.visibility,prior.body,prior.source,prior.mediaType])!==
 brickHash([v.customerMembershipId,v.customerEmail,v.title,v.visibility,v.body,v.source,v.mediaType]))throw Error('Content identity conflict');await ensureContentIndex(t,k,v.key);return prior;}
 if((k==='documents'||k==='resources')&&v.source&&!v.source.startsWith('/portal/'+t.portalSlug+'/'))
   throw Error('Protected tenant delivery path required');
 const row:ContentRow={...t,...v,kind:k,id,version:1,state:k==='reports'?'queued':'ready'};
 const saved=await writeBrickRecord(t,id,row);
 await ensureContentIndex(t,k,v.key);
 return saved;
}
export async function readContent(t:BrickTenant,k:ContentKind,key:string,role:ContentRole,actor?:CustomerActor){
 await admitted(t,k);const row=await readBrickRecord<ContentRow>(t,rowId(t,k,key));
 if(!row||row.kind!==k)throw Error('Content not found');
 await assertCustomerRecord(t,row,row.visibility,actor,k==='reports'&&row.state!=='complete');
 if(row.visibility==='staff'&&role!=='staff')throw Error('Content access denied');return row;
}
export async function listContent(t:BrickTenant,k:ContentKind,role:ContentRole,actor?:CustomerActor){
 await admitted(t,k);
 const index=await readBrickRecord<BrickTenant & {kind:ContentKind;keys:string[]}>(t,indexId(t,k));
 if(!index)return [];
 const visible:ContentRow[]=[];
 for(const key of index.keys){
   const row=await readBrickRecord<ContentRow>(t,rowId(t,k,key));
   if(!row||row.kind!==k)throw Error('Content index integrity failure');
   if((role==='staff'||row.visibility==='member')&&await customerRecordAllowed(t,row,row.visibility,actor,k==='reports'&&row.state!=='complete'))visible.push(row);
 }
 return visible;
}
export async function generateReport(t:BrickTenant,key:string,sourceKind:'documents'|'resources',role:ContentRole,actor?:CustomerActor){
 if(role!=='staff')throw Error('Staff report permission required');
 const row=await readContent(t,'reports',key,'staff',actor);
 await assertCustomerRecord(t,row,row.visibility,actor,true);
 const source=(await listContent(t,sourceKind,'staff',actor)).filter(item=>!isAyf(t)||Boolean(row.customerMembershipId)&&item.customerEmail===row.customerEmail&&item.customerMembershipId===row.customerMembershipId);
 const artifact='/portal/'+t.portalSlug+'/reports/'+key;
 const body=JSON.stringify({source:sourceKind,tenant:t.organizationId,
   sourceCount:source.length,sourceKeys:source.map(item=>item.key).sort()});
 if(row.state==='complete'){
   if(row.artifact!==artifact||row.body!==body)throw Error('Report source changed; new job key required');
   return row;
 }
 return writeBrickRecord(t,row.id,{...row,source:sourceKind,body,state:'complete',artifact});
}
export async function finishReport(t:BrickTenant,key:string,artifact:string,role:ContentRole,actor?:CustomerActor){
 if(role!=='staff')throw Error('Staff report permission required');
 const row=await readContent(t,'reports',key,'staff',actor);
 await assertCustomerRecord(t,row,row.visibility,actor,true);
 if(!artifact.startsWith('/portal/'+t.portalSlug+'/'))throw Error('Report artifact path mismatch');
 if(row.state==='complete'){if(row.artifact!==artifact)throw Error('Report replay conflict');return row;}
 return writeBrickRecord(t,row.id,{...row,state:'complete',artifact});
}
export async function contentDefaults(t:BrickTenant,k:ContentKind){
 await admitted(t,k);const defaults={
 documents:{key:'getting-started',title:'Getting started',visibility:'member' as const},
 resources:{key:'tenant-resources',title:'Your resources',visibility:'member' as const},
 dashboard:{key:'welcome',title:'Your workspace',visibility:'member' as const},
 reports:{key:'operational-report',title:'Operational report',visibility:'staff' as const}};
 const existing=await readBrickRecord<ContentRow>(t,rowId(t,k,defaults[k].key));
 if(existing){await ensureContentIndex(t,k,defaults[k].key);return existing;}
 if(isAyf(t)){const row:ContentRow={...t,...defaults[k],kind:k,id:rowId(t,k,defaults[k].key),version:1,state:k==='reports'?'queued':'ready'};await writeBrickRecord(t,row.id,row);await ensureContentIndex(t,k,row.key);return row;}
 return saveContent(t,k,defaults[k],'staff');
}
