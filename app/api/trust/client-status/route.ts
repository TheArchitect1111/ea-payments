import { NextRequest, NextResponse } from 'next/server';
import { getClientLegalStatus } from '@/lib/trust-engine/api';
import { getClientLegalProfile } from '@/lib/trust-engine/client-store';
import type { TrustProductId } from '@/lib/trust-engine/types';

export const dynamic = 'force-dynamic';

/** GET /api/trust/client-status?productId=&clientId= */
export async function GET(req: NextRequest) {
  const productId = (req.nextUrl.searchParams.get('productId') ||
    'portal_products') as TrustProductId;
  const clientId = req.nextUrl.searchParams.get('clientId') || undefined;
  const profile = clientId ? await getClientLegalProfile(clientId) : null;
  const status = await getClientLegalStatus({ productId, clientId, profile });
  return NextResponse.json({ ok: true, status });
}
