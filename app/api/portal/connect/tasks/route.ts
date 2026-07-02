import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromRequest } from '@/lib/auth';
import { completeConnectFollowUpTask, listConnectFollowUpTasks } from '@/lib/connect-tasks';
import { roleAtLeast, normalizeRole } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await resolveSessionFromRequest(req, { realm: 'portal' });
  if (!session?.slug) {
    return NextResponse.json({ error: 'Portal login required.' }, { status: 401 });
  }
  if (!roleAtLeast(normalizeRole(session.role), 'staff')) {
    return NextResponse.json({ error: 'Staff access required.' }, { status: 403 });
  }

  const tasks = await listConnectFollowUpTasks(session.slug);
  return NextResponse.json({ ok: true, orgSlug: session.slug, ...tasks });
}

export async function POST(req: NextRequest) {
  const session = await resolveSessionFromRequest(req, { realm: 'portal' });
  if (!session?.slug) {
    return NextResponse.json({ error: 'Portal login required.' }, { status: 401 });
  }
  if (!roleAtLeast(normalizeRole(session.role), 'staff')) {
    return NextResponse.json({ error: 'Staff access required.' }, { status: 403 });
  }

  let body: { relationshipId?: string; note?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const relationshipId = body.relationshipId?.trim();
  if (!relationshipId) {
    return NextResponse.json({ error: 'relationshipId is required.' }, { status: 400 });
  }

  try {
    const result = await completeConnectFollowUpTask({
      orgSlug: session.slug,
      relationshipId,
      completedBy: session.email ?? session.sub,
      note: body.note,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to complete follow-up.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
