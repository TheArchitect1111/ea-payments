import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import { createGatewayConnectUrl, isAyrshareConfigured } from '@/lib/amplifi-publishing-gateway';

export const dynamic = 'force-dynamic';

function safeReturnPath(value: string | null, slug: string): string {
  const fallback = `/portal/${slug}/amplifi`;
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback;
  return value;
}

export async function GET(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);

  if (!isAyrshareConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'Amplifi publishing gateway is not configured yet.' },
      { status: 503 },
    );
  }

  try {
    const returnPath = safeReturnPath(req.nextUrl.searchParams.get('return'), auth.session.slug);
    const redirectUrl = new URL(returnPath, req.nextUrl.origin).toString();
    const connectUrl = await createGatewayConnectUrl(auth.session.slug, redirectUrl);
    return NextResponse.redirect(connectUrl);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Could not start social account connection.' },
      { status: 502 },
    );
  }
}
