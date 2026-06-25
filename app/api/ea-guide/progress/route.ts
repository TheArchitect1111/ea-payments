import { NextResponse } from 'next/server';
import { listGuideProgress, upsertGuideProgress } from '@/lib/ea-guide-store';
import type { GuideProgress } from '@/lib/ea-guide-types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }
  const progress = await listGuideProgress(userId);
  return NextResponse.json({ progress });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<GuideProgress>;
  if (!body.userId || !body.tourId) {
    return NextResponse.json({ error: 'userId and tourId required' }, { status: 400 });
  }
  const entry = await upsertGuideProgress({
    userId: body.userId,
    tourId: body.tourId,
    organizationId: body.organizationId,
    completedAt: body.completedAt,
    skippedAt: body.skippedAt,
    lastStepIndex: body.lastStepIndex,
  });
  return NextResponse.json({ progress: entry });
}
