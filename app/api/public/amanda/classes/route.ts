import { NextResponse } from 'next/server';
import { registry } from '@/lib/amanda-catherine/registry';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { courses } = await registry();
    const classes = courses.filter((course) => !course.isTest && course.isActive && course.isVisible);
    return NextResponse.json(
      { count: classes.length, classes },
      { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600' } },
    );
  } catch (error) {
    console.error('[amanda-classes] public read failed', error);
    return NextResponse.json(
      { count: 0, classes: [], error: 'Class list is temporarily unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
