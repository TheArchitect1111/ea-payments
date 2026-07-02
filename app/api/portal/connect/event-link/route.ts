import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromRequest } from '@/lib/auth';
import { buildConnectKit, buildEventCaptureUrl, buildConnectQrPath } from '@/lib/connect-kit';
import { getConnectOrg } from '@/lib/connect-store';
import { roleAtLeast, normalizeRole } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await resolveSessionFromRequest(req, { realm: 'portal' });
  if (!session?.slug) {
    return NextResponse.json({ error: 'Portal login required.' }, { status: 401 });
  }
  if (!roleAtLeast(normalizeRole(session.role), 'staff')) {
    return NextResponse.json({ error: 'Owner or staff access required.' }, { status: 403 });
  }

  let body: { event?: string; rep?: string };
  try {
    body = (await req.json()) as { event?: string; rep?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const event = body.event?.trim();
  if (!event) {
    return NextResponse.json({ error: 'Event name is required.' }, { status: 400 });
  }

  const rep = body.rep?.trim();
  const campaignId = `${session.slug}-${event.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}${rep ? `-${rep.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 16)}` : ''}`;
  const org = await getConnectOrg(session.slug);
  const kit = buildConnectKit(org, session.slug);
  const url = buildEventCaptureUrl(session.slug, { event, rep, campaignId });
  const label = rep ? `${rep} — ${event}` : event;

  return NextResponse.json({
    ok: true,
    link: {
      id: campaignId,
      label,
      url,
      qrPath: buildConnectQrPath(url, label),
      note: rep ? 'Staff event QR' : 'Event QR',
    },
    kitPageUrl: kit.kitPageUrl,
  });
}
