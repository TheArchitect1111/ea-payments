import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromRequest } from '@/lib/auth';
import { buildConnectKit, buildEventCaptureUrl, buildConnectQrPath } from '@/lib/connect-kit';
import { addConnectCampaign, type ConnectCampaign } from '@/lib/connect-store';
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
  const label = rep ? `${rep} — ${event}` : event;
  const params = new URLSearchParams();
  params.set('event', event);
  if (rep) params.set('rep', rep);
  params.set('campaign', campaignId);
  const destination = `/connect/${session.slug}?${params.toString()}`;

  const campaign: ConnectCampaign = {
    id: campaignId,
    name: label,
    type: rep ? 'Staff QR' : 'Event QR',
    destination,
    event,
    representative: rep,
    scans: 0,
    conversions: 0,
    resourceOpens: 0,
    applications: 0,
  };

  try {
    const result = await addConnectCampaign({ orgSlug: session.slug, campaign });
    const kit = buildConnectKit(result.org, session.slug);
    const url = buildEventCaptureUrl(session.slug, { event, rep, campaignId });

    return NextResponse.json({
      ok: true,
      created: result.created,
      persisted: result.persisted,
      warning: result.warning,
      link: {
        id: campaignId,
        label,
        url,
        qrPath: buildConnectQrPath(url, label),
        note: rep ? 'Staff event QR' : 'Event QR',
      },
      kitPageUrl: kit.kitPageUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save event QR.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
