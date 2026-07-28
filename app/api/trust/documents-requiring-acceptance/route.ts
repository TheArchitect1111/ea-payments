import { NextRequest, NextResponse } from 'next/server';
import { getDocumentsRequiringAcceptance } from '@/lib/trust-engine/status';
import { getClientLegalProfile } from '@/lib/trust-engine/client-store';
import type { TrustProductId } from '@/lib/trust-engine/types';

export const dynamic = 'force-dynamic';

/** GET /api/trust/documents-requiring-acceptance?productId=&clientId= */
export async function GET(req: NextRequest) {
  const productId = (req.nextUrl.searchParams.get('productId') ||
    'portal_products') as TrustProductId;
  const clientId = req.nextUrl.searchParams.get('clientId') || undefined;
  const profile = clientId ? await getClientLegalProfile(clientId) : null;
  const documents = getDocumentsRequiringAcceptance(productId, profile);
  return NextResponse.json({ ok: true, documents });
}
