import { NextRequest, NextResponse } from 'next/server';
import { requireAdminActionFromRequest } from '@/lib/admin-session-guard';
import { appendProjectContextOutput } from '@/lib/factory-project-context';
import { getFactoryProject } from '@/lib/factory-project-store';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const body = (await req.json().catch(() => null)) as {
    projectId?: string;
    decision?: 'approve' | 'reject';
    notes?: string;
  } | null;

  const projectId = body?.projectId?.trim();
  const decision = body?.decision;
  if (!projectId || (decision !== 'approve' && decision !== 'reject')) {
    return NextResponse.json(
      { ok: false, error: 'projectId and decision (approve|reject) required.' },
      { status: 400 },
    );
  }

  const project = await getFactoryProject(projectId);
  if (!project) {
    return NextResponse.json({ ok: false, error: 'Project not found.' }, { status: 404 });
  }

  await appendProjectContextOutput(projectId, {
    kind: 'production',
    worker: 'experience-creation-human-acceptance',
    payload: {
      decision,
      notes: body?.notes || '',
      reviewer: auth.user.email || auth.user.name || 'admin',
      at: new Date().toISOString(),
      deployAllowed: false,
    },
    detail: `Human acceptance ${decision} — deploy still gated until all subjects pass multimodal certification`,
  });

  return NextResponse.json({ ok: true, projectId, decision });
}
