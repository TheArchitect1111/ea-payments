import { NextResponse } from 'next/server';
import {
  getCaptureByConsiderSlug,
  saveOpportunityPayload,
} from '@/lib/capture-records';
import {
  embedOpportunityPayload,
  incrementViewTracking,
  parseOpportunityPayload,
} from '@/lib/opportunity-experience';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const capture = await getCaptureByConsiderSlug(slug);
  if (!capture) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const payload = parseOpportunityPayload(capture);
  if (!payload) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  let timeOnPageSeconds: number | undefined;
  try {
    const body = (await req.json()) as { timeOnPageSeconds?: number };
    timeOnPageSeconds = body.timeOnPageSeconds;
  } catch {
    // initial view ping has no body
  }

  const updated = incrementViewTracking(payload, timeOnPageSeconds);
  const description = embedOpportunityPayload(capture.description ?? '', updated);

  await saveOpportunityPayload(
    capture.id,
    description,
    updated.tracking.views > 0 ? 'Viewed' : capture.prospectStatus,
  );

  return NextResponse.json({ ok: true, views: updated.tracking.views });
}
