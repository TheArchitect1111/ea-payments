import { NextResponse } from 'next/server';
import { registry } from '@/lib/amanda-catherine/registry';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const data = await registry();
    const courses = data.courses.filter(course => !course.isTest).map(course => ({
      key: course.key,
      title: course.title,
      status: course.status,
      description: course.description,
      square_checkout_url: course.square_checkout_url,
    }));
    return NextResponse.json({
      ok: true,
      courses,
      squareLinksCount: courses.filter(course => Boolean(course.square_checkout_url)).length,
    }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Amanda courses are unavailable',
    }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
