/** Shared paid-webhook orchestration. Never provision from a browser success redirect. */
import 'server-only';
import type Stripe from 'stripe';
import {getStripe} from '@/lib/stripe';
import {loadSubportalManifest,requireSubportalOffer} from './manifest';
import {requireVerifiedProviderCheckout,resolveStudentIdentity,subportalService} from './service';
import {deliverSubportalWelcome} from './delivery';
import {subportalDb} from './db';

type Paid={provider:'stripe'|'square';checkoutId:string;organizationId:string;offerId:string;
  paymentReference:string;sessionId:string;email:string;amountCadCents:number;
  catalogObjectId?:string};
async function processPaid(input:Paid){
  const manifest=await loadSubportalManifest(input.organizationId);
  const offer=requireSubportalOffer(manifest,input.offerId,input.provider);
  const checkout=await requireVerifiedProviderCheckout(input.checkoutId,input.organizationId,input.offerId);
  if(checkout.provider!==input.provider || checkout.buyer_email!==input.email.toLowerCase() ||
    checkout.amount_cad_cents!==offer.amountCadCents || offer.amountCadCents!==input.amountCadCents)
    throw new Error('Payment, identity or amount does not match the trusted checkout manifest');
  if(input.provider==='square' && input.catalogObjectId!==offer.squareCatalogObjectId)
    throw new Error('Square catalog object does not match the trusted offer ID');
  if(checkout.fulfilled_payment_reference && checkout.fulfilled_payment_reference!==input.paymentReference)
    throw new Error('Checkout already fulfilled by a different payment');
  // Compare-and-set prevents two distinct payments from silently sharing a checkout.
  if(!checkout.fulfilled_payment_reference){
    const bound=await subportalDb('subportal_checkout_orders',{
      method:'PATCH',query:{checkout_id:'eq.'+input.checkoutId,fulfilled_payment_reference:'is.null'},
      payload:{fulfilled_payment_reference:input.paymentReference},
    });
    if(!bound.length){
      const current=await requireVerifiedProviderCheckout(input.checkoutId,input.organizationId,input.offerId);
      if(current.fulfilled_payment_reference!==input.paymentReference)
        throw new Error('Payment reference binding conflict');
    }
  }
  const student=await resolveStudentIdentity({email:input.email,name:checkout.buyer_name});
  const created=await subportalService.create({
    organizationId:manifest.organizationId,studentIdentity:student.id,offerId:offer.id,
    paymentReference:input.paymentReference,idempotencyKey:input.provider+':'+input.paymentReference,
    provider:input.provider,
  });
  const delivery=await deliverSubportalWelcome({
    sessionId:input.sessionId,provider:input.provider,studentId:student.id,
    enrollmentId:created.enrollmentId,studentEmail:student.email,studentName:student.name,
    organizationId:manifest.organizationId,manifest,offerTitle:offer.title,
    amountCadCents:offer.amountCadCents,paymentReference:input.paymentReference,
  });
  return {enrollmentId:created.enrollmentId,studentId:student.id,emailId:delivery.email_id};
}
export async function fulfillSubportalStripe(session:Stripe.Checkout.Session){
  if(session.metadata?.subportalBrick!=='v1')return false;
  if(session.payment_status!=='paid' || !session.metadata.organizationId || !session.metadata.offerId)
    throw new Error('Subportal Stripe payment not confirmed');
  const verified=await getStripe().checkout.sessions.retrieve(session.id);
  if(verified.payment_status!=='paid' || verified.mode!=='payment' ||
    verified.metadata?.subportalBrick!=='v1' || verified.metadata.organizationId!==session.metadata.organizationId ||
    verified.metadata.offerId!==session.metadata.offerId)
    throw new Error('Stripe provider session did not verify');
  const email=verified.customer_details?.email?.trim().toLowerCase();
  const ref=typeof verified.payment_intent==='string'?verified.payment_intent:verified.payment_intent?.id;
  if(!email || !ref || verified.currency?.toLowerCase()!=='cad' || !verified.amount_total)
    throw new Error('Verified Stripe buyer or payment fields missing');
  const intent=await getStripe().paymentIntents.retrieve(ref);
  if(intent.status!=='succeeded' || intent.currency!=='cad' ||
    intent.amount_received!==verified.amount_total)
    throw new Error('Stripe payment intent does not match successful checkout');
  await processPaid({provider:'stripe',checkoutId:verified.id,
    organizationId:verified.metadata!.organizationId,offerId:verified.metadata!.offerId,
    paymentReference:ref,sessionId:verified.id,email,
    amountCadCents:verified.amount_total});
  return true;
}
const squareHeaders=()=>{
  if(!process.env.SQUARE_ACCESS_TOKEN)throw new Error('Square token missing');
  return {Authorization:'Bearer '+process.env.SQUARE_ACCESS_TOKEN,'Square-Version':'2026-09-16'};
};
async function squareGet(path:string){
  const res=await fetch('https://connect.squareup.com/v2/'+path,{
    headers:squareHeaders(),cache:'no-store',signal:AbortSignal.timeout(12000),
  });
  if(!res.ok)throw new Error('Square verification HTTP '+res.status);
  return res.json() as Promise<any>;
}
export async function fulfillSubportalSquare(paymentId:string){
  if(!paymentId)throw new Error('Missing Square payment ID');
  const {payment}=await squareGet('payments/'+encodeURIComponent(paymentId));
  if(payment?.status!=='COMPLETED')return {processed:false,pending:true};
  const checkoutId=String(payment.order_id||'');
  if(!checkoutId)throw new Error('Paid Square event lacks an order ID');
  const {order}=await squareGet('orders/'+encodeURIComponent(checkoutId));
  const lines=order?.line_items;
  if(!Array.isArray(lines)||lines.length!==1 || String(lines[0].quantity)!=='1' ||
    !lines[0].catalog_object_id)throw new Error('Square order is not a single trusted catalog item');
  const mapped=await subportalDb<any>('subportal_checkout_orders',{
    query:{checkout_id:'eq.'+checkoutId,select:'*',limit:'1'},
  });
  const checkout=mapped[0];
  if(!checkout || checkout.provider!=='square')return {processed:false,unmapped:true};
  const manifest=await loadSubportalManifest(checkout.organization_id);
  const offer=requireSubportalOffer(manifest,checkout.offer_id,'square');
  const expected=offer.amountCadCents;
  if(order.location_id!==process.env.SQUARE_LOCATION_ID ||
    payment.amount_money?.currency!=='CAD' || Number(payment.amount_money?.amount)!==expected ||
    Number(order.total_money?.amount)!==expected || lines[0].catalog_object_id!==offer.squareCatalogObjectId)
    throw new Error('Square amount, location, or catalog product mismatch');
  const email=String(payment.buyer_email_address||'').trim().toLowerCase();
  if(!email || email!==checkout.buyer_email)throw new Error('Square verified buyer email mismatch');
  await processPaid({provider:'square',checkoutId,organizationId:manifest.organizationId,offerId:offer.id,
    paymentReference:payment.id,sessionId:checkoutId,email,amountCadCents:expected,
    catalogObjectId:lines[0].catalog_object_id});
  return {processed:true};
}
