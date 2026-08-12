import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSessionFromRequest } from '@/lib/admin-session-guard';
import { getAmandaLaunchReadiness } from '@/lib/amanda-catherine/readiness';

export const dynamic = 'force-dynamic';

/** GET /api/admin/amanda/readiness?slug=amanda-catherine — Amanda launch activation gate. */
export async function GET(req: NextRequest) {
  const auth = await requireAdminSessionFromRequest(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const slug = req.nextUrl.searchParams.get('slug')?.trim() || 'amanda-catherine';
  if (!slug.toLowerCase().startsWith('amanda-catherine')) {
    return NextResponse.json({ error: 'Amanda portal slug required.' }, { status: 400 });
  }

  const readiness = await getAmandaLaunchReadiness(slug);
  return NextResponse.json({ ok: true, ...readiness });
}
