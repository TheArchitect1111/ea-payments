import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { roleAtLeast } from '@/lib/rbac';
import { getAmandaDelivery, markAmandaDeliveryOpened } from '@/lib/amanda-catherine/delivery-store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await guardPortalApi(req);
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  const { id } = await params;
  const delivery = await getAmandaDelivery(id);
  const admin = Boolean(auth.session.role && roleAtLeast(auth.session.role, 'admin'));
  const email = auth.session.email?.trim().toLowerCase();
  if (
    !delivery ||
    delivery.portalSlug !== tenant.portalSlug ||
    (!admin && delivery.recipientEmail !== email)
  ) {
    return NextResponse.json({ ok: false, error: 'Delivery not found.' }, { status: 404 });
  }
  await markAmandaDeliveryOpened(id);
  return NextResponse.redirect(delivery.url);
}
