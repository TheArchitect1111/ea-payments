import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { adminAuthJsonError, requireAdminAction } from '@/lib/admin-session-guard';
import { logConnectNurtureRun } from '@/lib/connect-nurture-log';
import { processDueConnectSequences } from '@/lib/connect-sequence-runner';
import { EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Process all due Connect nurture steps now (no test seed). */
export async function POST() {
  const cookieStore = await cookies();
  const auth = await requireAdminAction(cookieStore.get(EA_ADMIN_COOKIE)?.value, 'admin:manage');
  if (!auth.ok) return adminAuthJsonError(auth);

  const result = await processDueConnectSequences();
  const run = await logConnectNurtureRun(result, 'admin-run', {
    note: 'Manual admin nurture run',
  });

  return NextResponse.json({
    ok: result.errors.length === 0,
    nurture: result,
    lastRun: run,
  });
}
