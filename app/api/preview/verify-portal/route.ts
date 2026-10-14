import { NextResponse } from 'next/server';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { getAmandaAssignedAudience } from '@/lib/amanda-catherine/client-access';
import { AMANDA_COURSES } from '@/lib/amanda-catherine/config';
import { amandaCourseReady } from '@/lib/amanda-catherine/lms-policy';

export const dynamic = 'force-dynamic';
export async function POST() {
  // Preview-only verification. Never process payment or write entitlements.
  if (process.env.VERCEL_ENV !== 'preview') return new Response(null, { status: 404 });
  try {
    const { client, session } = await requirePortalModule('amanda-catherine', 'dashboard');
    const email = (session.email || client.email || '').trim().toLowerCase();
    if ((await getAmandaAssignedAudience('amanda-catherine', email)) !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Owner session required' }, { status: 403 });
    }
    const ready = AMANDA_COURSES.filter(course => amandaCourseReady(course.id));
    if (ready.length !== 5) return NextResponse.json({ ok: false, error: 'Expected exactly five ready courses' }, { status: 409 });
    return NextResponse.json({
      ok: true,
      is_test: true,
      simulated: true,
      persisted: false,
      ownerRole: 'admin',
      readyCourseIds: ready.map(course => course.id),
      ownerCatalogCount: 12,
      learningPath: '/portal/amanda-catherine/learning',
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ ok: false, error: 'Authenticated Amanda owner session required' }, { status: 401 });
  }
}
