import { NextResponse } from 'next/server';
import { listPlatformActivityEvents } from '@/lib/activity-events-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const events = await listPlatformActivityEvents('ea', 1);
    return NextResponse.json({ ok: true, count: events.length });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
