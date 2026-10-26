import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, parseAdminSession } from '@/lib/ea-admin-auth';
import { startStripeOnboarding, getStripeMerchantStatus } from '@/lib/bricks/merchant-onboarding/stripe-connect';
import { stripeMerchantStore } from '@/lib/bricks/merchant-onboarding/stripe-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const reply = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

/** EA-admin-only setup. The Bouie family gets Stripe's own onboarding URL,
 * not an EA portal login, password, or permission to change payout mappings.
 * Preview test mode ONLY until explicit merchant release approval.
 */
export async function POST(req: NextRequest) {
  if (process.env.VERCEL_ENV !== 'preview') return reply({ error: 'Sandbox only' }, 403);
  const token = (await cookies()).get(EA_ADMIN_COOKIE)?.value;
  const admin = parseAdminSession(token);
  if (!admin || !['owner', 'admin'].includes(admin.role.toLowerCase()) || admin.email === 'admin')
    return reply({ error: 'Not authorized' }, 403);
  if (req.headers.get('origin') !== req.nextUrl.origin)
    return reply({ error: 'Origin mismatch' }, 403);
  if (process.env.EA_STRIPE_CONNECT_ONBOARDING_ENABLED !== 'true' ||
      process.env.EA_STRIPE_CONNECT_USE_EXISTING_TEST_KEY !== 'true' ||
      !process.env.STRIPE_TEST_SECRET_KEY?.startsWith('sk_test_') ||
      !process.env.EA_MERCHANT_DATABASE_URL)
    return reply({ error: 'Stripe sandbox unavailable' }, 503);
  let email: string;
  try {
    const input = await req.json() as { familyEmail?: unknown };
    email = typeof input.familyEmail === 'string' ? input.familyEmail.trim().toLowerCase() : '';
  } catch { return reply({ error: 'Invalid body' }, 400); }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
    return reply({ error: 'Enter the authorized Bouie family member email' }, 400);
  try {
    const origin = req.nextUrl.origin;
    const callback = new URL('/tarris/stripe-setup-complete', origin);
    const refresh = new URL('/tarris/stripe-setup-complete?refresh=1', origin);
    const result = await startStripeOnboarding({
      tenantId: 'tarris', ownerEmail: email,
      returnUrl: callback.toString(), refreshUrl: refresh.toString(),
      store: stripeMerchantStore,
    });
    // A short-lived Stripe-hosted URL may be shared with the approved family member.
    return reply({ url: result.url, provider: 'stripe', environment: 'test' });
  } catch {
    return reply({ error: 'Unable to start Stripe sandbox onboarding' }, 503);
  }
}

export async function GET() {
  const token = (await cookies()).get(EA_ADMIN_COOKIE)?.value;
  const admin = parseAdminSession(token);
  if (!admin || !['owner', 'admin'].includes(admin.role.toLowerCase()) || admin.email === 'admin')
    return reply({ error: 'Not authorized' }, 403);
  if (process.env.VERCEL_ENV !== 'preview') return reply({ error: 'Sandbox only' }, 403);
  try {
    const status = await getStripeMerchantStatus('tarris', stripeMerchantStore);
    return reply({ status: status.status, chargesEnabled: status.chargesEnabled, payoutsEnabled: status.payoutsEnabled, environment: 'test' });
  } catch { return reply({ status: 'setup_required' }, 503); }
}
