import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { routeIntent } from '@/lib/intent-router';
import { voiceIntentFromRoute } from '@/lib/intent-voice';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as { intent?: string };
  const intent = body.intent?.trim();
  if (!intent) {
    return NextResponse.json({ error: 'Intent is required.' }, { status: 400 });
  }

  const route = routeIntent(intent);
  const voice = voiceIntentFromRoute(route, intent);

  return NextResponse.json({ ok: true, route, voice });
}
