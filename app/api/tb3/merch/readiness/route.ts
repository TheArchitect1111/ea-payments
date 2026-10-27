import type {NextRequest} from 'next/server';
import {authorize,handled,json} from '@/lib/tb3/server';
import {getStripeMerchantStatus} from '@/lib/bricks/merchant-onboarding/stripe-connect';
import {stripeMerchantStore} from '@/lib/bricks/merchant-onboarding/stripe-store';
import {auditTb3PrintfulCatalog} from '@/lib/tb3/printful-catalog-audit';

export const runtime='nodejs';
export const dynamic='force-dynamic';

/** Staff-only read-only check: never enables payment, publishes products or
 * changes provider accounts. Certification still requires a real order proof. */
export async function GET(req:NextRequest) {
  return handled(async()=>{
    await authorize(req,true);
    const isProduction=process.env.VERCEL_ENV==='production';
    const flags={
      checkoutRequested:process.env.TB3_MERCH_CHECKOUT_ENABLED==='true',
      ownerFulfillmentApproved:process.env.TB3_MERCH_AUTO_FULFILLMENT_APPROVED==='true',
      printfulFundingVerified:process.env.TB3_PRINTFUL_FUNDING_VERIFIED==='true',
      draftFulfillmentApproved:process.env.TB3_MERCH_DRAFT_FULFILLMENT_APPROVED==='true',
      printfulCatalogAttested:process.env.TB3_PRINTFUL_CATALOG_VERIFIED==='true',
      maxFulfillmentCostConfigured:Number.isSafeInteger(Number(process.env.TB3_MERCH_MAX_PRINTFUL_COST_CENTS)) &&
        Number(process.env.TB3_MERCH_MAX_PRINTFUL_COST_CENTS)>0,
    };
    let merchantReady=false;
    if(process.env.EA_MERCHANT_DATABASE_URL &&
       process.env.EA_STRIPE_CONNECT_SECRET_KEY?.startsWith('sk_live_')) {
      try {
        const merchant=await getStripeMerchantStatus('tarris',stripeMerchantStore);
        merchantReady=merchant.status==='ready' && merchant.chargesEnabled &&
          merchant.payoutsEnabled && Boolean(merchant.providerMerchantReference);
      }catch{merchantReady=false;}
    }
    let matchedProductCount=0;
    let catalogVerified=false;
    if(process.env.PRINTFUL_API_KEY?.trim()) {
      try {
        const audit=await auditTb3PrintfulCatalog();
        matchedProductCount=audit.matchedProductCount;
        catalogVerified=audit.verified;
      }catch{catalogVerified=false;}
    }
    const readyForRealOrderTest=isProduction && merchantReady && catalogVerified &&
      Object.values(flags).every(Boolean) &&
      Boolean(process.env.EA_STRIPE_CONNECT_WEBHOOK_SECRET);
    return json({
      tenant:'tarris',source:'provider-readonly-launch-audit',
      isProduction,merchantReady,printfulProductsMatched:matchedProductCount,
      printfulCatalogVerified:catalogVerified,flags,
      readyForRealOrderTest,liveOrderCertified:false,
      readyForLaunch:false,
      nextGate:readyForRealOrderTest
        ? 'A separately authorized real paid checkout and Printful fulfillment confirmation is required.'
        : 'Complete remaining provider, identity, funding, or catalog verification gates.',
      note:'This check never places an order, charges a card, verifies receipt of a parent loan, or publishes the Instagram catalog.',
    });
  });
}
