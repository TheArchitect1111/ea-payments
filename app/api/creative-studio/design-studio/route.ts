import { NextRequest, NextResponse } from 'next/server';
import { adminApiUnauthorized, guardAdminApi } from '@/lib/api/admin-route';
import {
  loadStudioRecordFromAirtable,
  saveStudioRecord,
} from '@/lib/creative-studio/persistence';

export const dynamic = 'force-dynamic';

const RECORD_ID = 'design-studio-production-records-v1';
const ALLOWED_ORIGINS = new Set([
  'https://efficiencyarchitects.online',
  'https://www.efficiencyarchitects.online',
  'https://cc.efficiencyarchitects.online',
]);

function organizationIdFrom(userOrgId?: string): string {
  return userOrgId || process.env.EA_INTERNAL_ORG_ID || 'ea';
}

function recordIdFor(organizationId: string): string {
  return `${organizationId}:${RECORD_ID}`;
}

function corsHeaders(req: NextRequest): HeadersInit {
  const origin = req.headers.get('origin');
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function applyCors(req: NextRequest, response: NextResponse): NextResponse {
  const headers = corsHeaders(req);
  for (const [key, value] of Object.entries(headers)) response.headers.set(key, String(value));
  return response;
}

function json(req: NextRequest, body: unknown, init?: ResponseInit) {
  return applyCors(req, NextResponse.json(body, init));
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (!origin || !ALLOWED_ORIGINS.has(origin)) {
    return NextResponse.json({ ok: false, error: 'Origin not allowed.' }, { status: 403 });
  }
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function GET(req: NextRequest) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return applyCors(req, adminApiUnauthorized(auth));

  const organizationId = organizationIdFrom(auth.user.orgId);
  const recordId = recordIdFor(organizationId);
  const stored = await loadStudioRecordFromAirtable<{ records?: unknown }>('experience', recordId);
  const records = Array.isArray(stored?.records) ? stored.records : [];
  return json(req, { ok: true, records, organizationId });
}

export async function PUT(req: NextRequest) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return applyCors(req, adminApiUnauthorized(auth));

  let body: { records?: unknown };
  try {
    body = (await req.json()) as { records?: unknown };
  } catch {
    return json(req, { ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!Array.isArray(body.records)) {
    return json(req, { ok: false, error: 'records must be an array.' }, { status: 400 });
  }

  const organizationId = organizationIdFrom(auth.user.orgId);
  const recordId = recordIdFor(organizationId);
  const result = await saveStudioRecord({
    recordType: 'experience',
    id: recordId,
    organizationId,
    title: 'EA Design Studio Production Records',
    payload: { records: body.records },
  });

  if (!result.ok || !result.persistedToAirtable) {
    return json(
      req,
      { ok: false, error: result.error || 'Design Studio durable persistence unavailable.' },
      { status: 503 },
    );
  }

  const durable = await loadStudioRecordFromAirtable<{ records?: unknown }>('experience', recordId);
  const records = Array.isArray(durable?.records) ? durable.records : [];
  return json(req, { ok: true, records, organizationId });
}
