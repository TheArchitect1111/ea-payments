import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { AIGatewayError, runAIGateway } from '@/lib/ai/gateway';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

type CampaignPost = {
  title: string;
  caption: string;
  callToAction: string;
  imageDirection: string;
};

function parseCampaign(text: string): CampaignPost[] {
  const parsed = JSON.parse(text) as { posts?: CampaignPost[] };
  if (!Array.isArray(parsed.posts) || parsed.posts.length !== 5) {
    throw new Error('Amplifi did not return the required five-post campaign.');
  }
  return parsed.posts.map((post) => ({
    title: String(post.title || '').trim(),
    caption: String(post.caption || '').trim(),
    callToAction: String(post.callToAction || '').trim(),
    imageDirection: String(post.imageDirection || '').trim(),
  })).filter((post) => post.title && post.caption && post.callToAction && post.imageDirection);
}

export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  const body = (await req.json().catch(() => ({}))) as {
    promotion?: string;
    audience?: string;
    result?: string;
    callToAction?: string;
    details?: string;
  };

  const promotion = String(body.promotion || '').trim();
  const audience = String(body.audience || '').trim();
  const result = String(body.result || '').trim();
  const callToAction = String(body.callToAction || '').trim();
  const details = String(body.details || '').trim();
  if (!promotion || !audience || !result || !callToAction) {
    return NextResponse.json({ ok: false, error: 'Promotion, audience, result and call to action are required.' }, { status: 400 });
  }

  try {
    const response = await runAIGateway({
      responseFormat: 'json',
      temperature: 0.35,
      maxOutputTokens: 3200,
      system: 'You are Amplifi, a social campaign creator. Produce specific, useful campaign copy without inventing facts. Return valid JSON only.',
      messages: [{
        role: 'user',
        content: [
          'Create exactly five coordinated social posts as one campaign.',
          'The five posts should progress through awareness, relevance, proof/value, invitation, and final call to action.',
          'Return: {"campaignTitle": string, "strategy": string, "posts": [{"title": string, "caption": string, "callToAction": string, "imageDirection": string}]}.',
          `What is being promoted: ${promotion}`,
          `Audience: ${audience}`,
          `Desired result: ${result}`,
          `Required call to action: ${callToAction}`,
          `Important dates and details: ${details || 'None provided; do not invent any.'}`,
        ].join('\n'),
      }],
      metadata: { product: 'amplifi', workflow: 'create-for-me' },
    }, {
      requestId: crypto.randomUUID(),
      actor: {
        id: auth.session.sub || auth.session.email || tenant.organizationId,
        type: 'portal',
        email: auth.session.email,
        portalSlug: tenant.portalSlug,
        role: auth.session.role,
      },
      route: '/api/portal/amplifi/create-campaign',
    });
    const parsed = JSON.parse(response.text) as { campaignTitle?: string; strategy?: string; posts?: CampaignPost[] };
    const posts = parseCampaign(response.text);
    if (posts.length !== 5) throw new Error('Amplifi did not complete all five posts.');
    return NextResponse.json({
      ok: true,
      campaign: {
        title: String(parsed.campaignTitle || promotion).trim(),
        strategy: String(parsed.strategy || '').trim(),
        posts,
      },
    });
  } catch (error) {
    const status = error instanceof AIGatewayError ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Amplifi could not create the campaign.';
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
