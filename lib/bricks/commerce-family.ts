import { z } from 'zod';
import { brickHash, readBrickRecord, writeBrickRecord, type BrickTenant } from '@/lib/bricks/durable';
import { loadTenantInstall } from '@/lib/modules/tenant-install';
import { setModuleEnabled, listEntitlementsForOrg } from '@/lib/entitlements';

export const CommerceConfig = z.object({
  offers: z.array(z.object({ id: z.string().regex(/^[a-z0-9-]{1,80}$/),
    title: z.string().min(1), amount: z.number().int().min(0), currency: z.string().regex(/^[a-z]{3}$/) }).strict()).min(1),
  confirmationSubject: z.string().min(1), confirmationHtml: z.string().min(1),
}).strict();
export type CommerceKind = 'billing' | 'events';
type CommerceConfigType = z.infer<typeof CommerceConfig>;
type Enrollment = BrickTenant & { id: string; kind: CommerceKind; offerId: string; email: string; name: string;
  payment_status: 'unpaid' | 'paid'; payment_reference: string | null; confirmationSent: boolean };
type PaymentProof = { reference: string; organizationId: string; enrollmentId: string; offerId: string;
  amount: number; currency: string; paid: boolean };
const idFor = (tenant: BrickTenant, kind: string, identity: string) => brickHash([tenant.organizationId,kind,identity]);
const configId = (tenant: BrickTenant, kind: string) => 'commerce-config-' + idFor(tenant,kind,'install');
const enrollmentId = (id: string) => 'commerce-order-' + id;
const escape = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

