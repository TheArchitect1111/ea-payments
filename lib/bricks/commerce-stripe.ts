import { getStripe } from '@/lib/stripe';
import { sendAuthEmail } from '@/lib/ea-auth-email';
import { payCommerce, type CommerceKind } from '@/lib/bricks/commerce-family';
import type { BrickTenant } from '@/lib/bricks/durable';

/** Server-side Stripe verification only. Caller must authorize tenant/order first. */
export async function fulfillCommerceStripePayment(tenant:BrickTenant,kind:CommerceKind,
  enrollmentId:string,reference:string){
 if(!/^pi_[A-Za-z0-9_]+$/.test(reference))throw new Error('Invalid Stripe payment reference');
 return payCommerce(tenant,kind,enrollmentId,reference,{
  verify:async id=>{
   const p=await getStripe().paymentIntents.retrieve(id);
   return {reference:p.id,organizationId:p.metadata.organizationId,
     enrollmentId:p.metadata.enrollmentId,offerId:p.metadata.offerId,
     amount:p.amount_received,currency:p.currency,paid:p.status==='succeeded'};
  },
  confirm:async message=>{
   const result=await sendAuthEmail({to:message.to,subject:message.subject,
     title:'Registration confirmation',bodyHtml:message.html,
     text:'Your registration payment is confirmed.'});
   if(!result.ok)throw new Error('Commerce confirmation delivery failed');
  }
 });
}
