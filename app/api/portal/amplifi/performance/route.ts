import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import { analyzeAmplifiPerformance, type AmplifiPerformanceInput } from '@/lib/amplifi-performance';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const body = (await req.json().catch(() => ({}))) as Partial<AmplifiPerformanceInput>;
  if (!Number.isFinite(Number(body.impressions)) || Number(body.impressions) < 0) {
    return NextResponse.json({ ok: false, error: 'Valid impressions are required.' }, { status: 400 });
  }
  const analysis = analyzeAmplifiPerformance({
    impressions: Number(body.impressions),
    reach: Number(body.reach) || 0,
    engagements: Number(body.engagements) || 0,
    clicks: Number(body.clicks) || 0,
    conversions: Number(body.conversions) || 0,
    spend: Number(body.spend) || 0,
    revenue: Number(body.revenue) || 0,
    posts: Number(body.posts) || 1,
  });
  return NextResponse.json({ ok: true, analysis });
}
