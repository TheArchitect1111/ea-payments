import { NextRequest, NextResponse } from 'next/server';
import { recordConnectEngagement } from '@/lib/connect-store';

export const dynamic = 'force-dynamic';

const allowedTypes = new Set([
  'email_open',
  'link_click',
  'resource_download',
  'video_view',
  'portal_visit',
  'application_started',
  'application_completed',
]);

export async function GET(request: NextRequest) {
  const orgSlug = request.nextUrl.searchParams.get('org') || 'demo';
  const relationshipId = request.nextUrl.searchParams.get('relationship') || undefined;
  const campaignId = request.nextUrl.searchParams.get('campaign') || undefined;
  const resourceId = request.nextUrl.searchParams.get('resource') || undefined;
  const type = request.nextUrl.searchParams.get('type') || 'link_click';
  const to = request.nextUrl.searchParams.get('to') || `/connect/${orgSlug}/journey`;

  if (allowedTypes.has(type)) {
    await recordConnectEngagement({
      orgSlug,
      relationshipId,
      campaignId,
      resourceId,
      type: type as Parameters<typeof recordConnectEngagement>[0]['type'],
    });
  }

  return NextResponse.redirect(new URL(to, request.url));
}
