import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import { buildAmplifiPremiumPackage, type PremiumCampaignPost } from '@/lib/amplifi-premium-package';
import { moneyPrinterTurboConfigured, startAmplifiVideoDraft } from '@/lib/integrations/video/moneyprinterturbo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const body = (await req.json().catch(() => ({}))) as { posts?: PremiumCampaignPost[] };
  const posts = Array.isArray(body.posts) ? body.posts.slice(0, 5) : [];
  if (posts.length !== 5) {
    return NextResponse.json({ ok: false, error: 'A complete five-piece campaign is required.' }, { status: 400 });
  }

  const packageResult = buildAmplifiPremiumPackage(posts);
  let videoRender: { state: 'queued' | 'not-configured' | 'failed'; taskId?: string; error?: string } = { state: 'not-configured' };
  if (moneyPrinterTurboConfigured() && packageResult.qa.passed) {
    const subject = packageResult.graphics[0]?.title || 'Amplifi campaign';
    const script = packageResult.graphics.map((post) => `${post.title}. ${post.caption} ${post.callToAction}`).join('\n\n');
    try {
      const started = await startAmplifiVideoDraft({ subject, script });
      videoRender = { state: 'queued', taskId: started.taskId };
    } catch (error) {
      videoRender = { state: 'failed', error: error instanceof Error ? error.message.slice(0, 240) : 'Video render could not start.' };
    }
  }

  return NextResponse.json(
    { ok: packageResult.qa.passed, package: { ...packageResult, videoRender } },
    { status: packageResult.qa.passed ? 200 : 422 },
  );
}
