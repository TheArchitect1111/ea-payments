import { NextRequest, NextResponse } from 'next/server';
import { requirePortalSessionFromRequest } from '@/lib/auth/resolve-portal-session';
import {
  listPortalNotifications,
  markPortalNotificationsRead,
  countUnreadNotifications,
} from '@/lib/notification-inbox';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await requirePortalSessionFromRequest(req);
  if (!session?.email) {
    return NextResponse.json({ error: 'Portal authentication required.' }, { status: 401 });
  }

  const notifications = await listPortalNotifications({
    slug: session.slug,
    email: session.email,
    limit: 30,
  });

  return NextResponse.json({
    ok: true,
    notifications,
    unreadCount: await countUnreadNotifications(session.slug, session.email),
  });
}

export async function POST(req: NextRequest) {
  const session = await requirePortalSessionFromRequest(req);
  if (!session?.email) {
    return NextResponse.json({ error: 'Portal authentication required.' }, { status: 401 });
  }

  const body = (await req.json()) as { ids?: string[]; markAll?: boolean };
  const marked = await markPortalNotificationsRead(
    session.slug,
    session.email,
    body.markAll ? undefined : body.ids,
  );

  return NextResponse.json({
    ok: true,
    marked,
    unreadCount: await countUnreadNotifications(session.slug, session.email),
  });
}
