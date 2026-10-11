import { NextRequest, NextResponse } from 'next/server';
import { guardBrick } from '@/lib/bricks/access';
import { brickHash, readBrickRecord } from '@/lib/bricks/durable';
import { listCalendarEvents, loadCalendarInstall } from '@/lib/calendar/storage';
import { findOrganizationByPortalSlug } from '@/lib/organizations';
import { listPortalNylasEvents } from '@/lib/calendar/nylas';

export const dynamic = 'force-dynamic';

function dateParam(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')?.trim() ?? '';
  const access = await guardBrick(req, slug, 'calendar');
  if (!access.ok) return access.response;
  const session = access.session;
  if (session.slug !== slug) return NextResponse.json({ error: 'Portal mismatch' }, { status: 403 });
  const start = dateParam(req.nextUrl.searchParams.get('start'));
  const end = dateParam(req.nextUrl.searchParams.get('end'));
  if (!start || !end || end <= start || end.getTime() - start.getTime() > 370 * 86_400_000) {
    return NextResponse.json({ error: 'Valid start and end dates are required.' }, { status: 400 });
  }

  try {
    const installed = await readBrickRecord(access.tenant, 'calendar-install-' + brickHash(access.tenant.organizationId));
    if (installed) return NextResponse.json({ configured: true, provider: (await loadCalendarInstall(access.tenant)).provider, events: await listCalendarEvents(access.tenant, start, end) });
    // Preserve existing connected organizations while new selections use install receipts.
    const org = await findOrganizationByPortalSlug(slug);
    if (!process.env.NYLAS_API_KEY?.trim() || !org?.nylasGrantId || !org.nylasCalendarId)
      return NextResponse.json({ configured: false, events: [], message: 'Connect a calendar in organization settings to begin.' });
    const events = await listPortalNylasEvents({ grantId: org.nylasGrantId, calendarId: org.nylasCalendarId, start, end });
    return NextResponse.json({ configured: true, events });
  } catch {
    return NextResponse.json({ error: 'Calendar is temporarily unavailable.' }, { status: 502 });
  }
}
