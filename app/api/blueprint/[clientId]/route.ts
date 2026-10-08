import { getBlueprintRecord, publicBlueprint, recalculateCapacity, saveBlueprintRecord } from '@/lib/blueprint-store';
import { authorizeBlueprintRequest } from '@/lib/blueprint-access';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function cors(origin: string | null) {
  const allowed = Boolean(
    !origin ||
    origin === 'https://cc.efficiencyarchitects.online' ||
    origin === 'https://app.efficiencyarchitects.online' ||
    /^https:\/\/(?:efficiency-architects|ea-payments)-[a-z0-9-]+\.vercel\.app$/i.test(origin)
  );
  return {
    allowed,
    headers: {
      'Access-Control-Allow-Origin': allowed && origin ? origin : 'https://app.efficiencyarchitects.online',
      'Access-Control-Allow-Methods': 'GET,PATCH,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    },
  };
}

export async function OPTIONS(request: Request) {
  const c = cors(request.headers.get('origin'));
  return new Response(null, { status: c.allowed ? 204 : 403, headers: c.headers });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const c = cors(request.headers.get('origin'));
  if (!c.allowed) return Response.json({ ok: false }, { status: 403, headers: c.headers });
  const { clientId } = await params;
  const record = await getBlueprintRecord(clientId);
  if (!record) return Response.json({ ok: false, error: 'Blueprint not found.' }, { status: 404, headers: c.headers });
  const auth = await authorizeBlueprintRequest(request, record);
  if (!auth.ok) return Response.json({ ok: false, error: auth.error }, { status: auth.status, headers: c.headers });
  return Response.json({ ok: true, record: publicBlueprint(record) }, { headers: c.headers });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const c = cors(request.headers.get('origin'));
  if (!c.allowed) return Response.json({ ok: false }, { status: 403, headers: c.headers });
  try {
    const { clientId } = await params;
    const record = await getBlueprintRecord(clientId);
    if (!record) return Response.json({ ok: false, error: 'Blueprint not found.' }, { status: 404, headers: c.headers });
    const auth = await authorizeBlueprintRequest(request, record);
    if (!auth.ok) return Response.json({ ok: false, error: auth.error }, { status: auth.status, headers: c.headers });
    const body = await request.json();
    if (!body || typeof body.assumptions !== 'object') {
      return Response.json({ ok: false, error: 'Capacity assumptions are required.' }, { status: 400, headers: c.headers });
    }
    record.policy = recalculateCapacity(record.policy, body.assumptions);
    await saveBlueprintRecord(record);
    return Response.json({ ok: true, record: publicBlueprint(record) }, { headers: c.headers });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to update capacity.' }, { status: 400, headers: c.headers });
  }
}
