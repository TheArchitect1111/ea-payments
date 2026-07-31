import { NextRequest, NextResponse } from 'next/server';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { findOrganizationByPortalSlug } from '@/lib/organizations';
import { isModuleEnabled } from '@/lib/modules/portal-modules';
import { listPortalNylasEvents } from '@/lib/calendar/nylas';

export const dynamic = 'force-dynamic';

function dateParam(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(EA_PORTAL_COOKIE)?.value ?? '';
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const slug = req.nextUrl.searchParams.get('slug')?.trim() ?? '';
  if (!slug || slug !== session.slug) {
    return NextResponse.json({ error: 'Portal mismatch' }, { status: 403 });
  }
  const enabled = await isModuleEnabled({
    orgId: session.orgId,
    slug,
    moduleId: 'calendar',
    role: session.role,
  });
  if (!enabled) return NextResponse.json({ error: 'Calendar is not enabled.' }, { status: 403 });

  const start = dateParam(req.nextUrl.searchParams.get('start'));
  const end = dateParam(req.nextUrl.searchParams.get('end'));
  if (!start || !end || end <= start || end.getTime() - start.getTime() > 370 * 86_400_000) {
    return NextResponse.json({ error: 'Valid start and end dates are required.' }, { status: 400 });
  }

  const org = await findOrganizationByPortalSlug(slug);
  if (!process.env.NYLAS_API_KEY?.trim() || !org?.nylasGrantId || !org.nylasCalendarId) {
    return NextResponse.json({
      configured: false,
      events: [],
      message: 'Connect a calendar in organization settings to begin.',
    });
  }

  try {
    const events = await listPortalNylasEvents({
      grantId: org.nylasGrantId,
      calendarId: org.nylasCalendarId,
      start,
      end,
    });
    return NextResponse.json({ configured: true, events });
  } catch {
    return NextResponse.json({ error: 'Calendar is temporarily unavailable.' }, { status: 502 });
  }
}
