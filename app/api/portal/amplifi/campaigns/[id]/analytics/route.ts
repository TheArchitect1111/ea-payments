import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { campaignPerformance, emptyCampaignAnalytics } from '@/lib/creative-studio/campaign-analytics';
import { getCampaign } from '@/lib/creative-studio/campaign-store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign || campaign.source !== 'amplifi-portal' || campaign.portalSlug !== tenant.portalSlug || campaign.organizationId !== tenant.organizationId) {
    return NextResponse.json({ ok: false, error: 'Campaign not found.' }, { status: 404 });
  }
  const analytics = campaign.analytics ?? emptyCampaignAnalytics(campaign.strategy.platforms);
  const products = campaign.architecture.products.map((product) => ({
    productId: product.id,
    productName: product.name,
    ...(analytics.byProduct?.find((item) => item.productId === product.id) ?? { linkClicks: 0, ctpStarts: 0, ctpCompletions: 0 }),
  }));
  return NextResponse.json({ ok: true, analytics, performance: campaignPerformance(analytics), products });
}
