import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'node:crypto';
import { requireTb3MerchantSession } from '@/lib/tb3/merchant-access';
import { cookies } from 'next/headers';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { getStripeMerchantStatus, startStripeOnboarding } from '@/lib/bricks/merchant-onboarding/stripe-connect';
import { stripeMerchantStore } from '@/lib/bricks/merchant-onboarding/stripe-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const respond = (payload: unknown, status = 200) =>
  NextResponse.json(payload, {status,headers:{'Cache-Control':'no-store'}});

async function authorize(slug: string) {
  if (!/^[a-z0-9][a-z0-9_-]{1,100}$/i.test(slug)) return null;
  if (slug === 'tarris') return requireTb3MerchantSession();
  // Preserve all existing non-TB3 merchant authorization contracts.
  const token = (await cookies()).get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session || session.slug !== slug || !['owner','admin'].includes(session.role ?? '') || !session.email) return null;
  return session;
}

function approvedTb3Code(value: unknown): boolean {
  if (process.env.VERCEL_ENV !== 'preview') return false;
  if (typeof value !== 'string' || !/^[a-f0-9]{24}$/.test(value))
    return false;

  const expected = process.env.TB3_PAYMENT_APPROVAL_CODE_HASH;
  if (!expected || !/^[a-f0-9]{64}$/.test(expected))
    return false;

  const actual = createHash('sha256')
    .update(value)
    .digest('hex');

  return timingSafeEqual(
    Buffer.from(actual, 'hex'),
    Buffer.from(expected, 'hex')
  );
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
  const sandbox = slug === 'tarris' && process.env.VERCEL_ENV === 'preview' && _req.nextUrl.searchParams.get('sandbox') === '1';
  // Public TB3 setup may check availability, never account identifiers.
  // Other tenants retain their original authorization.
  if (slug !== 'tarris' && !await authorize(slug))
    return respond({error:'Not authorized'},403);
  if (!configured()) {
    if (slug === 'tarris' && process.env.VERCEL_ENV === 'preview') {
      return respond({
        available:false,
        status:'setup_required',
        diagnostic:'configuration'
      });
    }
    return respond({available:false,status:'setup_required'});
  }
  try {
    const status = await getStripeMerchantStatus(sandbox ? 'tarris-sandbox' : slug,stripeMerchantStore);
    return respond({available:true,status:status.status,
      chargesEnabled:status.chargesEnabled,payoutsEnabled:status.payoutsEnabled});
  } catch {
    if (slug === 'tarris' && process.env.VERCEL_ENV === 'preview') {
      return respond({
        available:false,
        status:'setup_required',
        diagnostic:'provider_or_database'
      },503);
    }
    return respond({available:false,status:'setup_required'},503);
  }
}
export async function POST(req:NextRequest,{params}:{params:Promise<{slug:string}>}) {
  const {slug} = await params;
  if (req.headers.get('origin') !== req.nextUrl.origin)
    return respond({error:'Origin mismatch'},403);

  let ownerEmail: string;
  let sandbox = false;

  if (slug === 'tarris') {
    let input: {
      approvalCode?: unknown;
      familyEmail?: unknown;
      sandbox?: unknown;
    };

    try {
      input = await req.json();
    } catch {
      return respond({error:'Invalid request'},400);
    }

    if (!approvedTb3Code(input.approvalCode))
      return respond({error:'TB3 approval required'},403);

    sandbox = process.env.VERCEL_ENV === 'preview' && input.sandbox === true;
    ownerEmail = typeof input.familyEmail === 'string'
      ? input.familyEmail.trim().toLowerCase()
      : '';

    if (
      ownerEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)
    ) {
      return respond({error:'Valid family email required'},400);
    }
  } else {
    const session = await authorize(slug);
    if (!session) return respond({error:'Not authorized'},403);
    ownerEmail = session.email!;
  }

  if (!configured())
    return respond({error:'Merchant onboarding not configured'},503);

  try {
    const origin = process.env.EA_STRIPE_CONNECT_PORTAL_ORIGIN ||
      'https://' + process.env.VERCEL_URL;
    const target = new URL(slug === 'tarris' ? '/tarris/future/payment-setup' : '/portal/'+encodeURIComponent(slug)+'/reports',origin);
    target.searchParams.set('payments','returned');
    if (sandbox) target.searchParams.set('sandbox','1');
    const refresh = new URL(slug === 'tarris' ? '/tarris/future/payment-setup' : '/portal/'+encodeURIComponent(slug)+'/reports',origin);
    refresh.searchParams.set('payments','refresh');
    if (sandbox) refresh.searchParams.set('sandbox','1');
    const linked = await startStripeOnboarding({
      tenantId:sandbox ? 'tarris-sandbox' : slug,ownerEmail,
      returnUrl:target.toString(),refreshUrl:refresh.toString(),
      store:stripeMerchantStore,
    });
    return respond({url:linked.url});
  } catch (error) {
    // Preview-only troubleshooting without logging credentials, emails or account IDs.
    if (slug === 'tarris' && process.env.VERCEL_ENV === 'preview') {
      const type = error instanceof Error ? error.name : 'UnknownError';
      const code = error && typeof error === 'object' && 'code' in error
        && typeof error.code === 'string' ? error.code : 'unknown';
      const safeReasons = ['Untrusted return URL','Trusted portal origin not configured','Concurrent account mapping changed; retry onboarding','Connected account tenant or type mismatch','Merchant registry write unconfirmed','Stripe Connect key does not match deployment environment'];
      const reason = error instanceof Error && safeReasons.includes(error.message) ? error.message : 'other';
      console.error('TB3_STRIPE_ONBOARDING_FAILURE', {type,code,reason,sandbox});
      return respond({error:'Unable to initiate secure Stripe onboarding',diagnostic:'onboarding_failed',errorType:type,errorCode:code},503);
    }
    return respond({error:'Unable to initiate secure Stripe onboarding'},503);
  }
}
