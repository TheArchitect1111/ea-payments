/** The four universal sockets. No client-specific imports, offers or slugs. */
import type {Brick,CheckoutRequest,CheckoutResult,WelcomeRequest,WelcomeResult,BrickHealth} from '../BrickInterface';
import {loadSubportalManifest,requireSubportalOffer} from '@/lib/subportal/manifest';
import {subportalStoreHealth,subportalDb} from '@/lib/subportal/db';
import {createSubportalCheckout} from '@/lib/subportal/commerce';
import {verifiedSubportalWelcome} from '@/lib/subportal/delivery';

export async function createSubportalBrick(input:{
  organizationId:string;offerId:string;studentEmail:string;studentName:string;
}):Promise<Brick>{
  const installed=await loadSubportalManifest(input.organizationId);
  const installedOffer=requireSubportalOffer(installed,input.offerId);
  let liveHealth=false;
  return {
    id:'subportal',
    async health():Promise<BrickHealth>{
      liveHealth=false;
      try{
        const manifest=await loadSubportalManifest(input.organizationId);
        const offer=requireSubportalOffer(manifest,input.offerId);
        const db=await subportalStoreHealth();
        if(!db.ok)throw new Error(db.evidence);
        if(!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
          throw new Error('Clerk is not configured');
        const verifyRes=await fetch('https://api.resend.com/domains',{
          headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY},cache:'no-store',
          signal:AbortSignal.timeout(12000),
        });
        if(!verifyRes.ok)throw new Error('Resend account verification failed');
        if(!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL)
          throw new Error('Resend email is not configured');
        if(offer.provider==='stripe'){
          if(!process.env.STRIPE_SECRET_KEY)throw new Error('Stripe provider is not configured');
          const {getStripe}=await import('@/lib/stripe');
          await getStripe().accounts.retrieve();
        }
        if(offer.provider==='square'){
          if(!process.env.SQUARE_ACCESS_TOKEN ||
            !process.env.SQUARE_LOCATION_ID || !process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ||
            !process.env.SUBPORTAL_SQUARE_WEBHOOK_URL)
            throw new Error('Square provider is not configured');
          const res=await fetch('https://connect.squareup.com/v2/locations',{
            headers:{Authorization:'Bearer '+process.env.SQUARE_ACCESS_TOKEN,
              'Square-Version':'2026-09-16'},signal:AbortSignal.timeout(12000),
          });
          if(!res.ok)throw new Error('Square account verification failed');
        }
        const release=await subportalDb<{status:string;gate_results:Record<string,boolean>}>('subportal_certifications',{
          query:{version:'eq.v1',select:'status,gate_results',limit:'1'},
        });
        const checks=release[0]?.gate_results;
        liveHealth=release[0]?.status==='certified' &&
          Boolean(checks && Object.keys(checks).length===20 && Object.values(checks).every(Boolean));
        if(!liveHealth)
          return {status:503,evidence:'Real provider and database checks passed; 20-gate certification is incomplete'};
        return {status:200,evidence:'Live providers, database, and durable 20-gate certification passed'};
      }catch(e){return {status:503,evidence:e instanceof Error?e.message:'Subportal health check failed'};}
    },
    price(){
      // Resolved at adapter initialization from a durable tenant manifest.
      return {amountCad:installedOffer.amountCadCents/100,
        contractId:installed.organizationId+':'+installedOffer.id};
    },
    async checkout(opts:CheckoutRequest):Promise<CheckoutResult>{
      if(opts.courseId!==input.offerId)throw new Error('Offer mismatch');
      return createSubportalCheckout({organizationId:input.organizationId,offerId:input.offerId,
        email:input.studentEmail,name:input.studentName,type:opts.type});
    },
    async welcome(payment:WelcomeRequest):Promise<WelcomeResult>{
      return verifiedSubportalWelcome(payment.sessionId);
    },
    attach(){return liveHealth;},
  };
}
