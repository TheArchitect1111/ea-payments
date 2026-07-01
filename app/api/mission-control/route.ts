import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { buildMissionControlPayload } from '@/lib/mission-control-data';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roleParam = req.nextUrl.searchParams.get('role');
  const role = roleParam === 'builder' ? 'builder' : 'executive';

  const mission = await buildMissionControlPayload({ role });
  return NextResponse.json({ ok: true, mission });
}
