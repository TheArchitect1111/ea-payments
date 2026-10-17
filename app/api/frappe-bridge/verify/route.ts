import { NextRequest, NextResponse } from 'next/server';
import { mockEnabled, verifyMock } from '@/lib/amanda-catherine/frappe-bridge-mock';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!mockEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const origin = req.headers.get('origin');
  if (origin && origin !== req.nextUrl.origin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  let token = '';
  try { token = (await req.json()).token; }
  catch { return NextResponse.json({ error: 'Invalid input' }, { status: 400 }); }

  const result = verifyMock(token);
  const headers = { 'Cache-Control': 'no-store' };
  if (result.courseAccess) return NextResponse.json({ email: result.email, courseAccess: true }, { status: 200, headers });
  const errors: Record<string, string> = {
    signature: 'Invalid signature',
    claims: 'Invalid token claims',
    expired: 'Token expired',
    replay: 'Token replay detected',
    format: 'Invalid token format',
  };
  return NextResponse.json({ error: errors[result.reason] ?? 'Access denied' }, { status: result.reason === 'disabled' ? 404 : 401, headers });
}
