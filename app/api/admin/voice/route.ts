import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { routeIntent } from '@/lib/intent-router';
import { enhanceVoiceResponse, type VoiceIntent } from '@/lib/ea-voice';

function routeToVoiceIntent(route: ReturnType<typeof routeIntent>): VoiceIntent {
  if (route.voiceIntent) return route.voiceIntent;

  const sources = ['EA Intent Router (portal-chassis)'];
  const actionMap: Record<string, VoiceIntent['action']> = {
    navigate: 'navigate',
    capture: 'capture',
    tour: 'tour',
    analyze: 'analyze',
    audit: 'audit',
    explain: 'explain',
    orchestrate: 'search_graph',
  };

  return {
    action: actionMap[route.type] ?? 'unknown',
    href: route.href,
    query: route.query,
    message: route.message,
    confidence: route.confidence,
    sources,
  };
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const body = (await req.json()) as { query?: string; enhance?: boolean };
  const query = body.query?.trim();
  if (!query) {
    return Response.json({ ok: false, error: 'Query is required.' }, { status: 400 });
  }

  const route = routeIntent(query);
  let intent = routeToVoiceIntent(route);
  if (body.enhance !== false) {
    intent = await enhanceVoiceResponse(intent, query);
  }

  return Response.json({ ok: true, intent, route });
}
