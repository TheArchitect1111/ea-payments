import { NextResponse } from 'next/server';
import { getClientByPortalSlug } from '@/lib/airtable';
import { requirePortalSession } from '@/lib/auth/resolve-portal-session';
import { loadSimplifiWorkspace } from '@/lib/simplifi-core';
import { answerSemanticAsk } from '@/lib/simplifi-os';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * POST /api/simplifi/ask
 * Hybrid semantic Ask with keyword fallback. Never enables OS_READ.
 */
export async function POST(request: Request) {
  const session = await requirePortalSession({ realm: 'simplifi' });
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Sign in required.' }, { status: 401 });
  }

  let body: { question?: string };
  try {
    body = (await request.json()) as { question?: string };
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (!question) {
    return NextResponse.json({ ok: false, error: 'question is required.' }, { status: 400 });
  }
  if (question.length > 2000) {
    return NextResponse.json({ ok: false, error: 'question too long.' }, { status: 400 });
  }

  const client = await getClientByPortalSlug(session.slug);
  const firstName = client?.clientName?.split(' ')[0] ?? '';
  const workspace = await loadSimplifiWorkspace(session.slug, EA_PLATFORM_URL, firstName, 40);

  const result = await answerSemanticAsk({
    portalSlug: session.slug,
    question,
    objects: workspace.objects,
    actionCenter: workspace.actionCenter,
    actorId: session.email ?? session.slug,
  });

  return NextResponse.json({
    ok: true,
    slug: session.slug,
    question,
    answer: result.answer,
    citations: result.citations,
    evidence: result.evidence,
    mode: result.mode,
    insufficientEvidence: result.insufficientEvidence,
  });
}
