import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import {
  listPortalNotifications,
  markPortalNotificationsRead,
  countUnreadNotifications,
} from '@/lib/notification-inbox';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await guardPortalApi(req);
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  const session = auth.session;
  if (!session.email) {
    return NextResponse.json({ error: 'Portal authentication required.' }, { status: 401 });
  }

  const notifications = await listPortalNotifications({
    slug: tenant.portalSlug,
    email: session.email,
    limit: 30,
  });

  return NextResponse.json({
    ok: true,
    notifications,
    unreadCount: await countUnreadNotifications(tenant.portalSlug, session.email),
  });
}

export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req);
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  const session = auth.session;
  if (!session.email) {
    return NextResponse.json({ error: 'Portal authentication required.' }, { status: 401 });
  }

  const body = (await req.json()) as { ids?: string[]; markAll?: boolean };
  const marked = await markPortalNotificationsRead(
    tenant.portalSlug,
    session.email,
    body.markAll ? undefined : body.ids,
  );

  return NextResponse.json({
    ok: true,
    marked,
    unreadCount: await countUnreadNotifications(tenant.portalSlug, session.email),
  });
}
