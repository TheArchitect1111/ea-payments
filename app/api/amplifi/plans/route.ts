import { NextResponse } from 'next/server';
import { AMPLIFI_PLANS, AMPLIFI_PLAN_ORDER } from '@/lib/amplifi-plans';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    plans: AMPLIFI_PLAN_ORDER.map(id => AMPLIFI_PLANS[id]),
  });
}
