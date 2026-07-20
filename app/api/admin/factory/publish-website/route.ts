import { NextRequest, NextResponse } from 'next/server';
import { requireAdminActionFromRequest } from '@/lib/admin-session-guard';
import { publishFactoryWebsite } from '@/lib/factory-publish-website';

export const dynamic = 'force-dynamic';

/**
 * Admin: Publish Future Website from a Factory project (OIB brand → /sites/{slug}).
 * POST { projectId, portalSlug?, force? }
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: { projectId?: string; portalSlug?: string; force?: boolean };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const projectId = String(body.projectId || '').trim();
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required.' }, { status: 400 });
  }

  const result = await publishFactoryWebsite({
    projectId,
    portalSlug: body.portalSlug?.trim() || undefined,
    force: body.force !== false,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error || 'Publish failed.',
        gate: result.gate,
        portalSlug: result.portalSlug,
      },
      { status: result.gate && !result.gate.ok ? 400 : 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    portalSlug: result.portalSlug,
    pageId: result.pageId,
    siteUrl: result.siteUrl,
    previewPath: result.previewPath,
  });
}
