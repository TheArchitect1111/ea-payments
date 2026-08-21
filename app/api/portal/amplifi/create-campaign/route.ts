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
  return text.replace(/^\`\`\`json\\s*/i, '').replace(/^\`\`\`\\s*/, '').replace(/\`\`\`\\s*$/, '').trim();
}

function cleanGeneratedText(value: unknown): string {
  return String(value || '')
    .replace(/[\\u2013\\u2014]/g, ',')
    .replace(/\\s+,/g, ',')
    .replace(/,\\s*,/g, ',')
    .trim();
}

function parseCampaign(text: string): CampaignPost[] {
  const parsed = JSON.parse(cleanJson(text)) as { posts?: CampaignPost[] };
  if (!Array.isArray(parsed.posts) || parsed.posts.length !== 5) {
    throw new Error('Amplifi did not return the required five-post campaign.');
  }
  return parsed.posts.map((post) => ({
    title: cleanGeneratedText(post.title),
    caption: cleanGeneratedText(post.caption),
    callToAction: cleanGeneratedText(post.callToAction),
    imageDirection: cleanGeneratedText(post.imageDirection),
  })).filter((post) => post.title && post.caption && post.callToAction && post.imageDirection);
}

function campaignFromText(text: string, promotion: string, architecture: CampaignArchitecture) {
  const parsed = JSON.parse(cleanJson(text)) as { campaignTitle?: string; strategy?: string; posts?: CampaignPost[] };
  const posts = parseCampaign(text);
  if (posts.length !== 5) throw new Error('Amplifi did not complete all five posts.');
  return {
    title: cleanGeneratedText(parsed.campaignTitle || promotion),
    strategy: cleanGeneratedText(parsed.strategy),
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
  const proof = input.proofPoint || '';
  const toneLead = input.tone === 'Provocative and challenging'
    ? 'Take a closer look: '
    : input.tone === 'Authoritative and premium'
      ? 'Here is what to know: '
      : input.tone === 'Warm and human'
        ? 'There is a simpler way forward. '
        : '';
  const posts: CampaignPost[] = [
    {
      title: 'Busy is not the same as growing',
      caption: `${toneLead}The work people accept as normal can quietly stand between them and the result they want. This campaign helps ${input.audience} recognize the cost of staying where they are,and see a more useful way forward.${detailLine}`,
      callToAction: `${input.callToAction}${linkLine}`,
      imageDirection: 'A bold pattern-interrupt graphic that contrasts constant activity with meaningful progress.',
    },
    {
      title: 'The hidden cost is what never gets done',
      caption: `Every avoidable delay competes with service, follow-up and growth. The real question is not whether the current approach still works. It is what becomes possible when a better approach gives people room to move.`,
      callToAction: `${input.callToAction}${linkLine}`,
      imageDirection: 'An editorial visual showing important opportunities waiting behind a wall of repetitive work.',
    },
    {
      title: proof ? 'Results make the difference real' : 'A clearer path changes what is possible',
      caption: proof
        ? `${proof}\n\nThat is more than a claim. It is a useful picture of what focused change can produce,and why the next improvement is worth exploring.`
        : `The goal is not change for its own sake. It is a clearer route to ${input.result}, supported by an approach people can understand and act on.`,
      callToAction: `${input.callToAction}${linkLine}`,
      imageDirection: proof
        ? 'A premium result card that pairs the verified outcome with a confident, original headline.'
        : 'A clean destination-focused visual that makes the desired outcome feel attainable.',
    },
    {
      title: 'Make the next step feel obvious',
      caption: `People move when they can see themselves in the outcome and understand what happens next. ${input.promotion} connects the problem they already feel with a practical route toward ${input.result}.`,
      callToAction: `${input.callToAction}${linkLine}`,
      imageDirection: 'A simple visual journey from a familiar obstacle to a clear, inviting next step.',
    },
    {
      title: 'Your next move starts here',
      caption: `The strongest time to act is when the problem is clear and the better outcome is within reach. Take one useful step now and see what ${input.promotion} can make possible.${detailLine}`,
      callToAction: `${input.callToAction}${linkLine}`,
      imageDirection: 'A decisive call-to-action graphic with a clear focal point and enough space for the destination.',
    },
  ];
  return {
    title: input.promotion,
    strategy: 'One creative idea told in five distinct steps: earn attention, reveal the cost, build belief, make the solution clear and invite action.',
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
    toneStrength?: string;
    wordsUse?: string;
    wordsAvoid?: string;
    imageStyle?: string;
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
  const toneStrength = String(body.toneStrength || 'Balanced').trim();
  const wordsUse = String(body.wordsUse || '').trim();
  const wordsAvoid = String(body.wordsAvoid || '').trim();
  const imageStyle = String(body.imageStyle || 'Branded proof graphics').trim();
  const requestedPlatforms = Array.isArray(body.platforms)
    ? body.platforms.map(String).map((item) => item.trim()).filter(Boolean).join(', ')
    : '';
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
    'Act as the senior creative director and conversion copywriter at an excellent advertising agency.',
    'Treat the brief below as raw strategy material, never as draft copy. Transform it into an original campaign concept, slogan-quality hooks and persuasive posts.',
    'Do not echo, lightly rewrite or use the client input as the headline. Do not copy a phrase of five or more words from the brief except a proper name, verified fact, required CTA or URL.',
    'Build one memorable big idea across five posts. Give every post a different job: 1) attract attention, 2) expose or educate around the pain, 3) build trust with proof or useful insight, 4) answer an objection or make the solution easy to understand, 5) sell the next step.',
    'Each caption must add a fresh idea. Do not repeat a headline in its caption or repeat a point across posts.',
    'Never use an em dash or en dash. Use a period, comma, colon or parentheses instead.',
    'Use emotional relevance, specificity, contrast, curiosity and benefit-led writing where appropriate. Make the audience feel understood, informed and ready to act without hype.',
    'Return: {"campaignTitle": string, "strategy": string, "posts": [{"title": string, "caption": string, "callToAction": string, "imageDirection": string}]}.',
    `What is being promoted: ${promotion}`,
    `Audience: ${resolvedAudience}`,
    `Desired result: ${result}`,
    `Required call to action: ${resolvedCallToAction}`,
    `Call-to-action URL: ${resolvedCtaUrl || 'Product-specific links are listed below.'}`,
    `Tone: ${tone}`,
    `Tone strength: ${toneStrength}`,
    `Platforms: ${requestedPlatforms || 'Facebook and Instagram'}`,
    `Words the client likes: ${wordsUse || 'None specified.'}`,
    `Words to avoid: ${wordsAvoid || 'None specified.'}`,
    `Visual style: ${imageStyle}`,
    `Specific proof point: ${proofPoint || 'None provided; do not invent proof.'}`,
    `Audience pain question: ${painQuestion || 'None provided.'}`,
    `Important dates and details: ${details || 'None provided; do not invent any.'}`,
    portfolioPrompt,
    'Write like a trusted guide speaking directly to the reader. Use plain language, show what the reader can do next and avoid consultant terminology.',
    'Do not repeat the image headline as the opening sentence of the caption. The image says it once; the caption should add useful context.',
    'Avoid phrases such as operationally, capacity returned, leverage, optimize, transformation, friction and strategic.',
    'Include the CTA URL naturally in every post where a next step is appropriate.',
  ].join('\n');

  try {
    const response = await runAIGateway({
      responseFormat: 'json',
      temperature: 0.65,
      maxOutputTokens: 3200,
      system: 'You are Amplifi, a senior advertising creative director and conversion copywriter. Turn client facts into original campaign ideas that attract, inform, persuade and sell. Never mirror the brief, fabricate proof, use empty hype, or use em dashes or en dashes. Return valid JSON only.',
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
