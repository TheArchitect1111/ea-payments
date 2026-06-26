import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE, parseAdminSession } from '@/lib/ea-admin-auth';
import { routeIntent } from '@/lib/intent-router';
import { runOrchestrator } from '@/lib/agents/orchestrator';
import type { AIRequestContext } from '@/lib/ai/types';

export const dynamic = 'force-dynamic';

function requestId() {
  return `intent_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const body = (await req.json()) as { query?: string; runOrchestrator?: boolean };
  const query = body.query?.trim();
  if (!query) {
    return Response.json({ ok: false, error: 'Query is required.' }, { status: 400 });
  }

  const route = routeIntent(query);

  if (route.type !== 'orchestrate' || body.runOrchestrator === false) {
    return Response.json({ ok: true, route });
  }

  const admin = parseAdminSession(token);
  const id = requestId();
  const context: AIRequestContext = {
    requestId: id,
    actor: {
      id: admin?.email ?? 'admin',
      type: 'admin',
      email: admin?.email,
      role: admin?.role,
    },
    route: '/api/admin/intent',
    metadata: { intent: route.orchestratorIntent ?? 'general' },
  };

  try {
    const orchestration = await runOrchestrator(
      {
        message: route.query ?? query,
        intent: route.orchestratorIntent,
        maxAgents: 2,
      },
      context,
    );

    let followUpHref: string | undefined;
    const intent = route.orchestratorIntent ?? '';
    if (intent.includes('proposal')) followUpHref = '/admin/proposals';
    if (intent.includes('blueprint')) followUpHref = '/admin/blueprints';
    if (intent.includes('research')) followUpHref = '/admin/resource-radar';

    return Response.json({
      ok: true,
      route: {
        ...route,
        followUpHref,
      },
      orchestration,
    });
  } catch (error) {
    return Response.json({
      ok: true,
      route,
      orchestrationError: error instanceof Error ? error.message : 'Orchestrator unavailable.',
    });
  }
}
