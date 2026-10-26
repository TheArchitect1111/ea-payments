import {NextResponse} from 'next/server';
import {buildTb3MetaFeed} from '@/lib/tb3/meta-feed';
import catalog from '@/public/tb3/merch/manifest.json';
import {getStripeMerchantStatus} from '@/lib/bricks/merchant-onboarding/stripe-connect';
import {stripeMerchantStore} from '@/lib/bricks/merchant-onboarding/stripe-store';
import {auditTb3PrintfulCatalog} from '@/lib/tb3/printful-catalog-audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Meta can only import products that are actually purchasable on the
// seller's verified domain. Never advertise pending products as in stock.
async function ready() {
  const configurationOk = process.env.VERCEL_ENV === 'production' &&
    process.env.TB3_MERCH_CHECKOUT_ENABLED === 'true' &&
    process.env.TB3_MERCH_AUTO_FULFILLMENT_APPROVED === 'true' &&
    process.env.TB3_PRINTFUL_FUNDING_VERIFIED === 'true' &&
    process.env.TB3_PRINTFUL_CATALOG_VERIFIED === 'true' &&
    process.env.TB3_MERCH_DRAFT_FULFILLMENT_APPROVED === 'true' &&
    !!process.env.PRINTFUL_API_KEY?.trim() &&
    !!process.env.EA_MERCHANT_DATABASE_URL &&
    !!process.env.EA_STRIPE_CONNECT_WEBHOOK_SECRET &&
    !!process.env.EA_STRIPE_CONNECT_SECRET_KEY?.startsWith('sk_live_') &&
    Number.isSafeInteger(Number(process.env.TB3_MERCH_MAX_PRINTFUL_COST_CENTS)) &&
    Number(process.env.TB3_MERCH_MAX_PRINTFUL_COST_CENTS) > 0;
  if (!configurationOk) return false;
  try {
    const merchant = await getStripeMerchantStatus('tarris', stripeMerchantStore);
    if (merchant.status !== 'ready' || !merchant.chargesEnabled || !merchant.payoutsEnabled) return false;
    const liveCatalog = await auditTb3PrintfulCatalog();
    return liveCatalog.verified;
  } catch { return false; }
}
export async function GET() {
  if (!(await ready())) return NextResponse.json({
    error: 'TB3 catalog is not yet eligible for public sales.',
  }, {status:503,headers:{'Cache-Control':'no-store'}});
  return new NextResponse(buildTb3MetaFeed({
    checkoutLive: true,
    verifiedAvailableVariantIds: new Set(catalog.flatMap(p=>p.variants.map(v=>v.id))),
  }),{
    status:200,
    headers:{
      'Content-Type':'text/csv; charset=utf-8',
      'Content-Disposition':'inline; filename="tb3-meta-catalog.csv"',
      'Cache-Control':'no-store',
      'X-Content-Type-Options':'nosniff',
    },
  });
}
