import type Stripe from 'stripe';
import {createHash} from 'node:crypto';
import {registerAmandaSignup,registerAmandaPaid} from './brick-events';

export async function registerAmandaCheckout(input:{registrationId:string;brickId:string;name:string;email:string;phone?:string;source:string;isTest?:boolean}) {
 const result=await registerAmandaSignup(input);
 if(!result.ok)throw new Error(result.error||'Registration tracking could not be saved.');
 return result;
}

/** Called only after a signed webhook or server-side Stripe retrieval is verified. */
export async function recordAmandaVerifiedPayment(session:Stripe.Checkout.Session,brickId:string,isTest=false) {
 if(session.metadata?.portalSlug!=='amanda-catherine'||session.payment_status!=='paid')throw new Error('Verified Amanda payment required.');
 isTest=isTest||process.env.VERCEL_ENV==='preview';
 const email=(session.metadata.clientEmail||session.customer_details?.email||session.customer_email||'').trim().toLowerCase();
 if(!/^\S+@\S+\.\S+$/.test(email))throw new Error('Verified customer email is missing.');
 const name=session.metadata.clientName||session.customer_details?.name||email;
 const registrationId=session.metadata.registrationId||'stripe-'+createHash('sha256').update(session.id).digest('hex').slice(0,32);
 // Legacy paid sessions predate signup metadata. Recover once from trusted Stripe identity.
 if(!session.metadata.registrationId)await registerAmandaCheckout({registrationId,brickId,name,email,
  phone:session.customer_details?.phone||'',source:'stripe/legacy-recovery',isTest});
 const reference=typeof session.payment_intent==='string'?session.payment_intent:session.payment_intent?.id||session.id;
 const result=await registerAmandaPaid({registrationId,brickId,name,email,phone:session.customer_details?.phone||'',
  reference,timestamp:new Date().toISOString(),isTest});
 if(!result.ok)throw new Error(result.error||'Verified payment tracking failed.');
 return {registrationId,...result};
}
