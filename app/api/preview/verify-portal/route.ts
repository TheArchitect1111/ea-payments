import { NextResponse } from 'next/server';
import { AMANDA_COURSES } from '@/lib/amanda-catherine/config';
import { amandaCourseReady } from '@/lib/amanda-catherine/lms-policy';

export const dynamic = 'force-dynamic';
export async function POST() {
  if (process.env.VERCEL_ENV !== 'preview') return new Response(null, { status: 404 });
  const courses = AMANDA_COURSES.filter(course => amandaCourseReady(course.id)).map(course => course.id);
  if (courses.length !== 5) return NextResponse.json({ ok: false, error: 'Expected five READY courses' }, { status: 409 });
  return NextResponse.json({
    is_test: true, synthetic: true, catalog: 12, ready: 5, courses,
    auth_granted: false,
  }, { headers: { 'Cache-Control': 'no-store' } });
}

// Read-only preview probe exercises the identical synthetic handler as POST.
export async function GET() {
  return POST();
}
