import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { runAIGateway } from '@/lib/ai/gateway';
import { callClaudeText } from '@/lib/ai';
import { normalizeCampaignArchitecture } from '@/lib/creative-studio/campaign-architecture';
import type { CampaignArchitecture } from '@/lib/creative-studio/types';
import { assignPortfolioPosts } from '@/lib/amplifi-campaign-command';
import { persistAmplifiPortfolioCampaign } from '@/lib/amplifi-portfolio-persistence';
import type { SocialPlatform } from '@/lib/creative-studio/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

type CampaignPost = {
  title: string;
  caption: string;
  callToAction: string;
  imageDirection: string;
  imageUrl?: string;
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

function campaignFromText(text: string, promotion: string, architecture: CampaignArchitecture) {
  const parsed = JSON.parse(cleanJson(text)) as { campaignTitle?: string; strategy?: string; posts?: CampaignPost[] };
  const posts = parseCampaign(text);
  if (posts.length !== 5) throw new Error('Amplifi did not complete all five posts.');
  return {
    title: String(parsed.campaignTitle || promotion).trim(),
    strategy: String(parsed.strategy || '').trim(),
    posts: assignPortfolioPosts(posts, architecture),
    architecture,
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
  architecture: CampaignArchitecture;
}) {
  const detailLine = input.details ? ` ${input.details}` : '';
  const linkLine = input.ctaUrl ? ` ${input.ctaUrl}` : '';
  const proof = input.proofPoint || `The right process can move ${input.audience} closer to ${input.result}.`;
  const pain = input.painQuestion || `How much time, money and capacity is being lost because the current process still depends on manual work?`;
  const toneLead = input.tone === 'Provocative and challenging'
    ? 'Take a closer look: '
    : input.tone === 'Authoritative and premium'
      ? 'Here is what to know: '
      : input.tone === 'Warm and human'
        ? 'There is a simpler way forward. '
        : '';
  const posts: CampaignPost[] = [
    {
      title: pain,
      caption: `${toneLead}Look at the repeated tasks, delayed follow-up and work your team keeps carrying by hand. ${input.promotion} can help you see what needs to change and choose a clear next step.${detailLine}`,
      callToAction: `${input.callToAction}${linkLine}`,
      imageDirection: `Bold branded question graphic using “${pain}” as the headline.`,
    },
    {
      title: 'The expensive process hiding in plain sight',
      caption: `Small repeated tasks add up. They can slow follow-up, create uneven service and pull people away from the work that needs them most. Amplifi helps ${input.audience} recognize that pattern and see where to begin.`,
      callToAction: `${input.callToAction}${linkLine}`,
      imageDirection: 'A sharp time-money-resources graphic showing operational leakage without invented numbers.',
    },
    {
      title: proof,
      caption: `This result shows what can happen when repeated work no longer depends on memory and manual handoffs. Use the example to help people understand what a better way of working could make possible for them.`,
      callToAction: `${input.callToAction}${linkLine}`,
      imageDirection: `A premium proof card centered on the exact verified result: “${proof}”.`,
    },
    {
      title: 'What changed was the system',
      caption: `The team did not need another demand to work harder. They needed a clearer way to move the work forward. ${input.promotion} guides people toward ${input.result} one practical step at a time.`,
      callToAction: `${input.callToAction}${linkLine}`,
      imageDirection: 'A branded before-and-after process visual: manual friction on the left, clear automated flow on the right.',
    },
    {
      title: 'Find the leak before it costs you another quarter',
      caption: `You do not have to solve everything at once. Start by seeing where time and effort are being lost, then choose what to address first. ${input.callToAction}.${linkLine}`,
      callToAction: `${input.callToAction}${linkLine}`,
      imageDirection: `A decisive CTA graphic with “Find the leak” and the destination ${input.ctaUrl || 'clearly visible'}.`,
    },
  ];
  return {
    title: input.promotion,
    strategy: 'A five-part campaign moving from awareness and relevance through value, invitation and action.',
    posts: assignPortfolioPosts(posts, input.architecture),
    architecture: input.architecture,
  };
}

async function finalizeCampaign(input: {
  generated: ReturnType<typeof campaignFromText> | ReturnType<typeof reliableCampaign>;
  organizationId: string;
  portalSlug: string;
  tone: string;
  platforms: unknown;
}) {
  const imageOrigin = (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    'https://efficiencyarchitects.online'
  ).replace(/\/$/, '');
  const generated = {
    ...input.generated,
    posts: input.generated.posts.map((post, index) => ({
      ...post,
      imageUrl: `${imageOrigin}/api/amplifi/post-image?title=${encodeURIComponent(post.title)}&variant=${index % 3}`,
    })),
  };
  if (generated.architecture.mode !== 'portfolio') return generated;
  const allowed = new Set<SocialPlatform>(['facebook', 'instagram', 'linkedin', 'x']);
  const platforms = Array.isArray(input.platforms)
    ? [...new Set(input.platforms.map((item) => String(item).toLowerCase()).filter((item): item is SocialPlatform => allowed.has(item as SocialPlatform)))]
    : [];
  const saved = await persistAmplifiPortfolioCampaign({
    organizationId: input.organizationId,
    portalSlug: input.portalSlug,
    title: generated.title,
    objective: generated.architecture.masterObjective,
    tone: input.tone,
    platforms: platforms.length ? platforms : ['facebook', 'instagram'],
    architecture: generated.architecture,
    posts: generated.posts,
  });
  return { ...generated, id: saved.campaign.id, durable: saved.durable, persistenceError: saved.error };
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
    promotionScope?: 'single' | 'portfolio';
    portfolioProducts?: Array<{
      id?: string;
      name?: string;
      audience?: string;
      callToAction?: string;
      ctaUrl?: string;
    }>;
    startDate?: string;
    platforms?: unknown[];
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
  const promotionScope = body.promotionScope === 'portfolio' ? 'portfolio' : 'single';
  const portfolioProducts = Array.isArray(body.portfolioProducts) ? body.portfolioProducts.slice(0, 30) : [];
  const startDate = String(body.startDate || '').trim();
  if (promotionScope === 'portfolio' && (portfolioProducts.length < 2 || portfolioProducts.some((product) =>
    !String(product.name || '').trim() || !String(product.audience || '').trim() || !String(product.callToAction || '').trim()
  ))) {
    return NextResponse.json({ ok: false, error: 'Add at least two complete product briefs.' }, { status: 400 });
  }
  if (!promotion || !result || (promotionScope === 'single' && (!audience || !callToAction))) {
    return NextResponse.json({ ok: false, error: 'Promotion, audience, result and call to action are required.' }, { status: 400 });
  }

  const audienceIdsByName = new Map<string, string>();
  const productAudiences: Array<{ id: string; name: string; channels: Array<'facebook' | 'instagram'> }> = [];
  const productAudienceIds = portfolioProducts.map((product) => {
    const name = String(product.audience || '').trim();
    const key = name.toLocaleLowerCase();
    const existingId = audienceIdsByName.get(key);
    if (existingId) return existingId;
    const id = `audience-${productAudiences.length + 1}`;
    audienceIdsByName.set(key, id);
    productAudiences.push({ id, name, channels: ['facebook', 'instagram'] });
    return id;
  });
  const architecture = normalizeCampaignArchitecture(
    promotionScope === 'portfolio' ? {
      mode: 'portfolio',
      masterName: promotion,
      masterObjective: result,
      defaultCallToAction: { label: 'Explore the products' },
      audiences: productAudiences,
      products: portfolioProducts.map((product, index) => ({
        id: String(product.id || `product-${index + 1}`),
        name: String(product.name || '').trim(),
        audienceIds: [productAudienceIds[index]],
        callToAction: {
          label: String(product.callToAction || '').trim(),
          url: String(product.ctaUrl || '').trim() || undefined,
        },
        status: 'planned' as const,
      })),
      waves: portfolioProducts.map((product, index) => {
        const waveStart = startDate ? new Date(`${startDate}T12:00:00Z`) : null;
        if (waveStart) waveStart.setUTCDate(waveStart.getUTCDate() + (index * 7));
        return {
          id: `wave-${index + 1}`,
          name: `Wave ${index + 1}: ${String(product.name || '').trim()}`,
          sequence: index + 1,
          objective: `Introduce ${String(product.name || '').trim()} to ${String(product.audience || '').trim()}`,
          startDate: waveStart?.toISOString().slice(0, 10),
          productIds: [String(product.id || `product-${index + 1}`)],
          audienceIds: [productAudienceIds[index]],
          status: index === 0 ? 'active' as const : 'planned' as const,
        };
      }),
    } : undefined,
    {
      title: promotion,
      objective: result,
      audience: audience || 'Campaign audiences',
      platforms: ['facebook', 'instagram'],
      ctaLabel: callToAction || 'Explore the products',
      ctaUrl: ctaUrl || undefined,
    },
  );

  const portfolioPrompt = architecture.mode === 'portfolio'
    ? `Products in this master campaign:\n${architecture.products.map((product, index) => `${index + 1}. ${product.name}; audience: ${architecture.audiences.find((item) => item.id === product.audienceIds[0])?.name || 'not specified'}; CTA: ${product.callToAction.label}${product.callToAction.url ? ` (${product.callToAction.url})` : ''}`).join('\n')}\nPost assignment order: ${Array.from({ length: 5 }, (_, index) => `Post ${index + 1} focuses on ${architecture.products[index % architecture.products.length].name}`).join('; ')}.`
    : '';
  const resolvedAudience = architecture.mode === 'portfolio'
    ? architecture.audiences.map((item) => item.name).join('; ')
    : audience;
  const resolvedCallToAction = architecture.mode === 'portfolio'
    ? architecture.defaultCallToAction.label
    : callToAction;
  const resolvedCtaUrl = architecture.mode === 'portfolio'
    ? architecture.defaultCallToAction.url || ''
    : ctaUrl;

  const prompt = [
    architecture.mode === 'portfolio'
      ? 'Create exactly five coordinated master-launch social posts that introduce a multi-product portfolio without collapsing the products into one generic offer.'
      : 'Create exactly five coordinated social posts as one campaign.',
    'The five posts should progress through awareness, relevance, proof/value, invitation, and final call to action.',
    'Return: {"campaignTitle": string, "strategy": string, "posts": [{"title": string, "caption": string, "callToAction": string, "imageDirection": string}]}.',
    `What is being promoted: ${promotion}`,
    `Audience: ${resolvedAudience}`,
    `Desired result: ${result}`,
    `Required call to action: ${resolvedCallToAction}`,
    `Call-to-action URL: ${resolvedCtaUrl || 'Product-specific links are listed below.'}`,
    `Tone: ${tone}`,
    `Specific proof point: ${proofPoint || 'None provided; do not invent proof.'}`,
    `Audience pain question: ${painQuestion || 'None provided.'}`,
    `Important dates and details: ${details || 'None provided; do not invent any.'}`,
    portfolioPrompt,
    'Use this five-post sequence: pattern interruption; real pain or cost; specific proof; what changed; direct invitation.',
    'Write like a trusted guide speaking directly to the reader. Use plain language, show what the reader can do next and avoid consultant terminology.',
    'Do not repeat the image headline as the opening sentence of the caption. The image says it once; the caption should add useful context.',
    'Avoid phrases such as operationally, capacity returned, leverage, optimize, transformation, friction and strategic.',
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
    const campaign = await finalizeCampaign({
      generated: campaignFromText(response.text, promotion, architecture),
      organizationId: tenant.organizationId,
      portalSlug: tenant.portalSlug,
      tone,
      platforms: body.platforms,
    });
    return NextResponse.json({ ok: true, campaign });
  } catch {
    const claudeText = await callClaudeText(prompt, { maxTokens: 3200 });
    if (claudeText) {
      try {
        const campaign = await finalizeCampaign({
          generated: campaignFromText(claudeText, promotion, architecture),
          organizationId: tenant.organizationId,
          portalSlug: tenant.portalSlug,
          tone,
          platforms: body.platforms,
        });
        return NextResponse.json({ ok: true, campaign });
      } catch {
        // Continue to the reliable local campaign builder.
      }
    }
    const campaign = await finalizeCampaign({
      generated: reliableCampaign({
        promotion,
        audience: resolvedAudience,
        result,
        callToAction: resolvedCallToAction,
        details,
        tone,
        proofPoint,
        painQuestion,
        ctaUrl: resolvedCtaUrl,
        architecture,
      }),
      organizationId: tenant.organizationId,
      portalSlug: tenant.portalSlug,
      tone,
      platforms: body.platforms,
    });
    return NextResponse.json({
      ok: true,
      campaign,
      fallback: true,
    });
  }
}
