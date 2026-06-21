import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession, EA_PORTAL_COOKIE } from '@/lib/ea-portal-auth';
import { archiveConsiderCapture, duplicateConsiderCapture } from '@/lib/opportunity-tracking';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

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
