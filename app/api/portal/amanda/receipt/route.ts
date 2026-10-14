import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { listAmandaPayments } from '@/lib/amanda-catherine/payment-fulfillment';
import { AMANDA_OFFERS } from '@/lib/amanda-catherine/config';
import { createAmandaReceiptPdf } from '@/lib/amanda-catherine/receipt-pdf';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await guardPortalApi(req);
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  const email = (auth.session.email || '').trim().toLowerCase();
  if (tenant.portalSlug !== 'amanda-catherine' || !email) return new Response(null, { status: 403 });
  const sessionId = req.nextUrl.searchParams.get('sessionId') || '';
  if (!/^cs_[A-Za-z0-9_]{8,250}$/.test(sessionId)) return new Response(null, { status: 400 });
  const payments = await listAmandaPayments('amanda-catherine', email);
  const record = payments.find(row => row.stripeSessionId === sessionId && row.paymentStatus === 'paid');
  if (!record) return new Response(null, { status: 404 });
  const offer = AMANDA_OFFERS.find(item => item.id === record.offerId);
  const pdf = createAmandaReceiptPdf({
    customer: email,
    program: offer?.name || record.membershipId || 'Amanda Catherine enrollment',
    amountCad: record.amountPaidCad, provider: 'Stripe',
    reference: record.stripeSessionId, paidAt: record.recordedAt,
    isTest: Boolean(record.isTestAccess), expiresAt: record.expiresAt,
  });
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Amanda-Catherine-Receipt.pdf"',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
