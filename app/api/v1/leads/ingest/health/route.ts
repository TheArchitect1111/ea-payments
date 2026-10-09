import { NextResponse } from 'next/server';
import { rows } from '@/lib/amanda-catherine/registry';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const registrations = await rows(
      'portal_registrations',
      "IS_AFTER({created_at}, DATEADD(NOW(), -1, 'day'))",
    );
    return NextResponse.json(
      { ok: true, count: registrations.length, window_hours: 24 },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[lead-ingest-health] registration count failed', error);
    return NextResponse.json(
      { ok: false, error: 'Registration count is temporarily unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
