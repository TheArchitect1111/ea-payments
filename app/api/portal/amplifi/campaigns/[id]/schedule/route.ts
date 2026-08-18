import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { findPortfolioScheduleConflicts } from '@/lib/amplifi-campaign-command';
import { getCampaign, saveCampaignDurably } from '@/lib/creative-studio/campaign-store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign || campaign.source !== 'amplifi-portal' || campaign.portalSlug !== tenant.portalSlug || campaign.organizationId !== tenant.organizationId) {
    return NextResponse.json({ ok: false, error: 'Campaign not found.' }, { status: 404 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    schedule?: Record<string, string>;
    approvedPostIndexes?: number[];
    timezone?: string;
  };
  const schedule = body.schedule && typeof body.schedule === 'object' ? body.schedule : {};
  const logicalIndexes = [...new Set(campaign.assets.map((asset) => asset.portfolioPostIndex).filter((value): value is number => typeof value === 'number'))].sort((a, b) => a - b);
  const approved = new Set((body.approvedPostIndexes ?? []).filter(Number.isInteger));
  if (!logicalIndexes.length || logicalIndexes.some((index) => !approved.has(index) || !schedule[index])) {
    return NextResponse.json({ ok: false, error: 'Approve and schedule every campaign post first.' }, { status: 400 });
  }
  const now = Date.now();
  if (logicalIndexes.some((index) => !Number.isFinite(new Date(schedule[index]).getTime()) || new Date(schedule[index]).getTime() <= now)) {
    return NextResponse.json({ ok: false, error: 'Every publishing time must be in the future.' }, { status: 400 });
  }
  const posts = logicalIndexes.map((index) => {
    const asset = campaign.assets.find((item) => item.portfolioPostIndex === index)!;
    return {
      title: asset.previewTitle,
      caption: asset.previewBody,
      callToAction: asset.conversionAction || '',
      imageDirection: '',
      productId: asset.productId,
      audienceId: asset.audienceId,
      waveId: asset.launchWaveId,
    };
  });
  const normalizedSchedule = Object.fromEntries(logicalIndexes.map((index) => [index, schedule[index]]));
  const conflicts = findPortfolioScheduleConflicts(posts, normalizedSchedule, campaign.architecture);
  if (conflicts.length) return NextResponse.json({ ok: false, error: 'Resolve campaign schedule conflicts.', conflicts }, { status: 409 });
  const instagramWithoutMedia = campaign.assets.some((asset) =>
    asset.type === 'social-instagram' && !asset.mediaIds?.length && !asset.renderUrl && !asset.thumbnailUrl,
  );
  if (instagramWithoutMedia) {
    return NextResponse.json({ ok: false, error: 'Add a durable image or video to every Instagram post before scheduling.' }, { status: 409 });
  }

  const timestamp = new Date().toISOString();
  const actor = auth.session.email || auth.session.name || 'Portal user';
  const assets = campaign.assets.map((asset) => {
    if (asset.portfolioPostIndex === undefined) return asset;
    return {
      ...asset,
      status: 'scheduled' as const,
      approval: { status: 'approved' as const, requestedAt: timestamp, requestedBy: actor, decidedAt: timestamp, decidedBy: actor },
      schedule: { publishAt: new Date(schedule[asset.portfolioPostIndex]).toISOString(), timezone: body.timezone || 'America/New_York', scheduledAt: timestamp, scheduledBy: actor },
    };
  });
  const saved = await saveCampaignDurably({ ...campaign, assets, completionPercent: 100 });
  if (!saved.durable) {
    return NextResponse.json({ ok: false, error: 'The schedule could not be saved durably.', detail: saved.error }, { status: 503 });
  }
  return NextResponse.json({ ok: true, campaignId: campaign.id, scheduledAssets: assets.length });
}
