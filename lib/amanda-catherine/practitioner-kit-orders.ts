import type Stripe from 'stripe';
import { createHash } from 'node:crypto';
import { listStudioRecords, saveStudioRecord } from '@/lib/creative-studio/persistence';
import { syntheticOrgId } from '@/lib/platform-store';
import { AMANDA_PRACTITIONER_KIT } from './practitioner-kit-catalog';

export type AmandaKitOrder = {
  id:string; portalSlug:string; productId:string; stripeSessionId:string; paymentStatus:string;
  amountPaidCad:number; email?:string|null; name?:string|null; phone?:string|null;
  billingAddress?:Stripe.Address|null; fulfillmentStatus:string;
};

export function isAmandaKitSession(session: Stripe.Checkout.Session) {
  return session.metadata?.checkoutType === 'amanda-practitioner-kit'
    && session.metadata?.amandaKitId === AMANDA_PRACTITIONER_KIT.id
    && session.metadata?.portalSlug === 'amanda-catherine';
}

export async function listAmandaKitOrders() {
  const rows = await listStudioRecords<AmandaKitOrder>('experience', syntheticOrgId('amanda-catherine'));
  return rows.filter((row)=>row?.id?.startsWith('amanda-kit-order-') && row.portalSlug === 'amanda-catherine');
}

export async function recordAmandaKitOrder(session: Stripe.Checkout.Session) {
  if (!isAmandaKitSession(session) || session.payment_status !== 'paid'
    || session.currency !== 'cad' || session.amount_total !== AMANDA_PRACTITIONER_KIT.priceCad * 100) {
    return {ok:false,error:'A paid Practitioner Kit order could not be verified.'};
  }
  // Preview must never write a test order into the shared client store.
  if (process.env.VERCEL_ENV !== 'production') return {ok:true,preview:true};
  const id = `amanda-kit-order-${createHash('sha256').update(session.id).digest('hex').slice(0,24)}`;
  const saved = await saveStudioRecord({
    recordType:'experience', id, organizationId:syntheticOrgId('amanda-catherine'),
    title:'Amanda Practitioner Kit paid order',
    payload:{id,portalSlug:'amanda-catherine',productId:AMANDA_PRACTITIONER_KIT.id,
      stripeSessionId:session.id,paymentStatus:session.payment_status,amountPaidCad:session.amount_total / 100,
      email:session.customer_details?.email || session.customer_email,
      name:session.customer_details?.name,phone:session.customer_details?.phone,
      billingAddress:session.customer_details?.address,fulfillmentStatus:'delivery-arrangements-required'},
  });
  if (!saved.ok || !saved.persistedToAirtable) return {ok:false,error:'Order recording needs attention. Your Stripe receipt remains valid.'};
  return {ok:true,preview:false};
}