async function requireAdmitted(tenant: BrickTenant, kind: 'billing'|'events'|'member', allowInstalling = false) {
  const journal = await loadTenantInstall(tenant.organizationId);
  if (!journal || (journal.state !== 'installed' && !(allowInstalling && journal.state === 'installing')) || journal.portalSlug !== tenant.portalSlug || !journal.admitted.includes(kind))
    throw new Error('Certified tenant entitlement required: ' + kind);
}
export async function installCommerce(tenant: BrickTenant, kind: CommerceKind, input: unknown) {
  await requireAdmitted(tenant,kind,true);
  const config = CommerceConfig.parse(input);
  const old = await readBrickRecord<BrickTenant & {config:CommerceConfigType}>(tenant,configId(tenant,kind));
  if (old && JSON.stringify(old.config) !== JSON.stringify(config)) throw new Error('Commerce config conflict');
  if (!old) await writeBrickRecord(tenant,configId(tenant,kind),{...tenant,kind,config});
  return config;
}
async function getConfig(tenant: BrickTenant, kind: CommerceKind) {
  await requireAdmitted(tenant,kind);
  const row = await readBrickRecord<BrickTenant & {config:CommerceConfigType}>(tenant,configId(tenant,kind));
  if (!row) throw new Error('Commerce not configured');
  return CommerceConfig.parse(row.config);
}
export async function registerCommerce(tenant: BrickTenant, kind: CommerceKind, input: unknown) {
  const config = await getConfig(tenant,kind);
  const data = z.object({email:z.string().email().transform(x=>x.toLowerCase().trim()),
    name:z.string().trim().min(1),offerId:z.string()}).strict().parse(input);
  if (!config.offers.some(x=>x.id===data.offerId)) throw new Error('Offer not installed');
  const id = idFor(tenant,kind,[data.email,data.offerId].join(':'));
  const previous = await readBrickRecord<Enrollment>(tenant,enrollmentId(id));
  const row: Enrollment = previous ?? {...tenant,...data,id,kind,payment_status:'unpaid',payment_reference:null,confirmationSent:false};
  if (previous && (previous.name!==data.name || previous.offerId!==data.offerId)) throw new Error('Registration identity conflict');
  if (!previous) {
    await writeBrickRecord(tenant,enrollmentId(id),row);
    await writeBrickRecord(tenant,'commerce-track-register-'+id,{...tenant,kind,id,event:'registered'});
  }
  return row;
}
export async function readCommerceOrder(tenant: BrickTenant, id: string) {
  const row = await readBrickRecord<Enrollment>(tenant,enrollmentId(id));
  if (!row) throw new Error('Registration not found');
  return row;
}
export async function payCommerce(tenant: BrickTenant, kind: CommerceKind, id:string, reference:string, ports:{
  verify:(reference:string)=>Promise<PaymentProof>;
  confirm:(letter:{to:string;subject:string;html:string})=>Promise<void>;
}) {
  const config = await getConfig(tenant,kind);
  const row = await readCommerceOrder(tenant,id);
  const offer = config.offers.find(x=>x.id===row.offerId);
  const proof = await ports.verify(reference);
  if(row.kind!==kind || !offer || !proof.paid || proof.reference!==reference ||
    proof.organizationId!==tenant.organizationId || proof.enrollmentId!==id ||
    proof.offerId!==offer.id || proof.amount!==offer.amount || proof.currency!==offer.currency)
    throw new Error('Verified matching payment required');
  if(row.payment_reference && row.payment_reference!==reference) throw new Error('Payment replay conflict');
  const paid:Enrollment={...row,payment_status:'paid',payment_reference:reference};
  if(row.payment_status!=='paid'){
    await writeBrickRecord(tenant,enrollmentId(id),paid);
    await writeBrickRecord(tenant,'commerce-track-payment-'+id,{...tenant,kind,id,event:'payment_confirmed',reference});
  }
  if(!row.confirmationSent){
    await ports.confirm({to:row.email,subject:config.confirmationSubject,
      html:config.confirmationHtml.replace(/{{name}}/g,escape(row.name)).replace(/{{offer}}/g,escape(offer.title))});
    await writeBrickRecord(tenant,enrollmentId(id),{...paid,confirmationSent:true});
  }
  return readCommerceOrder(tenant,id);
}
export async function changeMemberGrant(tenant: BrickTenant, input:unknown, confirm:(mail:{to:string;subject:string;html:string})=>Promise<void>) {
  await requireAdmitted(tenant,'member');
  const data=z.object({email:z.string().email().transform(x=>x.trim().toLowerCase()),
    memberId:z.string().min(1),enabled:z.boolean(),requestId:z.string().min(6)}).strict().parse(input);
  const recordId='member-grant-'+idFor(tenant,'member',data.memberId);
  const row=await readBrickRecord<BrickTenant & {email:string;memberId:string;enabled:boolean;requestId:string;confirmationSent:boolean}>(tenant,recordId);
  if(row && row.requestId===data.requestId){
    if(row.enabled!==data.enabled || row.email!==data.email) throw new Error('Conflicting member replay');
    if(row.confirmationSent) return row;
  }
  const next={...tenant,...data,confirmationSent:false};
  // The canonical Member entitlement is organization-wide, not a person-specific ACL.
  // Never disable it on an individual member revoke.
  if (data.enabled) {
    const actual = await setModuleEnabled(tenant.organizationId, 'member', true, 'manual');
    if (!actual || actual.organizationId !== tenant.organizationId || actual.moduleId !== 'member' || actual.status !== 'active')
      throw new Error('Member platform entitlement write failed');
    const stored = (await listEntitlementsForOrg(tenant.organizationId)).find(x => x.moduleId === 'member');
    if (!stored || stored.status !== 'active') throw new Error('Member platform entitlement read-back failed');
  }
  if(!row || row.requestId!==data.requestId) await writeBrickRecord(tenant,recordId,next);
  await confirm({to:data.email,subject:data.enabled?'Membership granted':'Membership revoked',
    html:data.enabled?'Your membership is active.':'Your membership has ended.'});
  await writeBrickRecord(tenant,recordId,{...next,confirmationSent:true});
  await writeBrickRecord(tenant,'member-track-'+idFor(tenant,'member',data.requestId),
    {...tenant,memberId:data.memberId,event:data.enabled?'member_granted':'member_revoked'});
  return readBrickRecord(tenant,recordId);
}
