import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { getAgent } from '@/lib/agents/registry';
import type { AIRequestContext } from '@/lib/ai/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 90;

type FlowSummary = {
  find: string;
  leverage: string;
  optimize: string;
  win: string;
};

type Opportunity = {
  title: string;
  format: string;
  angle: string;
  reason: string;
  campaignBrief: string;
  hook: string;
  callToAction: string;
  score: number;
  readiness: 'ready' | 'needs-context';
};

function clampScore(value: unknown) {
  const score = Number(value);
  if (!Number.isFinite(score)) return 50;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeOpportunity(value: unknown): Opportunity | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  const title = String(item.title || '').trim();
  const format = String(item.format || '').trim();
  const angle = String(item.angle || '').trim();
  const reason = String(item.reason || '').trim();
  const campaignBrief = String(item.campaignBrief || '').trim();
  const hook = String(item.hook || '').trim();
  const callToAction = String(item.callToAction || '').trim();
  const readiness = item.readiness === 'needs-context' ? 'needs-context' : 'ready';
  if (!title || !format || !angle || !campaignBrief || !hook || !callToAction) return null;
  return {
    title,
    format,
    angle,
    reason,
    campaignBrief,
    hook,
    callToAction,
    score: clampScore(item.score),
    readiness,
  };
}

function normalizeFlowSummary(value: unknown): FlowSummary {
  if (!value || typeof value !== 'object') {
    return { find: '', leverage: '', optimize: '', win: '' };
  }
  const item = value as Record<string, unknown>;
  return {
    find: String(item.find || '').trim(),
    leverage: String(item.leverage || '').trim(),
    optimize: String(item.optimize || '').trim(),
    win: String(item.win || '').trim(),
  };
}

