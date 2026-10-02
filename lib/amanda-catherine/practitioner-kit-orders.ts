import type Stripe from 'stripe';
import { createHash } from 'node:crypto';
import { listStudioRecords, saveStudioRecord } from '@/lib/creative-studio/persistence';
import { syntheticOrgId } from '@/lib/platform-store';
import { AMANDA_PRACTITIONER_KIT } from './practitioner-kit-catalog';

export type AmandaKitOrder = {
  id:string; portalSlug:string; productId:string; stripeSessionId:string; paymentStatus:string;
  amountPaidCad:number; email?:string|null; name?:string|null; phone?:string|null;
  billingAddress?:Stripe.Address|null; shippingAddress?:Stripe.Address|null; kitFulfillment?:'pickup'|'ship'; shippingChargeCad?:number; courseId?:string; fulfillmentStatus:string;
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

export async function recordAmandaKitOrder(session: Stripe.Checkout.Session, includedCourseId?: string) {
  const meta = session.metadata || {};
  const choice = meta.kitFulfillment;
  const shippingCents = Number(meta.kitShippingCents);
  if ((!includedCourseId && !isAmandaKitSession(session)) || session.payment_status !== 'paid' || session.currency !== 'cad') return {ok:false,error:'A paid Practitioner Kit order could not be verified.'};
  if (choice !== 'pickup' && choice !== 'ship') return {ok:false,error:'Practitioner kit fulfillment selection is missing.'};
  if (!Number.isSafeInteger(shippingCents) || shippingCents !== 0) return {ok:false,error:'Practitioner kit shipping charge is invalid.'};
  if ((session.shipping_cost?.amount_total || 0) !== shippingCents) return {ok:false,error:'The shipping charge does not match the free fulfillment selection.'};
  let shippingAddress: Stripe.Address | null = null;
  try { shippingAddress = choice === 'ship' ? JSON.parse(meta.kitShippingAddress || '') : null; } catch { return {ok:false,error:'Shipping address is missing.'}; }
  if (choice === 'ship' && (!shippingAddress?.line1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.postal_code || !shippingAddress.country)) return {ok:false,error:'A complete shipping address is required.'};
  if (!includedCourseId && session.amount_total !== AMANDA_PRACTITIONER_KIT.priceCad * 100 + shippingCents) return {ok:false,error:'Practitioner kit payment total is invalid.'};
  if (process.env.VERCEL_ENV !== 'production') return {ok:true,preview:true};
  const id = `amanda-kit-order-${createHash('sha256').update(session.id).digest('hex').slice(0,24)}`;
  const saved = await saveStudioRecord({
    recordType:'experience', id, organizationId:syntheticOrgId('amanda-catherine'),
    title: includedCourseId ? 'Amanda tuition-included Practitioner Kit' : 'Amanda Practitioner Kit paid order',
    payload:{id,portalSlug:'amanda-catherine',productId:AMANDA_PRACTITIONER_KIT.id,
      stripeSessionId:session.id,paymentStatus:session.payment_status,amountPaidCad:(session.amount_total || 0) / 100,
      email:session.customer_details?.email || session.customer_email || meta.clientEmail,
      name:session.customer_details?.name || meta.clientName,phone:session.customer_details?.phone,
      billingAddress:session.customer_details?.address, shippingAddress, kitFulfillment:choice,
      shippingChargeCad:shippingCents / 100, courseId:includedCourseId,
      fulfillmentStatus:choice === 'pickup' ? 'pickup-pending' : 'shipping-pending'},
  });
  if (!saved.ok || !saved.persistedToAirtable) return {ok:false,error:'Order recording needs attention. Your Stripe receipt remains valid.'};
  return {ok:true,preview:false};
}
