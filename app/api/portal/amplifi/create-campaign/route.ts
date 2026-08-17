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
  tone: string;
  proofPoint: string;
  painQuestion: string;
  ctaUrl: string;
}) {
  const detailLine = input.details ? ` ${input.details}` : '';
  const linkLine = input.ctaUrl ? ` ${input.ctaUrl}` : '';
  const proof = input.proofPoint || `The right process can move ${input.audience} closer to ${input.result}.`;
  const pain = input.painQuestion || `How much time, money and capacity is being lost because the current process still depends on manual work?`;
  const toneLead = input.tone === 'Provocative and challenging'
    ? 'Here is the uncomfortable truth: '
    : input.tone === 'Authoritative and premium'
      ? 'Operationally, the issue is clear: '
      : input.tone === 'Warm and human'
        ? 'Your people deserve a better way to work. '
        : '';
  const posts: CampaignPost[] = [
    {
      title: pain,
      caption: `${toneLead}${pain}\n\nThe leak is rarely one dramatic failure. It is the repeated task, the delayed follow-up and the process everyone tolerates because “that is how we do it.” ${input.promotion} is built to change that.${detailLine}`,
      callToAction: `${input.callToAction}${linkLine}`,
      imageDirection: `Bold branded question graphic using “${pain}” as the headline.`,
    },
    {
      title: 'The expensive process hiding in plain sight',
      caption: `Manual work does not stay small. It compounds into missed opportunities, inconsistent service and people spending their best hours on work a system should handle. For ${input.audience}, that is not an inconvenience. It is an operating cost.`,
      callToAction: `${input.callToAction}${linkLine}`,
      imageDirection: 'A sharp time-money-resources graphic showing operational leakage without invented numbers.',
    },
    {
      title: proof,
      caption: `${proof}\n\nThat is what happens when the right process stops depending on memory, repetition and manual handoffs. The value is not “more technology.” The value is measurable capacity returned to the business.`,
      callToAction: `${input.callToAction}${linkLine}`,
      imageDirection: `A premium proof card centered on the exact verified result: “${proof}”.`,
    },
    {
      title: 'What changed was the system',
      caption: `The breakthrough was not asking people to work harder. It was removing the friction built into the process. ${input.promotion} helps create the structure required to reach ${input.result} with less waste and more control.`,
      callToAction: `${input.callToAction}${linkLine}`,
      imageDirection: 'A branded before-and-after process visual: manual friction on the left, clear automated flow on the right.',
    },
    {
      title: 'Find the leak before it costs you another quarter',
      caption: `${pain}\n\nFind out where your business is losing capacity and what to address first. ${input.callToAction}.${linkLine}`,
      callToAction: `${input.callToAction}${linkLine}`,
      imageDirection: `A decisive CTA graphic with “Find the leak” and the destination ${input.ctaUrl || 'clearly visible'}.`,
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
    tone?: string;
    proofPoint?: string;
    painQuestion?: string;
    ctaUrl?: string;
  };

  const promotion = String(body.promotion || '').trim();
  const audience = String(body.audience || '').trim();
  const result = String(body.result || '').trim();
  const callToAction = String(body.callToAction || '').trim();
  const details = String(body.details || '').trim();
  const tone = String(body.tone || 'Bold, direct and reality-based').trim();
  const proofPoint = String(body.proofPoint || '').trim();
  const painQuestion = String(body.painQuestion || '').trim();
  const ctaUrl = String(body.ctaUrl || '').trim();
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
    `Call-to-action URL: ${ctaUrl || 'None provided.'}`,
    `Tone: ${tone}`,
    `Specific proof point: ${proofPoint || 'None provided; do not invent proof.'}`,
    `Audience pain question: ${painQuestion || 'None provided.'}`,
    `Important dates and details: ${details || 'None provided; do not invent any.'}`,
    'Use this five-post sequence: pattern interruption; real pain or cost; specific proof; what changed; direct invitation.',
    'Write with adult authority, specificity and edge. Avoid generic phrases, filler and schoolbook language.',
    'Include the CTA URL naturally in every post where a next step is appropriate.',
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
      campaign: reliableCampaign({ promotion, audience, result, callToAction, details, tone, proofPoint, painQuestion, ctaUrl }),
      fallback: true,
    });
  }
}
