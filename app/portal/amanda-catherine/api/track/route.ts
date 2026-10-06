import type { NextRequest } from 'next/server';
import { POST as postTrack } from '@/app/api/amanda-catherine/track/route';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  return postTrack(request);
}
