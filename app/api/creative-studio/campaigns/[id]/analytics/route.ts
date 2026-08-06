import { NextRequest, NextResponse } from 'next/server';
import { adminApiUnauthorized, guardAdminApi } from '@/lib/api/admin-route';
import { getCampaign } from '@/lib/creative-studio/campaign-store';
import {
  campaignPerformance,
  emptyCampaignAnalytics,
  updateCampaignPlatformMetrics,
} from '@/lib/creative-studio/campaign-analytics';
import type { SocialPlatform } from '@/lib/creative-studio/types';

export const dynamic = 'force-dynamic';

const PLATFORMS = new Set<SocialPlatform>(['facebook', 'instagram', 'linkedin', 'x']);

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return adminApiUnauthorized(auth);
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) return NextResponse.json({ ok: false, error: 'Campaign not found.' }, { status: 404 });
  const analytics = campaign.analytics ?? emptyCampaignAnalytics(campaign.strategy.platforms);
  return NextResponse.json({ ok: true, analytics, performance: campaignPerformance(analytics) });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return adminApiUnauthorized(auth);
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const platform = String(body.platform ?? '') as SocialPlatform;
  if (!PLATFORMS.has(platform)) {
    return NextResponse.json({ ok: false, error: 'Valid platform required.' }, { status: 400 });
  }
  const analytics = await updateCampaignPlatformMetrics({ campaignId: id, platform, metrics: body });
  if (!analytics) return NextResponse.json({ ok: false, error: 'Campaign or platform not found.' }, { status: 404 });
  return NextResponse.json({ ok: true, analytics, performance: campaignPerformance(analytics) });
}
