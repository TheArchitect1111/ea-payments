import { NextRequest, NextResponse } from 'next/server';
import { getProductLegalPack, PRODUCT_LEGAL_PACKS } from '@/lib/trust-engine/legal-pack';
import type { TrustProductId } from '@/lib/trust-engine/types';

export const dynamic = 'force-dynamic';

/** GET /api/trust/product-pack?productId= */
export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('productId') as TrustProductId | null;
  if (!productId) {
    return NextResponse.json({ ok: true, packs: PRODUCT_LEGAL_PACKS });
  }
  const pack = getProductLegalPack(productId);
  if (!pack) {
    return NextResponse.json({ ok: false, error: 'Unknown product' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, pack });
}
