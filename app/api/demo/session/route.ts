import { NextResponse } from 'next/server';
import { ensureDemoConnectTenant } from '@/lib/connect-provision';
import { ensureDemoClient, getDemoCredentials } from '@/lib/demo-client';
import { makeSessionCookie, signSession } from '@/lib/ea-portal-auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  const provision = await ensureDemoClient();
  if (!provision.ok) {
    return NextResponse.json({ ok: false, error: provision.error ?? 'Demo not available.' }, { status: 503 });
  }

  try {
    await ensureDemoConnectTenant();
  } catch (err) {
    console.error('[connect] demo tenant ensure failed', err);
  }

  const demo = getDemoCredentials();
  const token = await signSession(demo.slug);
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Session failed.' }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true, slug: demo.slug, guest: true });
  res.cookies.set(makeSessionCookie(token));
  return res;
}