export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  const body = await req.json().catch(() => ({})) as {
    text?: string;
    links?: string[];
    files?: Array<{ name?: string; type?: string }>;
  };

  const text = String(body.text || '').trim().slice(0, 12000);
  const links = Array.isArray(body.links) ? body.links.map(String).slice(0, 10) : [];
  const files = Array.isArray(body.files)
    ? body.files.slice(0, 10).map((file) => ({
        name: String(file.name || ''),
        type: String(file.type || ''),
      }))
    : [];

  if (!text && links.length === 0 && files.length === 0) {
    return NextResponse.json({ ok: false, error: 'Add something to the Idea Box first.' }, { status: 400 });
  }

  const prompt = [
    'Analyze this raw Amplifi brain dump using the FLOW method before proposing content.',
    '',
    'FLOW method:',
    'FIND: identify the strongest themes, audience needs, questions, tensions, useful facts, proof already present, and important missing context. Do not claim external trends unless the supplied material supports them.',
    'LEVERAGE: identify the most valuable content angles, formats, sequences, stories, educational ideas, offers, proof moments, and repurposing opportunities hidden in the material.',
    'OPTIMIZE: improve each idea so it has one clear job, a strong hook, distinct audience takeaway, no repetition, no unsupported hype, and a useful next step.',
    'WIN: rank the best opportunities by usefulness, specificity, source support, audience value, and readiness to build now.',
    '',
    'Do not assume the user wants a single social post. Consider announcements, carousels, short videos, stories, event sequences, campaigns, testimonials, educational posts, countdowns, behind-the-scenes content, email/social combinations, recurring series, and repurposing when supported by the material.',
    'Return 5 to 7 distinct opportunities. Do not fabricate dates, attendance, revenue, customer results, quotes, testimonials, trends, or other proof.',
    'Every opportunity must be meaningfully different from the others.',
    'For each opportunity return: title, format, angle, reason, campaignBrief, hook, callToAction, score, readiness.',
    'score must be an integer from 0 to 100. readiness must be either ready or needs-context.',
    'If an opportunity depends on missing facts or proof, mark readiness as needs-context and explain the gap in reason.',
    'Never use em dashes or en dashes.',
    'Return valid JSON only in this shape:',
    '{"flowSummary":{"find":"","leverage":"","optimize":"","win":""},"opportunities":[{"title":"","format":"","angle":"","reason":"","campaignBrief":"","hook":"","callToAction":"","score":0,"readiness":"ready"}]}',
    `Brain dump text:\n${text || 'None supplied.'}`,
    `Links:\n${links.length ? links.join('\n') : 'None supplied.'}`,
    `Attached assets:\n${files.length ? files.map((file) => `${file.name} (${file.type || 'file'})`).join('\n') : 'None supplied.'}`,
  ].join('\n\n');

  try {
    const agent = getAgent('amplifi-content-director');
    if (!agent) throw new Error('Amplifi Content Director is not registered.');
    const requestContext: AIRequestContext = {
      requestId: crypto.randomUUID(),
      actor: {
        id: auth.session.sub || auth.session.email || tenant.organizationId,
        type: 'portal',
        email: auth.session.email,
        portalSlug: tenant.portalSlug,
        role: auth.session.role,
      },
      route: '/api/portal/amplifi/idea-box',
      metadata: { product: 'amplifi', workflow: 'idea-box-flow', agent: agent.name },
    };
    const result = await agent.execute({
      intent: 'amplifi idea box content opportunities',
      query: prompt,
      context: {
        organization: tenant.portalSlug,
        workflow: 'idea-box-flow',
        approvalGate: 'Review required before anything can be published.',
      },
    }, requestContext);

    const parsed = (result.raw ?? {}) as {
      flowSummary?: unknown;
      opportunities?: unknown[];
    };

    const flowSummary = normalizeFlowSummary(parsed.flowSummary);
    const opportunities = Array.isArray(parsed.opportunities)
      ? parsed.opportunities
          .map(normalizeOpportunity)
          .filter((item): item is Opportunity => Boolean(item))
          .sort((a, b) => b.score - a.score)
          .slice(0, 7)
      : [];

    if (opportunities.length < 3) throw new Error('Not enough usable opportunities returned.');

    return NextResponse.json({
      ok: true,
      method: 'FLOW',
      agent: agent.name,
      flowSummary,
      opportunities,
    });
  } catch {
    const seed = text || links[0] || files[0]?.name || 'your idea';
    const opportunities: Opportunity[] = [
      {
        title: 'Turn the idea into an announcement',
        format: 'Announcement post',
        angle: `Introduce ${seed.slice(0, 90)} with one clear reason the audience should care.`,
        reason: 'The source material contains something new or worth surfacing.',
        campaignBrief: `Create an announcement campaign from this source material: ${seed}`,
        hook: 'Something worth knowing is taking shape.',
        callToAction: 'Learn more about what comes next.',
        score: 88,
        readiness: 'ready',
      },
      {
        title: 'Break it into a short series',
        format: '3-part content series',
        angle: 'Use the raw material as three connected moments: why it matters, what to know and what to do next.',
        reason: 'A brain dump often contains more than one useful message.',
        campaignBrief: `Create a three-part educational and promotional series from: ${seed}`,
        hook: 'One idea can do more than one job.',
        callToAction: 'Follow the series for the next step.',
        score: 84,
        readiness: 'ready',
      },
      {
        title: 'Show the story behind it',
        format: 'Behind-the-scenes post',
        angle: 'Explain what inspired the idea and what the audience can expect from it.',
        reason: 'The source material includes context that can make the content more human.',
        campaignBrief: `Build a behind-the-scenes story and supporting social content from: ${seed}`,
        hook: 'The finished idea is only part of the story.',
        callToAction: 'See what inspired it.',
        score: 78,
        readiness: 'ready',
      },
      {
        title: 'Create a visual carousel',
        format: 'Carousel',
        angle: 'Turn the strongest points into a swipeable sequence with one idea per frame.',
        reason: 'The material can be simplified into a visual progression.',
        campaignBrief: `Create a concise carousel campaign from: ${seed}`,
        hook: 'Here is the idea in five clear frames.',
        callToAction: 'Swipe through the key points.',
        score: 74,
        readiness: 'ready',
      },
      {
        title: 'Build a next-step campaign',
        format: 'Mini campaign',
        angle: 'Move from awareness to interest to a clear next action without forcing everything into one post.',
        reason: 'The source material can support multiple stages of audience attention.',
        campaignBrief: `Create a coordinated mini campaign with a clear next action from: ${seed}`,
        hook: 'Attention is only useful when it leads somewhere.',
        callToAction: 'Take the next useful step.',
        score: 70,
        readiness: 'ready',
      },
    ];

    return NextResponse.json({
      ok: true,
      method: 'FLOW',
      agent: 'fallback',
      flowSummary: {
        find: 'Amplifi found the strongest usable signal in the supplied material.',
        leverage: 'Amplifi identified multiple ways to turn the source into useful content.',
        optimize: 'Ideas were separated by purpose so each one can do a distinct job.',
        win: 'Opportunities are ranked by immediate usefulness and readiness.',
      },
      opportunities,
      fallback: true,
    });
  }
}
