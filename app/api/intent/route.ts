import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { routeIntent } from '@/lib/intent-router';
import { voiceIntentFromRoute } from '@/lib/intent-voice';
import { classifyEACommand, commandPreflight, type CommandEvidence } from '@/lib/ea-command-gate';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as { intent?: string; commandEvidence?: CommandEvidence };
  const intent = body.intent?.trim();
  if (!intent) {
    return NextResponse.json({ error: 'Intent is required.' }, { status: 400 });
  }

  const eaCommand = classifyEACommand(intent);
  const preflight = commandPreflight(eaCommand, body.commandEvidence);
  if (preflight.required && preflight.decision !== 'PASS') {
    return NextResponse.json({
      ok: false,
      governed: true,
      eaCommand,
      preflight,
      error: 'EA command blocked until canonical resolver and reliability evidence pass.',
      nextAction: 'Resolve the project through Control Plane/File Cabinet and retry with verified commandEvidence.',
    }, { status: 409 });
  }

  const route = routeIntent(intent);
  const voice = voiceIntentFromRoute(route, intent);

  return NextResponse.json({ ok: true, governed: true, eaCommand, preflight, route, voice });
}
