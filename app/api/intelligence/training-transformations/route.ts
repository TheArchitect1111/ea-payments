import { NextResponse } from 'next/server';
import { hasAdminPageAccess } from '@/lib/admin-page-auth';
import { listTrainingTransformations } from '@/lib/training-transformation-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await hasAdminPageAccess())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const records = await listTrainingTransformations();
  return NextResponse.json({ ok: true, records });
}
