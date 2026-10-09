import { NextRequest, NextResponse } from 'next/server';
import { requireAdminActionFromRequest } from '@/lib/admin-session-guard';
import { getHqProject, makePublicProject, saveHqProject, undoHqProject, type HqProject } from '../../../_lib/hq-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const project = await getHqProject(id);
  if (!project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
  return NextResponse.json({ project: makePublicProject(project) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await context.params;
  const body = await req.json().catch(() => null) as { project?: HqProject; action?: string } | null;
  try {
    if (body?.action === 'undo') {
      const restored = await undoHqProject(id);
      return restored
        ? NextResponse.json({ project: restored })
        : NextResponse.json({ error: 'No saved version is available to undo.' }, { status: 404 });
    }
    if (!body?.project || body.project.id !== id || !Array.isArray(body.project.items)) {
      return NextResponse.json({ error: 'A valid project update is required.' }, { status: 400 });
    }
    const saved = { ...body.project, updatedAt: new Date().toISOString(), updatedBy: auth.user.name || 'Robert' };
    await saveHqProject(saved);
    return NextResponse.json({ project: saved });
  } catch (error) {
    console.error('[phone-hq] save failed', error);
    return NextResponse.json({ error: 'Persistent storage is unavailable. No changes were saved.' }, { status: 503 });
  }
}
