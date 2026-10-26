import { NextRequest, NextResponse } from 'next/server';
import { requireTb3MerchantSession } from '@/lib/tb3/merchant-access';
import { getStripeMerchantStatus, startStripeOnboarding } from '@/lib/bricks/merchant-onboarding/stripe-connect';
import { stripeMerchantStore } from '@/lib/bricks/merchant-onboarding/stripe-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const respond = (payload: unknown, status = 200) =>
  NextResponse.json(payload, {status,headers:{'Cache-Control':'no-store'}});

async function authorize(slug: string) {
  if (!/^[a-z0-9][a-z0-9_-]{1,100}$/i.test(slug)) return null;
  if (slug !== 'tarris') return null;
  return requireTb3MerchantSession();
}
const configured = () => process.env.EA_STRIPE_CONNECT_ONBOARDING_ENABLED === 'true'
  && ((process.env.EA_STRIPE_CONNECT_SECRET_KEY?.startsWith(
        process.env.VERCEL_ENV === 'production' ? 'sk_live_' : 'sk_test_') ?? false) ||
      (process.env.VERCEL_ENV === 'preview' &&
       process.env.EA_STRIPE_CONNECT_USE_EXISTING_TEST_KEY === 'true' &&
       (process.env.STRIPE_TEST_SECRET_KEY?.startsWith('sk_test_') ?? false)))
  && (!!process.env.EA_STRIPE_CONNECT_PORTAL_ORIGIN ||
      (process.env.VERCEL_ENV === 'preview' && !!process.env.VERCEL_URL))
  && !!process.env.EA_MERCHANT_DATABASE_URL;

export async function GET(_req: NextRequest,{params}:{params:Promise<{slug:string}>}) {
  const {slug} = await params;
  if (!await authorize(slug)) return respond({error:'Not authorized'},403);
  if (!configured()) return respond({available:false,status:'setup_required'});
  try {
    const status = await getStripeMerchantStatus(slug,stripeMerchantStore);
    return respond({available:true,status:status.status,
      chargesEnabled:status.chargesEnabled,payoutsEnabled:status.payoutsEnabled});
  } catch {
    return respond({available:false,status:'setup_required'},503);
  }
}
export async function POST(req:NextRequest,{params}:{params:Promise<{slug:string}>}) {
  const {slug} = await params;
  const session = await authorize(slug);
  if (!session) return respond({error:'Not authorized'},403);
  if (req.headers.get('origin') !== req.nextUrl.origin)
    return respond({error:'Origin mismatch'},403);
  if (!configured()) return respond({error:'Merchant onboarding not configured'},503);
  try {
    const origin = process.env.EA_STRIPE_CONNECT_PORTAL_ORIGIN ||
      'https://' + process.env.VERCEL_URL;
    const target = new URL(slug === 'tarris' ? '/tarris/future/payment-setup' : '/portal/'+encodeURIComponent(slug)+'/reports',origin);
    target.searchParams.set('payments','returned');
    const refresh = new URL(slug === 'tarris' ? '/tarris/future/payment-setup' : '/portal/'+encodeURIComponent(slug)+'/reports',origin);
    refresh.searchParams.set('payments','refresh');
    const linked = await startStripeOnboarding({
      tenantId:slug,ownerEmail:session.email!,
      returnUrl:target.toString(),refreshUrl:refresh.toString(),
      store:stripeMerchantStore,
    });
    return respond({url:linked.url});
  } catch {
    return respond({error:'Unable to initiate secure Stripe onboarding'},503);
  }
}
