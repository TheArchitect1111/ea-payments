import { NextRequest, NextResponse } from 'next/server';
import { hasAdminPageAccess } from '@/lib/admin-page-auth';
import { publishTrainingTransformation } from '@/lib/training-transformation-store';

export const dynamic = 'force-dynamic';

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, { params }: RouteProps) {
  if (!(await hasAdminPageAccess())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { targets?: string[] };
  const record = await publishTrainingTransformation(id, body.targets ?? ['Training Hub', 'Client Portal', 'Pulse']);
  if (!record) return NextResponse.json({ ok: false, error: 'Not found.' }, { status: 404 });
  return NextResponse.json({ ok: true, record });
}
