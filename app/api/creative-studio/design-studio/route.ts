import { NextRequest, NextResponse } from 'next/server';
import { adminApiUnauthorized, guardAdminApi } from '@/lib/api/admin-route';
import {
  loadStudioRecordFromAirtable,
  saveStudioRecord,
} from '@/lib/creative-studio/persistence';

export const dynamic = 'force-dynamic';

const RECORD_ID = 'design-studio-production-records-v1';
const ALLOWED_ORIGINS = new Set([
  'https://cc.efficiencyarchitects.online',
  'https://www.efficiencyarchitects.online',
  'https://efficiency-architects.vercel.app',
]);

function corsHeaders(req: NextRequest): HeadersInit {
  const origin = req.headers.get('origin') ?? '';
  if (!ALLOWED_ORIGINS.has(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    Vary: 'Origin',
  };
}

function json(req: NextRequest, body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  Object.entries(corsHeaders(req)).forEach(([key, value]) => headers.set(key, String(value)));
  return NextResponse.json(body, { ...init, headers });
}

function organizationId(user: { orgId?: string }): string | null {
  const value = user.orgId?.trim() || process.env.EA_INTERNAL_ORG_ID?.trim() || '';
  return value || null;
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') ?? '';
  if (!ALLOWED_ORIGINS.has(origin)) return new NextResponse(null, { status: 403 });
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function GET(req: NextRequest) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) {
    const response = adminApiUnauthorized(auth);
    Object.entries(corsHeaders(req)).forEach(([key, value]) => response.headers.set(key, String(value)));
    return response;
  }

  const orgId = organizationId(auth.user);
  if (!orgId) return json(req, { ok: false, error: 'Admin organization identity is not configured.' }, { status: 503 });

  const stored = await loadStudioRecordFromAirtable<{ records?: unknown }>('experience', RECORD_ID);
  const records = Array.isArray(stored?.records) ? stored.records : [];
  return json(req, { ok: true, records, source: 'airtable', organizationId: orgId });
}

export async function PUT(req: NextRequest) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) {
    const response = adminApiUnauthorized(auth);
    Object.entries(corsHeaders(req)).forEach(([key, value]) => response.headers.set(key, String(value)));
    return response;
  }

  const orgId = organizationId(auth.user);
  if (!orgId) return json(req, { ok: false, error: 'Admin organization identity is not configured.' }, { status: 503 });

  let body: { records?: unknown };
  try {
    body = (await req.json()) as { records?: unknown };
  } catch {
    return json(req, { ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!Array.isArray(body.records)) {
    return json(req, { ok: false, error: 'records must be an array.' }, { status: 400 });
  }

  const result = await saveStudioRecord({
    recordType: 'experience',
    id: RECORD_ID,
    organizationId: orgId,
    title: 'EA Design Studio Production Records',
    payload: { records: body.records },
  });
  if (!result.persistedToAirtable) {
    return json(req, { ok: false, error: result.error || 'Durable Airtable save failed.' }, { status: 503 });
  }

  const verified = await loadStudioRecordFromAirtable<{ records?: unknown }>('experience', RECORD_ID);
  if (!Array.isArray(verified?.records)) {
    return json(req, { ok: false, error: 'Durable write verification failed.' }, { status: 503 });
  }
  return json(req, { ok: true, records: verified.records, source: 'airtable' });
}
