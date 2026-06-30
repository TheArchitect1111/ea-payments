import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import {
  listPortalNotifications,
  markPortalNotificationsRead,
  countUnreadNotifications,
} from '@/lib/notification-inbox';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session?.slug || !session.email) {
    return NextResponse.json({ error: 'Portal authentication required.' }, { status: 401 });
  }

  const notifications = listPortalNotifications({
    slug: session.slug,
    email: session.email,
    limit: 30,
  });

  return NextResponse.json({
    ok: true,
    notifications,
    unreadCount: countUnreadNotifications(session.slug, session.email),
  });
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session?.slug || !session.email) {
    return NextResponse.json({ error: 'Portal authentication required.' }, { status: 401 });
  }

  const body = (await req.json()) as { ids?: string[]; markAll?: boolean };
  const marked = markPortalNotificationsRead(
    session.slug,
    session.email,
    body.markAll ? undefined : body.ids,
  );

  return NextResponse.json({
    ok: true,
    marked,
    unreadCount: countUnreadNotifications(session.slug, session.email),
  });
}
