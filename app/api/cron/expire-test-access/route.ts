import { NextRequest, NextResponse } from 'next/server';
import { expireAmandaTestEntitlements } from '@/lib/amanda-catherine/client-access';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Hourly reconciliation, guarded by Vercel CRON_SECRET. Expired grants are also
 * denied at request time even if a cron invocation is delayed. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await expireAmandaTestEntitlements();
    console.info('[amanda-expiry-cron]', JSON.stringify({
      scanned: result.scanned, expired: result.expired, errorCount: result.errors.length,
    }));
    return NextResponse.json({ ...result, at: new Date().toISOString() }, { status: result.ok ? 200 : 503 });
  } catch (error) {
    console.error('[amanda-expiry-cron] failed', error);
    return NextResponse.json({ ok: false, error: 'Expired access reconciliation failed' }, { status: 503 });
  }
}
