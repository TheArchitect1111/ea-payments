/** The four universal sockets. No client-specific imports, offers or slugs. */
import type {Brick,CheckoutRequest,CheckoutResult,WelcomeRequest,WelcomeResult,BrickHealth} from '../BrickInterface';
import {loadSubportalManifest,requireSubportalOffer} from '@/lib/subportal/manifest';
import {subportalStoreHealth} from '@/lib/subportal/db';
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
        if(!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
          process.env.SUBPORTAL_CLERK_THIRD_PARTY_READY!=='true')
          throw new Error('Clerk to Supabase third-party integration is not verified');
        if(!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL)
          throw new Error('Resend email is not configured');
        if(offer.provider==='stripe' && !process.env.STRIPE_SECRET_KEY)
          throw new Error('Stripe provider is not configured');
        if(offer.provider==='square' && (!process.env.SQUARE_ACCESS_TOKEN ||
          !process.env.SQUARE_LOCATION_ID || !process.env.SQUARE_WEBHOOK_SIGNATURE_KEY))
          throw new Error('Square provider is not configured');
        liveHealth=true;
        return {status:200,evidence:'Live manifest, Supabase tables, identity and provider dependencies responsive'};
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
    attach(){return liveHealth && process.env.SUBPORTAL_CERTIFIED_VERSION==='1';},
  };
}
