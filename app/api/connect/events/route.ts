import { NextRequest, NextResponse } from 'next/server';
import { recordConnectEngagement } from '@/lib/connect-store';

export const dynamic = 'force-dynamic';

const validTypes = new Set([
  'scan',
  'contact_exchange',
  'email_open',
  'link_click',
  'resource_download',
  'video_view',
  'portal_visit',
  'application_started',
  'application_completed',
  'message',
  'follow_up_completed',
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orgSlug = typeof body.orgSlug === 'string' && body.orgSlug.trim() ? body.orgSlug.trim() : 'demo';
    const type = typeof body.type === 'string' ? body.type : '';

    if (!validTypes.has(type)) {
      return NextResponse.json({ error: 'Invalid engagement event type.' }, { status: 400 });
    }

    const event = await recordConnectEngagement({
      orgSlug,
      type: type as Parameters<typeof recordConnectEngagement>[0]['type'],
      relationshipId: typeof body.relationshipId === 'string' ? body.relationshipId : undefined,
      campaignId: typeof body.campaignId === 'string' ? body.campaignId : undefined,
      resourceId: typeof body.resourceId === 'string' ? body.resourceId : undefined,
    });

    return NextResponse.json({ event, message: 'Engagement recorded.' });
  } catch (error) {
    console.error('[connect] engagement event failed', error);
    return NextResponse.json({ error: 'Unable to record engagement.' }, { status: 500 });
  }
}
