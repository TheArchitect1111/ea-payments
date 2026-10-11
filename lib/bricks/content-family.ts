import { z } from 'zod';
import { brickHash, readBrickRecord, writeBrickRecord, type BrickTenant } from './durable';
import { loadTenantInstall } from '@/lib/modules/tenant-install';
export const ContentKind=z.enum(['documents','resources','dashboard','reports']);
export type ContentKind=z.infer<typeof ContentKind>;
const ContentInput=z.object({key:z.string().regex(/^[a-z0-9-]{1,80}$/),title:z.string().trim().min(1).max(200),
  visibility:z.enum(['staff','member']),body:z.string().max(250000).optional(),
  source:z.string().max(500).optional(),mediaType:z.string().max(100).optional()}).strict();
type ContentRow=BrickTenant & z.infer<typeof ContentInput> & {kind:ContentKind;id:string;version:1;state:'ready'|'queued'|'complete';artifact?:string};
export type ContentRole='staff'|'member';
const rowId=(t:BrickTenant,k:ContentKind,key:string)=>'content-'+brickHash([t.organizationId,k,key]);
async function admitted(t:BrickTenant,k:ContentKind){const j=await loadTenantInstall(t.organizationId);
 if(!j||j.portalSlug!==t.portalSlug||j.state!=='installed'||!j.admitted.includes(k))throw Error('Content tenant not admitted');}
export async function saveContent(t:BrickTenant,k:ContentKind,input:unknown,role:ContentRole){
 await admitted(t,k);if(role!=='staff')throw Error('Staff content permission required');
 const v=ContentInput.parse(input),id=rowId(t,k,v.key);const prior=await readBrickRecord<ContentRow>(t,id);
 if(prior){if(brickHash([prior.title,prior.visibility,prior.body,prior.source,prior.mediaType])!==
 brickHash([v.title,v.visibility,v.body,v.source,v.mediaType]))throw Error('Content identity conflict');return prior;}
 if((k==='documents'||k==='resources')&&v.source&&!v.source.startsWith('/portal/'+t.portalSlug+'/'))
   throw Error('Protected tenant delivery path required');
 const row:ContentRow={...t,...v,kind:k,id,version:1,state:k==='reports'?'queued':'ready'};
 return writeBrickRecord(t,id,row);
}
export async function readContent(t:BrickTenant,k:ContentKind,key:string,role:ContentRole){
 await admitted(t,k);const row=await readBrickRecord<ContentRow>(t,rowId(t,k,key));
 if(!row||row.kind!==k)throw Error('Content not found');
 if(row.visibility==='staff'&&role!=='staff')throw Error('Content access denied');return row;
}
export async function finishReport(t:BrickTenant,key:string,artifact:string,role:ContentRole){
 if(role!=='staff')throw Error('Staff report permission required');
 const row=await readContent(t,'reports',key,'staff');
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
 return existing??saveContent(t,k,defaults[k],'staff');
}
