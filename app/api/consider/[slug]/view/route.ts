import { NextResponse } from 'next/server';
import { trackConsiderEvent } from '@/lib/opportunity-tracking';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  let event: 'view' | 'assessment_started' | 'assessment_completed' | 'discovery_booked' = 'view';
  let timeOnPageSeconds: number | undefined;

  try {
    const body = (await req.json()) as {
      event?: string;
      timeOnPageSeconds?: number;
    };
    if (body.event === 'assessment_started') event = 'assessment_started';
    if (body.event === 'assessment_completed') event = 'assessment_completed';
    if (body.event === 'discovery_booked') event = 'discovery_booked';
    timeOnPageSeconds = body.timeOnPageSeconds;
  } catch {
    // view ping without body
  }

  await trackConsiderEvent(slug, event, { timeOnPageSeconds });
  return NextResponse.json({ ok: true });
}
