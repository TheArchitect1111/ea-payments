import { NextRequest, NextResponse } from 'next/server';
import { requireFactoryApiAccess } from '@/lib/factory-api-auth';
import { notifyFactoryDone } from '@/lib/factory-notify';
import { getProject } from '@/lib/factory-project';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

type Params = { params: Promise<{ id: string }> };

/** Resend founder-facing package email (plain brief + images), no login needed to read it. */
export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireFactoryApiAccess(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const project = await getProject(id.trim());
  if (!project) {
    return NextResponse.json({ ok: false, error: 'Project not found.' }, { status: 404 });
  }

  const result = await notifyFactoryDone(project.id, { force: true });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    projectId: project.id,
    message: 'Package email sent.',
  });
}
