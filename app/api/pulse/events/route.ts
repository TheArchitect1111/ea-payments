import { NextRequest, NextResponse } from 'next/server';
import { adminApiUnauthorized, guardAdminApi } from '@/lib/api/admin-route';
import { getCaptureApiKey } from '@/lib/capture-api-key';
import { emitPulseEvent, listRecentPulseEvents, type PulseEvent } from '@/lib/pulse-bus';

export const dynamic = 'force-dynamic';
const INGEST_KEY = process.env.PULSE_INGEST_KEY ?? getCaptureApiKey();

export async function POST(req: NextRequest) {
  const key = req.headers.get('x-ea-pulse-key') ?? req.headers.get('x-ea-capture-key');
  if (!INGEST_KEY || key !== INGEST_KEY) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  const body = (await req.json()) as Partial<PulseEvent>;
  if (!body.product || !body.type || !body.title) {
    return NextResponse.json({ ok: false, error: 'product, type, and title required' }, { status: 400 });
  }
  return NextResponse.json(await emitPulseEvent({
    product: body.product, type: body.type, title: body.title, detail: body.detail,
    priority: body.priority, href: body.href, tenantId: body.tenantId,
    objectId: body.objectId, metadata: body.metadata,
  }));
}

export async function GET(req: NextRequest) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return adminApiUnauthorized(auth);
  return NextResponse.json({ ok: true, events: listRecentPulseEvents(30) });
}
