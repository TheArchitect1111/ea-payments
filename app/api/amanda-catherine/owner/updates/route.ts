import { NextRequest, NextResponse } from 'next/server';
import { createAmandaUpdateRequest, listAmandaUpdateRequests } from '@/lib/amanda-catherine/update-requests';
import type { AmandaChangeArea } from '@/lib/amanda-catherine/update-governance';

const AREAS = new Set<AmandaChangeArea>(['content','image','course','price','layout','integration','new-feature']);

export async function GET() {
  return NextResponse.json({ requests: await listAmandaUpdateRequests() });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { area?: AmandaChangeArea; request?: string; source?: 'update-hub'|'eva' } | null;
  if (!body?.area || !AREAS.has(body.area) || !body.request?.trim()) return NextResponse.json({ error: 'area and request are required' }, { status: 400 });
  const result = await createAmandaUpdateRequest({ area: body.area, request: body.request, source: body.source });
  if (!result.ok) return NextResponse.json({ error: 'Request could not be persisted safely' }, { status: 503 });
  return NextResponse.json(result, { status: 201 });
}
