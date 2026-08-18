import { NextRequest, NextResponse } from 'next/server';
import { getCampaign } from '@/lib/creative-studio/campaign-store';
import {
  AMPLIFI_ATTRIBUTION_COOKIE,
  createAttributionCookie,
  recordCampaignActivity,
} from '@/lib/creative-studio/campaign-analytics';

export const dynamic = 'force-dynamic';

function sourceForAsset(type: string): string {
  if (type === 'social-facebook') return 'facebook';
  if (type === 'social-instagram') return 'instagram';
  if (type === 'social-linkedin') return 'linkedin';
  if (type === 'social-x') return 'x';
  if (type === 'email') return 'email';
  if (type === 'sms') return 'sms';
  return 'amplifi';
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string; assetId: string }> },
) {
  const { campaignId, assetId } = await params;
  const campaign = await getCampaign(decodeURIComponent(campaignId));
  const asset = campaign?.assets.find((item) => item.id === decodeURIComponent(assetId));
  if (!campaign || !asset?.destinationUrl) {
    return NextResponse.redirect(new URL('/assessment', req.url));
  }

  const destination = new URL(asset.destinationUrl);
  destination.searchParams.set('utm_source', sourceForAsset(asset.type));
  destination.searchParams.set('utm_medium', asset.type.startsWith('social-') ? 'social' : asset.type);
  destination.searchParams.set('utm_campaign', campaign.id);
  destination.searchParams.set('utm_content', asset.id);
  destination.searchParams.set('amplifi_campaign', campaign.id);
  destination.searchParams.set('amplifi_asset', asset.id);
  if (asset.productId) {
    destination.searchParams.set('utm_term', asset.productId);
    destination.searchParams.set('amplifi_product', asset.productId);
  }
  if (asset.launchWaveId) destination.searchParams.set('amplifi_wave', asset.launchWaveId);
  const isCtp = destination.hostname === 'cc.efficiencyarchitects.online' && destination.pathname.startsWith('/ctp');

  await recordCampaignActivity({
    campaignId: campaign.id,
    assetId: asset.id,
    linkClick: true,
    ctpStart: isCtp,
  });

  const response = NextResponse.redirect(destination);
  response.cookies.set({
    name: AMPLIFI_ATTRIBUTION_COOKIE,
    value: createAttributionCookie(campaign.id, asset.id),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
    ...(req.nextUrl.hostname.endsWith('efficiencyarchitects.online')
      ? { domain: '.efficiencyarchitects.online' }
      : {}),
  });
  return response;
}
