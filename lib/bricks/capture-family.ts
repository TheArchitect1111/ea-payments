import { z } from 'zod';
import { brickHash, readBrickRecord, writeBrickRecord, type BrickTenant } from '@/lib/bricks/durable';
import { loadTenantInstall } from '@/lib/modules/tenant-install';

export const CaptureKind = z.enum(['simplifi','connect','intake','applications']);
export type CaptureKind = z.infer<typeof CaptureKind>;
const Input = z.object({
  identity: z.string().trim().min(1).max(200),
  requestId: z.string().min(6).max(120),
  email: z.string().email().transform(x => x.trim().toLowerCase()),
  name: z.string().trim().min(1).max(200),
  payload: z.record(z.unknown()),
}).strict();
type RecordInput = z.infer<typeof Input>;
type CaptureRow = BrickTenant & RecordInput & {
  id: string; kind: CaptureKind; state: string; outcome: string; version: 1;
  confirmationSent: boolean; updatedAt: string;
};
const idFor=(tenant:BrickTenant,kind:CaptureKind,identity:string)=>
  'capture-'+kind+'-'+brickHash([tenant.organizationId,kind,identity.trim().toLowerCase()]);
const flow: Record<CaptureKind,{initial:string;next:string;outcome:string}> = {
  simplifi:{initial:'captured',next:'routed',outcome:'magnifi-review'},
  connect:{initial:'captured',next:'follow_up',outcome:'relationship-follow-up'},
  intake:{initial:'received',next:'review',outcome:'advisor-intake'},
  applications:{initial:'submitted',next:'reviewed',outcome:'commerce-handoff'},
};
async function admitted(tenant:BrickTenant,kind:CaptureKind){
  const j=await loadTenantInstall(tenant.organizationId);
  if(!j||j.portalSlug!==tenant.portalSlug||j.state!=='installed'||!j.admitted.includes(kind))
    throw new Error('Certified tenant module admission required');
}
export async function submitCapture(tenant:BrickTenant,kind:CaptureKind,input:unknown) {
  await admitted(tenant,kind);
  const data=Input.parse(input),id=idFor(tenant,kind,data.identity);
  const previous=await readBrickRecord<CaptureRow>(tenant,id);
  if(previous){
    if(previous.requestId!==data.requestId ||
      brickHash([previous.email,previous.name,previous.payload])!==brickHash([data.email,data.name,data.payload]))
      throw new Error('Conflicting capture identity');
    return previous;
  }
  const row:CaptureRow={...tenant,...data,id,kind,version:1,state:flow[kind].initial,
    outcome:'pending',confirmationSent:false,updatedAt:new Date().toISOString()};
  await writeBrickRecord(tenant,id,row);
  await writeBrickRecord(tenant,'capture-track-'+brickHash([id,'submitted']),
    {...tenant,kind,captureId:id,event:'capture_submitted'});
  return row;
}
export async function readCapture(tenant:BrickTenant,kind:CaptureKind,identity:string) {
  await admitted(tenant,kind);
  const row=await readBrickRecord<CaptureRow>(tenant,idFor(tenant,kind,identity));
  if(!row||row.kind!==kind) throw new Error('Capture not found');
  return row;
}
export async function progressCapture(tenant:BrickTenant,kind:CaptureKind,identity:string,
  ports:{confirm?:(message:{email:string;subject:string})=>Promise<void>}={}) {
  const row=await readCapture(tenant,kind,identity);
  const target=flow[kind], next={...row,state:target.next,outcome:target.outcome};
  if(row.state===target.initial){
    await writeBrickRecord(tenant,row.id,next);
    await writeBrickRecord(tenant,'capture-track-'+brickHash([row.id,'routed']),
      {...tenant,kind,captureId:row.id,event:target.outcome});
  }
  if(kind==='applications' && !row.confirmationSent){
    if(!ports.confirm) throw new Error('Confirmation provider required');
    await ports.confirm({email:row.email,subject:'Application received'});
    await writeBrickRecord(tenant,row.id,{...next,confirmationSent:true});
  }
  return readCapture(tenant,kind,identity);
}
