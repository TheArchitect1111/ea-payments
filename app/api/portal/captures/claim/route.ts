import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApiCookie, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import {
  getCaptureByIdentifier,
  updateCapturePortalSlug,
} from '@/lib/capture-records';

export const dynamic = 'force-dynamic';

const GUEST_SLUG = 'demo-client';

/**
 * Claim guest (demo-client) captures into the signed-in portal slug.
 * Only reassigns IDs the client lists — never bulk-merge all demo-client rows.
 */
export async function POST(req: NextRequest) {
  const auth = await guardPortalApiCookie({ realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);

  const tenant = portalTenant(auth.session);
  if (tenant.portalSlug === GUEST_SLUG) {
    return NextResponse.json(
      { ok: false, error: 'Sign in with your portal account to keep guest captures.' },
      { status: 400 },
    );
  }

  let body: { captureIds?: string[] };
  try {
    body = (await req.json()) as { captureIds?: string[] };
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const ids = Array.isArray(body.captureIds)
    ? [...new Set(body.captureIds.map((id) => String(id).trim()).filter(Boolean))].slice(0, 20)
    : [];

  if (!ids.length) {
    return NextResponse.json({ ok: true, claimed: 0, skipped: 0 });
  }

  let claimed = 0;
  let skipped = 0;

  for (const id of ids) {
    const record = await getCaptureByIdentifier(id);
    if (!record) {
      skipped += 1;
      continue;
    }
    const current = (record.portalSlug ?? '').trim().toLowerCase();
    if (current && current !== GUEST_SLUG && current !== tenant.portalSlug) {
      skipped += 1;
      continue;
    }
    if (current === tenant.portalSlug) {
      claimed += 1;
      continue;
    }
    const updated = await updateCapturePortalSlug(record.id, tenant.portalSlug);
    if (updated.ok) claimed += 1;
    else skipped += 1;
  }

  return NextResponse.json({ ok: true, claimed, skipped });
}
