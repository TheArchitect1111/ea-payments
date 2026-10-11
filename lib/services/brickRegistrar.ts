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
import { pushToTrackingPortal, confirmTrackingPayment,
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
export type BrickRegistrationResult={ok:boolean;id?:string;error?:string;deferred?:boolean;alreadyPaid?:boolean};

export async function registerBrickEvent(event:BrickEvent, verifiedPayment?:TrackingPayment):Promise<BrickRegistrationResult>{
 try {
  const e=EventSchema.parse(event);
  if(e.payment_status==='paid'){
   if(!verifiedPayment||verifiedPayment.event_type!=='payment_confirmed'||
      verifiedPayment.payment_status!=='paid'||!verifiedPayment.payment_reference||
      !e.payment_reference||e.payment_reference!==verifiedPayment.payment_reference||
      verifiedPayment.registration_id!==e.registration_id||
      verifiedPayment.email.trim().toLowerCase()!==e.email||
      verifiedPayment.class_id!==e.brick_id||
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
   created_at:e.timestamp,source_page:'amandacatherine.ca',
   timestamp:e.timestamp,source:e.source,
   payment_status:'unpaid',payment_reference:null,is_test:e.is_test,event_type:'signup',
  };
  const result=await pushToTrackingPortal(lead);
  return {ok:true,...result};
 }catch(error){return {ok:false,error:error instanceof Error?error.message:'Brick registration failed'};}
}
