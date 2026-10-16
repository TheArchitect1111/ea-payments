/** Provider-neutral checkout. Offer identity and amounts come only from installed manifests. */
import 'server-only';
import {z} from 'zod';
import {randomUUID} from 'node:crypto';
import {getStripe} from '@/lib/stripe';
import {loadSubportalManifest,requireSubportalOffer} from './manifest';
import {recordProviderCheckout} from './service';

const Buyer=z.object({email:z.string().email().transform(s=>s.trim().toLowerCase()),
  name:z.string().trim().min(1).max(200)}).strict();
function baseUrl(){
  const url=process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if(!url || !url.startsWith('https://'))throw new Error('Public HTTPS site URL required');
  return url.replace(/\/$/,'');
}
export async function createSubportalCheckout(input:{
  organizationId:string;offerId:string;email:string;name:string;
  type?:'stripe-test'|'square-full';
}){
  const manifest=await loadSubportalManifest(input.organizationId);
  const offer=requireSubportalOffer(manifest,input.offerId);
  const buyer=Buyer.parse({email:input.email,name:input.name});
  const requestedProvider=input.type==='stripe-test'?'stripe':input.type==='square-full'?'square':offer.provider;
  if(offer.provider!==requestedProvider)throw new Error('Checkout provider does not match trusted offer mapping');
  const base=baseUrl();
  if(offer.provider==='stripe'){
    const session=await getStripe().checkout.sessions.create({
      mode:'payment',customer_email:buyer.email,
      line_items:[{price_data:{
        currency:'cad',unit_amount:offer.amountCadCents,product_data:{name:offer.title},
      },quantity:1}],
      success_url:base+'/portal/login?subportal_session_id={CHECKOUT_SESSION_ID}',
      cancel_url:base+'/portal/'+encodeURIComponent(manifest.orgSlug),
      metadata:{subportalBrick:'v1',organizationId:manifest.organizationId,offerId:offer.id},
    },{idempotencyKey:'subportal-checkout-'+randomUUID()});
    if(!session.url)throw new Error('Provider did not return a Stripe checkout URL');
    await recordProviderCheckout({checkoutId:session.id,organizationId:manifest.organizationId,
      offerId:offer.id,buyerEmail:buyer.email,buyerName:buyer.name,
      provider:'stripe',amountCadCents:offer.amountCadCents});
    return {sessionId:session.id,checkoutUrl:session.url,entitlement:'pending:'+offer.id};
  }
  const token=process.env.SQUARE_ACCESS_TOKEN;
  const location=process.env.SQUARE_LOCATION_ID;
  if(!token || !location || !offer.squareCatalogObjectId)
    throw new Error('Square catalog mapping or credentials missing');
  const res=await fetch('https://connect.squareup.com/v2/online-checkout/payment-links',{
    method:'POST',headers:{Authorization:'Bearer '+token,'Square-Version':'2026-09-16','Content-Type':'application/json'},
    body:JSON.stringify({idempotency_key:randomUUID(),order:{
      location_id:location,line_items:[{catalog_object_id:offer.squareCatalogObjectId,quantity:'1'}]},
      checkout_options:{redirect_url:base+'/portal/login'},pre_populated_data:{buyer_email:buyer.email}}),
    signal:AbortSignal.timeout(15000),
  });
  if(!res.ok)throw new Error('Square payment link failed: HTTP '+res.status);
  const body=await res.json() as {payment_link?:{id?:string;order_id?:string;url?:string}};
  const checkoutId=body.payment_link?.order_id;
  if(!checkoutId || !body.payment_link?.url)throw new Error('Square checkout lacks a correlated order ID');
  await recordProviderCheckout({checkoutId,organizationId:manifest.organizationId,
    offerId:offer.id,buyerEmail:buyer.email,buyerName:buyer.name,
    provider:'square',amountCadCents:offer.amountCadCents});
  return {sessionId:checkoutId,checkoutUrl:body.payment_link.url,entitlement:'pending:'+offer.id};
}
