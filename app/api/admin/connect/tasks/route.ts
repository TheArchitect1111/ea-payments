import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { adminAuthJsonError, requireAdminAction } from '@/lib/admin-session-guard';
import { EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { completeConnectFollowUpTask, listConnectFollowUpTasks } from '@/lib/connect-tasks';

export const dynamic = 'force-dynamic';

async function requireAdminManage() {
  const cookieStore = await cookies();
  return requireAdminAction(cookieStore.get(EA_ADMIN_COOKIE)?.value, 'admin:manage');
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminManage();
  if (!auth.ok) return adminAuthJsonError(auth);

  const orgSlug = request.nextUrl.searchParams.get('org')?.trim() || 'demo-client';
  const tasks = await listConnectFollowUpTasks(orgSlug);
  return NextResponse.json({ ok: true, orgSlug, ...tasks });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminManage();
  if (!auth.ok) return adminAuthJsonError(auth);

  let body: { orgSlug?: string; relationshipId?: string; note?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const orgSlug = body.orgSlug?.trim() || 'demo-client';
  const relationshipId = body.relationshipId?.trim();
  if (!relationshipId) {
    return NextResponse.json({ error: 'relationshipId is required.' }, { status: 400 });
  }

  try {
    const result = await completeConnectFollowUpTask({
      orgSlug,
      relationshipId,
      completedBy: 'admin',
      note: body.note,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to complete follow-up.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
