import { NextRequest, NextResponse } from 'next/server';
import { getAmplifiEntitlements } from '@/lib/amplifi-entitlements';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const plan = req.nextUrl.searchParams.get('plan');
  return NextResponse.json({ ok: true, ...getAmplifiEntitlements(plan) });
}
