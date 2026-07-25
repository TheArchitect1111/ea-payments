import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import {
  createPretixEvent,
  deletePretixEvent,
  getPretixIntegrationConfig,
  listPretixEventsForPortal,
  updatePretixEventStatus,
} from '@/lib/events/pretix-store';
import type { PortalPretixEventStatus } from '@/lib/events/pretix-types';
import { normalizeRole, roleAtLeast } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

function requireStaff(role: string | undefined) {
  return roleAtLeast(normalizeRole(role), 'staff');
}

export async function GET(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'portal' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  const canManage = requireStaff(auth.session.role);
  const events = await listPretixEventsForPortal(tenant.portalSlug, {
    includeDrafts: canManage,
  });
  return NextResponse.json({
    ok: true,
    events,
    integration: getPretixIntegrationConfig(events.length),
    canManage,
  });
}

export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'portal' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  if (!requireStaff(auth.session.role)) {
    return NextResponse.json({ error: 'Owner or staff access required.' }, { status: 403 });
  }
  const tenant = portalTenant(auth.session);

  let body: {
    title?: string;
    summary?: string;
    shopUrl?: string;
    pretixEventSlug?: string;
    pretixOrganizerSlug?: string;
    startsAt?: string;
    endsAt?: string;
    location?: string;
    status?: PortalPretixEventStatus;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const result = await createPretixEvent({
    portalSlug: tenant.portalSlug,
    title: body.title || '',
    summary: body.summary,
    shopUrl: body.shopUrl || '',
    pretixEventSlug: body.pretixEventSlug,
    pretixOrganizerSlug: body.pretixOrganizerSlug,
    startsAt: body.startsAt,
    endsAt: body.endsAt,
    location: body.location,
    status: body.status || 'published',
    createdBy: auth.session.email || auth.session.sub,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, event: result.event });
}

export async function PATCH(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'portal' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  if (!requireStaff(auth.session.role)) {
    return NextResponse.json({ error: 'Owner or staff access required.' }, { status: 403 });
  }
  const tenant = portalTenant(auth.session);

  let body: { id?: string; status?: PortalPretixEventStatus };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const id = body.id?.trim();
  const status = body.status;
  if (!id || !status || !['draft', 'published', 'closed'].includes(status)) {
    return NextResponse.json({ error: 'id and status (draft|published|closed) required.' }, { status: 400 });
  }

  const result = await updatePretixEventStatus(id, tenant.portalSlug, status);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json({ ok: true, event: result.event });
}

export async function DELETE(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'portal' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  if (!requireStaff(auth.session.role)) {
    return NextResponse.json({ error: 'Owner or staff access required.' }, { status: 403 });
  }
  const tenant = portalTenant(auth.session);
  const id = new URL(req.url).searchParams.get('id')?.trim();
  if (!id) {
    return NextResponse.json({ error: 'id query required.' }, { status: 400 });
  }

  const result = await deletePretixEvent(id, tenant.portalSlug);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
