import { NextRequest, NextResponse } from 'next/server';
import { getLegalAuditHistory } from '@/lib/trust-engine/audit';

export const dynamic = 'force-dynamic';

/** GET /api/trust/audit?organizationId=&userId=&limit= */
export async function GET(req: NextRequest) {
  const organizationId = req.nextUrl.searchParams.get('organizationId') || undefined;
  const userId = req.nextUrl.searchParams.get('userId') || undefined;
  const clientId = req.nextUrl.searchParams.get('clientId') || undefined;
  const limit = Number(req.nextUrl.searchParams.get('limit') || 50);
  const events = await getLegalAuditHistory({ organizationId, userId, clientId, limit });
  return NextResponse.json({ ok: true, events });
}
