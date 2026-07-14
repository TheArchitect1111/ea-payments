import { NextResponse } from 'next/server';
import { CAPTURE_CORS_HEADERS, verifyCaptureApiKey, verifyCaptureTenantToken } from '@/lib/capture-auth';
import { requirePortalSession } from '@/lib/auth/resolve-portal-session';
import { getCaptureByIdentifier } from '@/lib/capture-records';
import { buildCaptureStatusResponse } from '@/lib/capture-response';

export const dynamic = 'force-dynamic';
const corsJson = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: CAPTURE_CORS_HEADERS });

export async function OPTIONS() {
  return new Response(null, { headers: CAPTURE_CORS_HEADERS });
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const headerKey = req.headers.get('x-ea-capture-key');
  const tokenSlug = verifyCaptureTenantToken(headerKey);
  const session = await requirePortalSession({ realm: 'simplifi' });
  if (!session && !tokenSlug && !verifyCaptureApiKey(headerKey)) {
    return corsJson({ ok: false, error: 'Unauthorized' }, 401);
  }

  const record = await getCaptureByIdentifier(id);
  if (!record) return corsJson({ ok: false, error: 'Capture not found.' }, 404);
  const scopedSlug = session?.slug ?? tokenSlug;
  if (scopedSlug && record.portalSlug !== scopedSlug) {
    return corsJson({ ok: false, error: 'Capture access denied.' }, 403);
  }
  return corsJson(buildCaptureStatusResponse(record));
}
