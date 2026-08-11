import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import { decryptPostizToken, listPostizConnections, postizConfigured } from '@/lib/postiz-client';

export const dynamic = 'force-dynamic';
const TOKEN_COOKIE = 'amplifi_postiz_token';

export async function GET(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const configured = postizConfigured();
  const token = decryptPostizToken(req.cookies.get(TOKEN_COOKIE)?.value);
  if (!configured || !token) return NextResponse.json({ ok: true, configured, connected: false, connections: [] });
  try {
    const connections = await listPostizConnections(token);
    return NextResponse.json({ ok: true, configured: true, connected: true, connections });
  } catch {
    const response = NextResponse.json({ ok: false, configured: true, connected: false, connections: [], error: 'Reconnect your Postiz account.' }, { status: 401 });
    response.cookies.delete(TOKEN_COOKIE);
    return response;
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(TOKEN_COOKIE);
  return response;
}
