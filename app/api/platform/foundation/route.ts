import { NextResponse } from 'next/server';
import { getPlatformFoundationStatus } from '@/lib/platform/foundation-status';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getPlatformFoundationStatus());
}
