import { NextRequest, NextResponse } from 'next/server';
import { answerGuideQuestion } from '@/lib/ea-guide-knowledge';
import { resolveGuidePageContext } from '@/lib/ea-guide-context';
import { resolveSessionFromRequest } from '@/lib/auth/session';
import { resolveAIActor } from '@/lib/ai/auth';
import type { AIRequestContext } from '@/lib/ai/types';
import { runOrchestrator } from '@/lib/agents/orchestrator';
import { buildEvaPortalGuideContext } from '@/lib/eva-portal-guide';

function requestId() {
  return `eva_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function confidence(value: number): 'high' | 'medium' | 'low' {
  if (value >= 0.8) return 'high';
  if (value >= 0.55) return 'medium';
  return 'low';
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { question?: string; pathname?: string };
  const session = await resolveSessionFromRequest(request, { realm: 'portal' });
  if (!session) {
    return NextResponse.json({ error: 'Portal authentication required.' }, { status: 401 });
  }

  const question = body.question?.trim() ?? '';
  const pathname = body.pathname ?? '/';
  const context = resolveGuidePageContext(pathname, session.email ?? session.sub);
  context.organizationId = session.orgId ?? session.slug;
  const local = answerGuideQuestion(question, context);
  const guide = buildEvaPortalGuideContext(question, pathname, Boolean(local.answer?.trim()));
  const actions = guide.destination ? [guide.destination] : [];

  const actor = await resolveAIActor();
  if (!actor || !guide.portalSlug || !question) {
    return NextResponse.json({ ...local, context, outcome: guide.outcome, actions, agents: [] });
  }

  const id = requestId();
  const aiContext: AIRequestContext = {
    requestId: id,
    actor,
    conversationId: `eva-portal-${guide.portalSlug}`,
    route: '/api/ea-guide/ask',
    metadata: { intent: 'portal-help' },
  };

  try {
    const orchestrated = await runOrchestrator(
      {
        message: question,
        intent: 'portal-help',
        conversationId: `eva-portal-${guide.portalSlug}`,
        maxAgents: 3,
        context: {
          clientId: guide.portalSlug,
          portalSlug: guide.portalSlug,
          organizationId: session.orgId ?? session.slug,
          path: pathname,
          currentModule: guide.currentModule,
          currentPageLabel: guide.currentPageLabel,
          suggestedDestination: guide.destination?.href,
          helpMode: true,
          approvalBoundary: 'Never claim an action was completed unless the system actually performed and verified it.',
        },
      },
      aiContext,
    );

    const answer = orchestrated.response.summary?.trim() || local.answer;
    const nextSteps = orchestrated.response.recommendedNextSteps?.length
      ? orchestrated.response.recommendedNextSteps.slice(0, 4)
      : local.nextSteps;
    const outcome = buildEvaPortalGuideContext(question, pathname, Boolean(answer?.trim())).outcome;

    return NextResponse.json({
      ...local,
      answer,
      nextSteps,
      confidence: confidence(orchestrated.response.confidence),
      suggestEscalation: outcome === 'Needs EA support' || Boolean(local.suggestEscalation),
      context,
      outcome,
      actions,
      agents: orchestrated.agents.map((agent) => agent.name),
    });
  } catch {
    return NextResponse.json({
      ...local,
      context,
      outcome: guide.outcome,
      actions,
      agents: [],
    });
  }
}
