import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { roleAtLeast } from '@/lib/rbac';
import type { PlatformRole } from '@/lib/rbac';
import {
  createAmandaDelivery,
  listAmandaDeliveries,
  type AmandaDeliveryKind,
} from '@/lib/amanda-catherine/delivery-store';
import { provisionAmandaClientAccess } from '@/lib/amanda-catherine/client-access';
import type { AmandaPortalAudience } from '@/lib/amanda-catherine/config';

export const dynamic = 'force-dynamic';

function isAmandaAdmin(role: PlatformRole | undefined) {
  return Boolean(role && roleAtLeast(role, 'admin'));
}

export async function GET(req: NextRequest) {
  const auth = await guardPortalApi(req);
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  if (!tenant.portalSlug.startsWith('amanda-catherine') || !auth.session.email) {
    return NextResponse.json({ ok: false, error: 'Amanda client delivery access required.' }, { status: 403 });
  }
  const admin = isAmandaAdmin(auth.session.role);
  const deliveries = await listAmandaDeliveries(
    tenant.portalSlug,
    admin ? undefined : auth.session.email,
  );
  return NextResponse.json({ ok: true, admin, deliveries });
}

export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req);
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  if (!tenant.portalSlug.startsWith('amanda-catherine') || !isAmandaAdmin(auth.session.role)) {
    return NextResponse.json({ ok: false, error: 'Amanda administrator access required.' }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    recipientEmail?: string;
    recipientName?: string;
    title?: string;
    kind?: AmandaDeliveryKind;
    url?: string;
    note?: string;
    audience?: AmandaPortalAudience;
  };
  const recipientEmail = String(body.recipientEmail || '').trim().toLowerCase();
  const title = String(body.title || '').trim();
  const deliveryUrl = String(body.url || '').trim();
  let parsedUrl: URL | null = null;
  try { parsedUrl = new URL(deliveryUrl); } catch { parsedUrl = null; }
  if (!recipientEmail.includes('@') || !title || !parsedUrl || !['http:', 'https:'].includes(parsedUrl.protocol)) {
    return NextResponse.json({ ok: false, error: 'Client email, delivery title, and a valid private link are required.' }, { status: 400 });
  }
  const audience = body.audience || 'media-guest';
  const access = await provisionAmandaClientAccess({
    email: recipientEmail,
    name: String(body.recipientName || ''),
    audience,
  });
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.error, accessCreated: access.accessCreated || false }, { status: 409 });
  }
  try {
    const delivery = await createAmandaDelivery({
      portalSlug: tenant.portalSlug,
      recipientEmail,
      recipientName: String(body.recipientName || ''),
      title,
      kind: body.kind || 'recording',
      url: deliveryUrl,
      note: String(body.note || ''),
    });
    return NextResponse.json({ ok: true, delivery, access });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Delivery could not be saved.' }, { status: 400 });
  }
}
