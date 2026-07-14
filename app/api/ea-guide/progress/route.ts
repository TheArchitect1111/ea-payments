import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromRequest } from '@/lib/auth/session';
import { listGuideProgress, upsertGuideProgress } from '@/lib/ea-guide-store';
import type { GuideProgress } from '@/lib/ea-guide-types';

function actor(session: Awaited<ReturnType<typeof resolveSessionFromRequest>>) {
  if (!session) return null;
  const userId = session.email ?? session.sub;
  if (!userId) return null;
  return { userId, organizationId: session.orgId ?? session.slug };
}

export async function GET(request: NextRequest) {
  const identity = actor(await resolveSessionFromRequest(request));
  if (!identity) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const progress = await listGuideProgress(identity.userId);
  return NextResponse.json({ progress });
}

export async function POST(request: NextRequest) {
  const identity = actor(await resolveSessionFromRequest(request));
  if (!identity) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as Partial<GuideProgress>;
  if (!body.tourId) {
    return NextResponse.json({ error: 'tourId required' }, { status: 400 });
  }
  const entry = await upsertGuideProgress({
    userId: identity.userId,
    tourId: body.tourId,
    organizationId: identity.organizationId,
    completedAt: body.completedAt,
    skippedAt: body.skippedAt,
    lastStepIndex: body.lastStepIndex,
  });
  return NextResponse.json({ progress: entry });
}
