import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { listAmandaPayments } from '@/lib/amanda-catherine/payment-fulfillment';
import { AMANDA_OFFERS } from '@/lib/amanda-catherine/config';
import { createAmandaReceiptPdf } from '@/lib/amanda-catherine/receipt-pdf';
import { listStudioRecords } from '@/lib/creative-studio/persistence';
import { syntheticOrgId } from '@/lib/platform-store';

export const dynamic = 'force-dynamic';
type SquareReceipt = {
  id?: string; email: string; class_name?: string; class_id: string;
  payment_status: string; payment_reference?: string; expected_amount: number;
  paid_amount_cad?: number; paid_at?: string; created_at: string;
  is_test: boolean;
};
function download(pdf: Buffer) {
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Amanda-Catherine-Receipt.pdf"',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
export async function GET(req: NextRequest) {
  const auth = await guardPortalApi(req);
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  const email = (auth.session.email || '').trim().toLowerCase();
  if (tenant.portalSlug !== 'amanda-catherine' || !email) return new Response(null, { status: 403 });

  if (req.nextUrl.searchParams.get('provider') === 'square') {
    const reference = req.nextUrl.searchParams.get('ref') || '';
    if (!/^[A-Za-z0-9_-]{8,120}$/.test(reference)) return new Response(null, { status: 400 });
    const records = await listStudioRecords<SquareReceipt>('experience', syntheticOrgId('amanda-catherine'));
    const match = records.find(row => row.id?.startsWith('amanda-square-order-') &&
      row.email?.toLowerCase() === email && row.payment_reference === reference &&
      row.payment_status === 'paid' && row.is_test === false);
    if (!match) return new Response(null, { status: 404 });
    return download(createAmandaReceiptPdf({
      customer: email,
      program: match.class_name || match.class_id,
      amountCad: match.paid_amount_cad ?? match.expected_amount / 100,
      provider: 'Square', reference, paidAt: match.paid_at || match.created_at,
      isTest: false,
    }));
  }

  const sessionId = req.nextUrl.searchParams.get('sessionId') || '';
  if (!/^cs_[A-Za-z0-9_]{8,250}$/.test(sessionId)) return new Response(null, { status: 400 });
  const payments = await listAmandaPayments('amanda-catherine', email);
  const record = payments.find(row => row.stripeSessionId === sessionId && row.paymentStatus === 'paid');
  if (!record) return new Response(null, { status: 404 });
  const offer = AMANDA_OFFERS.find(item => item.id === record.offerId);
  return download(createAmandaReceiptPdf({
    customer: email,
    program: offer?.name || record.membershipId || 'Amanda Catherine enrollment',
    amountCad: record.amountPaidCad, provider: 'Stripe',
    reference: record.stripeSessionId, paidAt: record.recordedAt,
    isTest: Boolean(record.isTestAccess), expiresAt: record.expiresAt,
  }));
}
