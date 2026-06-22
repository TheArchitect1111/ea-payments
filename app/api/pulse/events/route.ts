import { NextRequest, NextResponse } from 'next/server';
import { emitPulseEvent, type PulseEvent } from '@/lib/pulse-bus';

export const dynamic = 'force-dynamic';

const INGEST_KEY = process.env.PULSE_INGEST_KEY ?? process.env.EA_CAPTURE_API_KEY;

export async function POST(req: NextRequest) {
  const key = req.headers.get('x-ea-pulse-key') ?? req.headers.get('x-ea-capture-key');
  if (!INGEST_KEY || key !== INGEST_KEY) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as Partial<PulseEvent>;
  if (!body.product || !body.type || !body.title) {
    return NextResponse.json({ ok: false, error: 'product, type, and title required' }, { status: 400 });
  }

  const result = await emitPulseEvent({
    product: body.product,
    type: body.type,
    title: body.title,
    detail: body.detail,
    priority: body.priority,
    href: body.href,
    tenantId: body.tenantId,
    objectId: body.objectId,
    metadata: body.metadata,
  });

  return NextResponse.json(result);
}

export async function GET() {
  const { listRecentPulseEvents } = await import('@/lib/pulse-bus');
  return NextResponse.json({ ok: true, events: listRecentPulseEvents(30) });
}
