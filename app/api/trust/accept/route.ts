import { NextRequest, NextResponse } from 'next/server';
import { requirePortalSessionFromRequest } from '@/lib/auth/resolve-portal-session';
import {
  acceptLegalDocuments,
  isValidTrustProductId,
} from '@/lib/trust-engine/accept-service';
import type { TrustLegalDocType, TrustProductId } from '@/lib/trust-engine/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/trust/accept
 * Authenticated acceptance — server resolves identity, versions, and timestamps.
 * Body: { docTypes: string[], productId?: string, isReacceptance?: boolean, next?: string }
 */
export async function POST(req: NextRequest) {
  const portalSession = await requirePortalSessionFromRequest(req, { realm: 'portal' });
  const simplifiSession =
    portalSession ?? (await requirePortalSessionFromRequest(req, { realm: 'simplifi' }));
  const session = simplifiSession;

  if (!session?.slug || !(session.email || session.sub)) {
    return NextResponse.json(
      { ok: false, error: 'Authentication required' },
      { status: 401 },
    );
  }

  let body: {
    docTypes?: string[];
    productId?: string;
    isReacceptance?: boolean;
    next?: string;
    /** @deprecated ignored — server resolves identity */
    clientId?: string;
    userId?: string;
    records?: unknown;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const productIdRaw =
    body.productId ||
    (session.realm === 'simplifi' ? 'simplifi' : 'portal_products');
  if (!isValidTrustProductId(productIdRaw)) {
    return NextResponse.json({ ok: false, error: 'Invalid product' }, { status: 400 });
  }
  const productId = productIdRaw as TrustProductId;

  const docTypes = (body.docTypes ?? []) as TrustLegalDocType[];
  if (!docTypes.length && Array.isArray(body.records)) {
    // Backward-compatible: extract docTypes only; ignore forged versions/userIds.
    for (const row of body.records as Array<{ docType?: string }>) {
      if (row?.docType) docTypes.push(row.docType as TrustLegalDocType);
    }
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    undefined;
  const userAgent = req.headers.get('user-agent') || undefined;

  const userId = session.sub || session.email || session.slug;
  const clientId = `portal_${session.slug}`;
  const organizationId = session.orgId || clientId;

  // Ignore any client-supplied identity or version fields (body.records versions discarded).
  const result = await acceptLegalDocuments({
    userId,
    clientId,
    organizationId,
    email: session.email,
    displayName: session.name || session.email,
    productId,
    docTypes,
    ipAddress: ip,
    userAgent,
    source: 'api.trust.accept',
    isReacceptance: Boolean(body.isReacceptance),
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    profile: result.profile,
    records: result.records,
    duplicatesSkipped: result.duplicatesSkipped,
    next: typeof body.next === 'string' ? body.next : undefined,
  });
}
