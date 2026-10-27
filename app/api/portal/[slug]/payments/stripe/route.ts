import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug;
  if (slug !== 'tarris') return NextResponse.json({ available: false, mode: 'unknown' }, { status: 404 });
  const hasKey = !!process.env.TB3_STRIPE_SECRET_KEY;
  return NextResponse.json({
    available: hasKey,
    mode: 'direct',
    status: hasKey ? 'setup_required' : 'missing_key',
    diagnostic: hasKey ? 'ready_for_acct_id' : 'no_key'
  });
}
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  if (params.slug !== 'tarris') return NextResponse.json({ error: 'not found' }, { status: 404 });
  try {
    const body = await req.json();
    const accountId = body.accountId || body.acct || body.stripe_account_id || '';
    if (!accountId.startsWith('acct_')) return NextResponse.json({ error: 'Invalid acct_ ID' }, { status: 400 });
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.TB3_STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' as any });
    const acct = await stripe.accounts.retrieve(accountId);
    return NextResponse.json({
      ok: true, mode: 'direct', accountId,
      charges_enabled: acct.charges_enabled,
      payouts_enabled: acct.payouts_enabled,
      details_submitted: acct.details_submitted,
      ready: acct.charges_enabled && acct.payouts_enabled
    });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
