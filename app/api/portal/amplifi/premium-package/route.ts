import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import { buildAmplifiPremiumPackage, type PremiumCampaignPost } from '@/lib/amplifi-premium-package';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const body = (await req.json().catch(() => ({}))) as { posts?: PremiumCampaignPost[] };
  const posts = Array.isArray(body.posts) ? body.posts.slice(0, 5) : [];
  if (posts.length !== 5) {
    return NextResponse.json({ ok: false, error: 'A complete five-piece campaign is required.' }, { status: 400 });
  }
  const packageResult = buildAmplifiPremiumPackage(posts);
  return NextResponse.json({ ok: true, package: packageResult }, { status: packageResult.qa.passed ? 200 : 422 });
}
