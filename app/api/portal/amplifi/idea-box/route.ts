import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { runAIGateway } from '@/lib/ai/gateway';

export const dynamic = 'force-dynamic';
export const maxDuration = 90;

type Opportunity = {
  title: string;
  format: string;
  angle: string;
  reason: string;
  campaignBrief: string;
};

function cleanJson(text: string) {
  return text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
}

function normalizeOpportunity(value: unknown): Opportunity | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  const title = String(item.title || '').trim();
  const format = String(item.format || '').trim();
  const angle = String(item.angle || '').trim();
  const reason = String(item.reason || '').trim();
  const campaignBrief = String(item.campaignBrief || '').trim();
  if (!title || !format || !angle || !campaignBrief) return null;
  return { title, format, angle, reason, campaignBrief };
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
  const files = Array.isArray(body.files) ? body.files.slice(0, 10).map((file) => ({ name: String(file.name || ''), type: String(file.type || '') })) : [];
  if (!text && links.length === 0 && files.length === 0) {
    return NextResponse.json({ ok: false, error: 'Add something to the Idea Box first.' }, { status: 400 });
  }

  const prompt = [
    'The user has given Amplifi a raw brain dump. Find the useful content opportunities inside it.',
    'Do not assume they want a single social post. Consider announcements, carousels, short videos, stories, event sequences, campaigns, testimonials, educational posts, countdowns, behind-the-scenes content, email/social combinations and recurring series when supported by the material.',
    'Return 5 to 7 distinct opportunities. Do not fabricate dates, attendance, revenue, customer results, quotes or other proof.',
    'For each opportunity return: title, format, angle, reason, campaignBrief.',
    'title: a clear working concept. format: the best content format. angle: one concise sentence describing what the audience should take away. reason: why this opportunity is present in the supplied material. campaignBrief: a concise brief that Amplifi can pass into its campaign builder.',
    'Never use em dashes or en dashes.',
    'Return valid JSON only in this shape: {"opportunities":[{"title":"","format":"","angle":"","reason":"","campaignBrief":""}]}',
    `Organization: ${tenant.portalSlug}`,
    `Brain dump text:\n${text || 'None supplied.'}`,
    `Links:\n${links.length ? links.join('\n') : 'None supplied.'}`,
    `Attached assets:\n${files.length ? files.map((file) => `${file.name} (${file.type || 'file'})`).join('\n') : 'None supplied.'}`,
  ].join('\n\n');

  try {
    const response = await runAIGateway({
      responseFormat: 'json',
      temperature: 0.55,
      maxOutputTokens: 2400,
      system: 'You are Amplifi Idea Box, a sharp content strategist. Turn messy raw material into specific, useful content opportunities without inventing facts. Return JSON only.',
      messages: [{ role: 'user', content: prompt }],
      metadata: { product: 'amplifi', workflow: 'idea-box' },
    }, {
      requestId: crypto.randomUUID(),
      actor: {
        id: auth.session.sub || auth.session.email || tenant.organizationId,
        type: 'portal',
        email: auth.session.email,
        portalSlug: tenant.portalSlug,
        role: auth.session.role,
      },
      route: '/api/portal/amplifi/idea-box',
    });

    const parsed = JSON.parse(cleanJson(response.text)) as { opportunities?: unknown[] };
    const opportunities = Array.isArray(parsed.opportunities)
      ? parsed.opportunities.map(normalizeOpportunity).filter((item): item is Opportunity => Boolean(item)).slice(0, 7)
      : [];
    if (opportunities.length < 3) throw new Error('Not enough usable opportunities returned.');
    return NextResponse.json({ ok: true, opportunities });
  } catch {
    const seed = text || links[0] || files[0]?.name || 'your idea';
    const opportunities: Opportunity[] = [
      { title: 'Turn the idea into an announcement', format: 'Announcement post', angle: `Introduce ${seed.slice(0, 90)} with one clear reason the audience should care.`, reason: 'The source material contains something new or worth surfacing.', campaignBrief: `Create an announcement campaign from this source material: ${seed}` },
      { title: 'Break it into a short series', format: '3-part content series', angle: 'Use the raw material as three connected moments: why it matters, what to know and what to do next.', reason: 'A brain dump often contains more than one useful message.', campaignBrief: `Create a three-part educational and promotional series from: ${seed}` },
      { title: 'Show the story behind it', format: 'Behind-the-scenes post', angle: 'Explain what inspired the idea and what the audience can expect from it.', reason: 'The source material includes context that can make the content more human.', campaignBrief: `Build a behind-the-scenes story and supporting social content from: ${seed}` },
      { title: 'Create a visual carousel', format: 'Carousel', angle: 'Turn the strongest points into a swipeable sequence with one idea per frame.', reason: 'The material can be simplified into a visual progression.', campaignBrief: `Create a concise carousel campaign from: ${seed}` },
      { title: 'Build a next-step campaign', format: 'Mini campaign', angle: 'Move from awareness to interest to a clear next action without forcing everything into one post.', reason: 'The source material can support multiple stages of audience attention.', campaignBrief: `Create a coordinated mini campaign with a clear next action from: ${seed}` },
    ];
    return NextResponse.json({ ok: true, opportunities, fallback: true });
  }
}
