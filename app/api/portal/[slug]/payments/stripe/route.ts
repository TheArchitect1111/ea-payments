import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'node:crypto';
import { requireTb3MerchantSession } from '@/lib/tb3/merchant-access';
import { cookies } from 'next/headers';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { getStripeMerchantStatus, startStripeOnboarding } from '@/lib/bricks/merchant-onboarding/stripe-connect';
import { stripeMerchantStore, saveDirectConnection, getDirectConnection } from '@/lib/bricks/merchant-onboarding/stripe-store';
import { verifyDirectAccount } from '@/lib/bricks/merchant-onboarding/stripe-direct';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const respond = (payload: unknown, status = 200) => NextResponse.json(payload, {status,headers:{'Cache-Control':'no-store'}});
async function authorize(slug: string) {
  if (!/^[a-z0-9][a-z0-9_-]{1,100}$/i.test(slug)) return null;
  if (slug === 'tarris') return requireTb3MerchantSession();
  const token = (await cookies()).get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session || session.slug !== slug || !['owner','admin'].includes(session.role ?? '') || !session.email) return null;
  return session;
}
function approvedTb3Code(value: unknown): boolean {
  if (process.env.VERCEL_ENV !== 'preview') return false;
  if (typeof value !== 'string' || !/^[a-f0-9]{24}$/.test(value)) return false;
  const expected = process.env.TB3_PAYMENT_APPROVAL_CODE_HASH;
  if (!expected || !/^[a-f0-9]{64}$/.test(expected)) return false;
  const actual = createHash('sha256').update(value).digest('hex');
  return timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}
const configuredDirect = () => !!process.env.TB3_STRIPE_SECRET_KEY && !!process.env.EA_MERCHANT_DATABASE_URL;
const configuredConnect = () => process.env.EA_STRIPE_CONNECT_ONBOARDING_ENABLED === 'true' && !!process.env.EA_MERCHANT_DATABASE_URL;
export async function GET(_req: NextRequest,{params}:{params:Promise<{slug:string}>}) {
  const {slug} = await params;
  const sandbox = slug === 'tarris' && process.env.VERCEL_ENV === 'preview' && _req.nextUrl.searchParams.get('sandbox') === '1';
  if (slug !== 'tarris' && !await authorize(slug)) return respond({error:'Not authorized'},403);
  if (slug === 'tarris' && configuredDirect()) {
    try {
      const conn = await getDirectConnection(sandbox ? 'tarris-sandbox' : slug);
      if (conn?.stripe_account_id) {
        try {
          const verified = await verifyDirectAccount(conn.stripe_account_id);
          return respond({available:true,mode:'direct',status: verified.ready ? 'active':'pending',chargesEnabled:verified.charges_enabled,payoutsEnabled:verified.payouts_enabled,accountId:verified.accountId});
        } catch { return respond({available:true,mode:'direct',status:'pending',chargesEnabled:false,payoutsEnabled:false,storedAccountId:conn.stripe_account_id}); }
      }
      return respond({available:true,mode:'direct',status:'setup_required'});
    } catch { return respond({available:false,mode:'direct',status:'setup_required',diagnostic:'provider_or_database'},503); }
  }
  return respond({available:false,status:'setup_required',diagnostic:'configuration',mode:'direct'});
}
export async function POST(req:NextRequest,{params}:{params:Promise<{slug:string}>}) {
  const {slug} = await params;
  if (req.headers.get('origin') !== req.nextUrl.origin) return respond({error:'Origin mismatch'},403);
  let body: any;
  try { body = await req.json(); } catch { return respond({error:'Invalid request'},400); }
  if (slug === 'tarris') {
    if (!approvedTb3Code(body.approvalCode)) return respond({error:'TB3 approval required'},403);
    const sandbox = process.env.VERCEL_ENV === 'preview' && body.sandbox === true;
    const ownerEmail = typeof body.familyEmail === 'string' ? body.familyEmail.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) return respond({error:'Valid family email required'},400);
    const accountId = typeof body.accountId === 'string' ? body.accountId.trim() : '';
    if (!accountId) return respond({error:'Stripe Account ID required (acct_...)'},400);
    if (!configuredDirect()) return respond({error:'Direct Stripe not configured - set TB3_STRIPE_SECRET_KEY'},503);
    try {
      const verified = await verifyDirectAccount(accountId);
      await saveDirectConnection(sandbox ? 'tarris-sandbox' : slug, verified.accountId, {charges_enabled:verified.charges_enabled,payouts_enabled:verified.payouts_enabled,details_submitted:verified.details_submitted});
      return respond({ok:true,mode:'direct',accountId:verified.accountId,chargesEnabled:verified.charges_enabled,payoutsEnabled:verified.payouts_enabled,ready:verified.ready});
    } catch (error: any) { return respond({error:'Unable to verify Stripe account',details:error?.message},400); }
  }
  return respond({error:'Not authorized for this tenant'},403);
}
