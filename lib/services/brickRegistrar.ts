/**
 * Universal chassis brick event registrar.
 *
 * Any brick (calendar, checkout, payment, form, class, waitlist, booking) calls
 * registerBrickEvent with brick_type, brick_id, client_id, registration_id,
 * name, email, phone, status, payment_status, payment_reference, timestamp,
 * source and is_test. A unique registration_id is the stable business identity.
 *
 * Calendar example:
 * await registerBrickEvent({brick_type:'calendar',brick_id:'consultation',
 * client_id:'amanda-catherine',registration_id:bookingId,name,email,phone,
 * status:'booked',payment_status:'unpaid',payment_reference:null,
 * timestamp:new Date().toISOString(),source:'calendar',is_test:false});
 *
 * Payment example: First register the signup with unpaid status. Only AFTER
 * a trusted server-side Stripe/Square verification handler establishes a
 * settled payment call registerBrickEvent(paidEvent, verifiedPayment).
 * Never fire payment-dependent confirmations from raw submit, client status,
 * or an unverified payment_reference. Downstream fulfillment belongs in the
 * verified payment handler after a successful registrar result.
 *
 * Test events are passed ONLY through the isolated trackingPortal test store
 * and cannot create live registrations or call remote ingest.
 */
import { z } from 'zod';
import { pushToTrackingPortal, confirmTrackingPayment, enqueueTrackingPortalRetry, getTestTrackingRegistration,
  type TrackingLead, type TrackingPayment } from '@/lib/services/trackingPortal';

const EventSchema=z.object({
 brick_type:z.string().trim().min(1).max(64),
 brick_id:z.string().trim().min(1).max(128),
 client_id:z.string().trim().min(1).max(128),
 registration_id:z.string().trim().min(1).max(120),
 name:z.string().trim().min(1).max(200),
 email:z.string().email().transform(x=>x.trim().toLowerCase()),
 phone:z.string().max(50),
 status:z.string().trim().min(1).max(64),
 payment_status:z.enum(['unpaid','paid']),
 payment_reference:z.string().trim().min(1).nullable(),
 timestamp:z.string().datetime({offset:true}),
 source:z.string().trim().min(1).max(256),
 is_test:z.boolean(),
}).strict();
export type BrickEvent=z.infer<typeof EventSchema>;
const InteractionSchema=z.object({
 event_type:z.literal('interaction'),client_id:z.literal('amanda-catherine'),
 event_id:z.string().uuid(),visitor_id:z.string().uuid(),
 event:z.string().regex(/^amanda:(homepage|classes|portal|pathway):[a-z0-9]+(?:-[a-z0-9]+)*$/),
 cta_key:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
 cta_name:z.string().trim().min(1).max(200),source:z.string().startsWith('/').max(500),
 destination:z.string().min(1).max(2000),timestamp:z.string().datetime({offset:true}),
 is_test:z.boolean(),course_key:z.string().max(128).optional(),
}).strict();
export type BrickInteractionEvent=z.infer<typeof InteractionSchema>;
export type BrickRegistrationResult={ok:boolean;id?:string;error?:string;deferred?:boolean;alreadyPaid?:boolean};

