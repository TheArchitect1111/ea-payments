import { NextRequest, NextResponse } from 'next/server';
import { guardAdminApi, adminApiUnauthorized } from '@/lib/api/admin-route';
import { publishLegalVersion } from '@/lib/trust-engine/governance';
import type { TrustLegalDocType } from '@/lib/trust-engine/types';

export const dynamic = 'force-dynamic';

/** POST /api/admin/legal/publish-version */
export async function POST(req: NextRequest) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return adminApiUnauthorized(auth);

  let body: {
    docType?: TrustLegalDocType;
    version?: string;
    effectiveDate?: string;
    sourcePath?: string;
    notes?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.docType || !body.version || !body.effectiveDate) {
    return NextResponse.json(
      { ok: false, error: 'docType, version, and effectiveDate are required' },
      { status: 400 },
    );
  }

  const result = await publishLegalVersion({
    docType: body.docType,
    version: body.version,
    effectiveDate: body.effectiveDate,
    sourcePath: body.sourcePath,
    notes: body.notes,
    actorUserId: auth.user?.email ?? 'admin',
  });

  return NextResponse.json({ ok: true, ...result });
}
