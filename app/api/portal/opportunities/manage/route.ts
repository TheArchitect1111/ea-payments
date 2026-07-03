import { NextResponse } from 'next/server';
import { guardPortalApiCookie, portalApiUnauthorized } from '@/lib/api/portal-route';
import { archiveConsiderCapture, duplicateConsiderCapture } from '@/lib/opportunity-tracking';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await guardPortalApiCookie({ realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const session = auth.session;

  const body = (await req.json()) as { action?: string; recordId?: string; slug?: string };

  if (body.action === 'archive' && body.recordId) {
    const result = await archiveConsiderCapture(body.recordId);
    return NextResponse.json(result);
  }

  if (body.action === 'duplicate' && body.slug) {
    const result = await duplicateConsiderCapture(body.slug);
    return NextResponse.json(result);
  }

  return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
}
