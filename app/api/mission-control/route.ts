import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE, parseAdminSession } from '@/lib/ea-admin-auth';
import { buildMissionControlPayload } from '@/lib/mission-control-data';

export const dynamic = 'force-dynamic';

function parseMissionControlRole(raw: string | null): 'executive' | 'builder' {
  return raw === 'builder' ? 'builder' : 'executive';
}

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const role = parseMissionControlRole(searchParams.get('mode'));
  const user = parseAdminSession(token);

  const mission = await buildMissionControlPayload({
    role,
    userName: user?.name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'there',
  });

  let platformGuardian: { opsScore: number; ok: boolean; summary: string } | undefined;
  try {
    const { runPlatformGuardianAudit } = await import('@/lib/platform-guardian');
    const guardian = await runPlatformGuardianAudit({ probeRoutes: false, sendDailyBrief: false });
    platformGuardian = {
      opsScore: guardian.opsScore,
      ok: guardian.ok,
      summary: guardian.executiveSummary,
    };
  } catch {
    platformGuardian = undefined;
  }

  return Response.json({ ...mission, platformGuardian });
}
