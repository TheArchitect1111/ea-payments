import { NextResponse } from 'next/server';
import { getPlatformCprReadiness } from '@/lib/platform/cpr-readiness';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getPlatformCprReadiness());
}
