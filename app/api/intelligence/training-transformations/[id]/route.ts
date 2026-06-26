import { NextRequest, NextResponse } from 'next/server';
import { hasAdminPageAccess } from '@/lib/admin-page-auth';
import { getTrainingTransformation, updateTrainingTransformation } from '@/lib/training-transformation-store';

export const dynamic = 'force-dynamic';

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, { params }: RouteProps) {
  if (!(await hasAdminPageAccess())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const { id } = await params;
  const record = await getTrainingTransformation(id);
  if (!record) return NextResponse.json({ ok: false, error: 'Not found.' }, { status: 404 });
  return NextResponse.json({ ok: true, record });
}

export async function PATCH(req: NextRequest, { params }: RouteProps) {
  if (!(await hasAdminPageAccess())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json()) as {
    status?: 'review-ready' | 'approved' | 'published' | 'archived';
    tenantId?: string;
    publishTargets?: string[];
  };
  const record = await updateTrainingTransformation(id, {
    status: body.status,
    tenantId: body.tenantId?.trim() || undefined,
    publishTargets: body.publishTargets,
  });
  if (!record) return NextResponse.json({ ok: false, error: 'Not found.' }, { status: 404 });
  return NextResponse.json({ ok: true, record });
}
