import { NextRequest, NextResponse } from 'next/server';
import { requireAdminActionFromRequest } from '@/lib/admin-session-guard';
import {
  getLatestExperienceReview,
  listExperienceDirectorDashboardRows,
  runExperienceDirectorReview,
} from '@/lib/factory-experience-director';

export const dynamic = 'force-dynamic';

/**
 * Experience Director dashboard API.
 * GET — list projects with latest Experience Review
 * POST { projectId } — run evaluator (append review artifact; not Launch orchestration)
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const projectId = req.nextUrl.searchParams.get('projectId')?.trim();
  if (projectId) {
    const review = await getLatestExperienceReview(projectId);
    return NextResponse.json({ ok: true, projectId, review });
  }

  const rows = await listExperienceDirectorDashboardRows();
  return NextResponse.json({ ok: true, rows });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: { projectId?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const projectId = String(body.projectId || '').trim();
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required.' }, { status: 400 });
  }

  const result = await runExperienceDirectorReview(projectId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Review failed.' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, review: result.summary });
}