export async function registerBrickEvent(event:BrickEvent | BrickInteractionEvent, verifiedPayment?:TrackingPayment):Promise<BrickRegistrationResult>{
 try {
  if('event_type' in event&&event.event_type==='interaction') {
   if(verifiedPayment)return {ok:false,error:'Clicks cannot contain payment evidence'};
   const click=InteractionSchema.parse(event);
   if(click.event!==`amanda:${click.event.split(':')[1]}:${click.cta_key}`)return {ok:false,error:'Click name does not match canonical key'};
   const transport=await import('@/lib/services/trackingPortal');
   return {ok:true,...await transport.storeBrickInteraction(click)};
  }
  const e=EventSchema.parse(event);
  if(e.payment_status==='paid'){
   if(!verifiedPayment||verifiedPayment.event_type!=='payment_confirmed'||
      verifiedPayment.payment_status!=='paid'||!verifiedPayment.payment_reference||
      !e.payment_reference||e.payment_reference!==verifiedPayment.payment_reference||
      verifiedPayment.registration_id!==e.registration_id||
      verifiedPayment.email.trim().toLowerCase()!==e.email||
      verifiedPayment.class_id!==e.brick_id||
      (e.client_id!=='amanda-catherine'&&verifiedPayment.client_id!==e.client_id)||
      e.status!=='payment_confirmed'||
      Boolean(verifiedPayment.is_test)!==e.is_test) {
    return {ok:false,error:'Verified server-side payment evidence required'};
   }
   // Caller must pass a payment event constructed by a verified provider handler.
   const paid=await confirmTrackingPayment(verifiedPayment);
   return {ok:true,...paid};
  }
  if(e.payment_reference||verifiedPayment)
   return {ok:false,error:'Unverified payment reference on signup'};
  const pieces=e.name.trim().split(/\s+/);
  const lead:TrackingLead={
   client_id:e.client_id,brick_type:e.brick_type,
   registration_id:e.registration_id,first_name:pieces[0],
   last_name:pieces.slice(1).join(' '),name:e.name,email:e.email,phone:e.phone,
   class_name:e.brick_id,class_id:e.brick_id,
   registration_type:e.brick_type==='waitlist'?'waitlist':'live',
   created_at:e.timestamp,source_page:e.client_id==='amanda-catherine'?'amandacatherine.ca':e.source,
   timestamp:e.timestamp,source:e.source,
   payment_status:'unpaid',payment_reference:null,is_test:e.is_test,event_type:'signup',
  };
  try {
   const result=await pushToTrackingPortal(lead);
   return {ok:true,...result};
  }catch(trackingError){
   if(e.is_test)throw trackingError;
   // Business save has already succeeded. Retain the exact registration in the
   // retry queue rather than returning a misleading failure that duplicates a booking.
   await enqueueTrackingPortalRetry(lead,trackingError);
   return {ok:true,deferred:true};
  }
 }catch(error){return {ok:false,error:error instanceof Error?error.message:'Brick registration failed'};}
}

/** Private replay adapter for previously persisted tracking failures.
 * Only the registrar may talk to the tracking transport. */
export async function retryRegisteredBrickEvent(lead:TrackingLead){
 return pushToTrackingPortal(lead);
}
/** Authorized preview introspection only, never writes live tracking data. */
export async function readTestBrickRegistration(id:string){
 return getTestTrackingRegistration(id);
}

export type {TrackingLead,TrackingPayment} from '@/lib/services/trackingPortal';

/** Repository factory only. Does not provision production tenants or publish clients. */
export async function createClientBrick(clientName: string, slug: string): Promise<{branchName:string;filesCreated:string[]}> {
 const name=clientName.trim();
 if(!name || name.length>200 || /[\x00-\x1f]/.test(name)) throw new Error('Client name must be 1-200 printable characters');
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length>80) throw new Error('Invalid client slug');
 if(['amanda-catherine','tarris','tb3'].includes(slug)) throw new Error('Reserved client slug');
 const {readFile,mkdir,writeFile,rename,rm}=await import('node:fs/promises');
 const {resolve,join}=await import('node:path');
 const root=process.cwd();
 const registryPath=resolve(root,'lib/clients/registry.json');
 const lock=resolve(root,'lib/clients/.factory-lock');
 await mkdir(lock);
 try {
 const registry=JSON.parse(await readFile(registryPath,'utf8')) as Record<string,{name:string;slug:string;portalPath:string;eventAdapter:string}>;
 if(registry[slug]) throw new Error('Client slug is already registered');
 const folder=resolve(root,'lib/clients',slug);
 // Exclusive mkdir protects existing client content, including incomplete installs.
 await mkdir(folder);
 const filesCreated=[`lib/clients/${slug}/client.json`,`lib/clients/${slug}/brick-events.ts`];
 const entry={name,slug,portalPath:`/portal/${slug}`,eventAdapter:`lib/clients/${slug}/brick-events.ts`};
 const temporary=join(root,'lib/clients',`.registry-${slug}-${process.pid}.tmp`);
 try {
  await writeFile(join(folder,'client.json'),JSON.stringify(entry,null,2)+'\n',{flag:'wx'});
  await writeFile(join(folder,'brick-events.ts'),
   `// Generated by createClientBrick. Every event goes through the canonical registrar.\nimport {registerClientEvent} from '@/lib/tb3/brick-events';\nexport function registerEvent(value:Parameters<typeof registerClientEvent>[1],proof?:Parameters<typeof registerClientEvent>[2]) {\n return registerClientEvent(${JSON.stringify(slug)},value,proof);\n}\n`,{flag:'wx'});
  registry[slug]=entry;
  await writeFile(temporary,JSON.stringify(registry,null,2)+'\n',{flag:'wx'});
  await rename(temporary,registryPath);
 } catch(error) {
  await rm(temporary,{force:true}); await rm(folder,{recursive:true,force:true}); throw error;
 }
 return {branchName:`client/${slug}`,filesCreated};
 } finally { await rm(lock,{recursive:true,force:true}); }
}
