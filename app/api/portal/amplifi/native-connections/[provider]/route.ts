import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import { deleteAmplifiConnections } from '@/lib/amplifi-connection-store';
import { isNativeProvider, providerCookie } from '@/lib/amplifi-native-social';

export async function DELETE(req: NextRequest, context: { params: Promise<{ provider: string }> }) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const { provider } = await context.params;
  if (!isNativeProvider(provider)) return NextResponse.json({ ok: false }, { status: 404 });
  await deleteAmplifiConnections(auth.session.slug, provider);
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(providerCookie(provider));
  return response;
}
