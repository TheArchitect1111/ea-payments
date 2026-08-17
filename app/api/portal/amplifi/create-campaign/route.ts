import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { runAIGateway } from '@/lib/ai/gateway';
import { callClaudeText } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

type CampaignPost = {
  title: string;
  caption: string;
  callToAction: string;
  imageDirection: string;
};

function cleanJson(text: string): string {
  return text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
}

function parseCampaign(text: string): CampaignPost[] {
  const parsed = JSON.parse(cleanJson(text)) as { posts?: CampaignPost[] };
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

function campaignFromText(text: string, promotion: string) {
  const parsed = JSON.parse(cleanJson(text)) as { campaignTitle?: string; strategy?: string; posts?: CampaignPost[] };
  const posts = parseCampaign(text);
  if (posts.length !== 5) throw new Error('Amplifi did not complete all five posts.');
  return {
    title: String(parsed.campaignTitle || promotion).trim(),
    strategy: String(parsed.strategy || '').trim(),
    posts,
  };
}

function reliableCampaign(input: {
  promotion: string;
  audience: string;
  result: string;
  callToAction: string;
  details: string;
}) {
  const detailLine = input.details ? ` Important details: ${input.details}` : '';
  const posts: CampaignPost[] = [
    {
      title: `Introducing ${input.promotion}`,
      caption: `${input.promotion} is designed for ${input.audience}. The goal is simple: ${input.result}.${detailLine}`,
      callToAction: input.callToAction,
      imageDirection: `A clear branded introduction to ${input.promotion} featuring the audience and primary benefit.`,
    },
    {
      title: `Why ${input.promotion} matters`,
      caption: `${input.audience} should not have to settle for a complicated path forward. ${input.promotion} focuses attention on the result that matters: ${input.result}.`,
      callToAction: input.callToAction,
      imageDirection: `A benefit-focused visual showing the before-and-after experience for ${input.audience}.`,
    },
    {
      title: 'The value in one clear step',
      caption: `The strongest solutions make the next step easier to understand. ${input.promotion} gives ${input.audience} a focused way to move toward ${input.result}.${detailLine}`,
      callToAction: input.callToAction,
      imageDirection: 'A premium proof-and-value graphic highlighting the central outcome without invented statistics.',
    },
    {
      title: `Your invitation to ${input.promotion}`,
      caption: `If ${input.result} is the outcome you want, this is your invitation to learn more about ${input.promotion}. Everything begins with one clear next step.${detailLine}`,
      callToAction: input.callToAction,
      imageDirection: 'A warm invitation visual with the offer, relevant details and a prominent next step.',
    },
    {
      title: 'Take the next step',
      caption: `${input.promotion} is ready to help ${input.audience} move toward ${input.result}. Do not let the next opportunity pass without taking action.${detailLine}`,
      callToAction: input.callToAction,
      imageDirection: 'A decisive final call-to-action graphic with strong brand contrast and the destination clearly visible.',
    },
  ];
  return {
    title: input.promotion,
    strategy: 'A five-part campaign moving from awareness and relevance through value, invitation and action.',
    posts,
  };
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

  const prompt = [
    'Create exactly five coordinated social posts as one campaign.',
    'The five posts should progress through awareness, relevance, proof/value, invitation, and final call to action.',
    'Return: {"campaignTitle": string, "strategy": string, "posts": [{"title": string, "caption": string, "callToAction": string, "imageDirection": string}]}.',
    `What is being promoted: ${promotion}`,
    `Audience: ${audience}`,
    `Desired result: ${result}`,
    `Required call to action: ${callToAction}`,
    `Important dates and details: ${details || 'None provided; do not invent any.'}`,
  ].join('\n');

  try {
    const response = await runAIGateway({
      responseFormat: 'json',
      temperature: 0.35,
      maxOutputTokens: 3200,
      system: 'You are Amplifi, a social campaign creator. Produce specific, useful campaign copy without inventing facts. Return valid JSON only.',
      messages: [{
        role: 'user',
        content: prompt,
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
    return NextResponse.json({ ok: true, campaign: campaignFromText(response.text, promotion) });
  } catch {
    const claudeText = await callClaudeText(prompt, { maxTokens: 3200 });
    if (claudeText) {
      try {
        return NextResponse.json({ ok: true, campaign: campaignFromText(claudeText, promotion) });
      } catch {
        // Continue to the reliable local campaign builder.
      }
    }
    return NextResponse.json({
      ok: true,
      campaign: reliableCampaign({ promotion, audience, result, callToAction, details }),
      fallback: true,
    });
  }
}
