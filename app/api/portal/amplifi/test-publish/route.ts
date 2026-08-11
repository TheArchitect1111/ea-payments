import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { publishToAmplifi } from '@/lib/amplifi-publish';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);

  const tenant = portalTenant(auth.session);
  const body = (await req.json().catch(() => ({}))) as { title?: string };
  const title = body.title?.trim() || 'Amplifi connection test';

  const result = await publishToAmplifi({
    slug: tenant.portalSlug,
    title,
    message: 'AMPLIFI DRY RUN — verify the publishing connection only. Do not publish this message.',
    caption: 'AMPLIFI DRY RUN — no social post should be created.',
    actorName: 'Amplifi connection test',
    idempotencyKey: `amplifi:dry-run:${tenant.organizationId}:${Date.now()}`,
    dryRun: true,
  });

  return NextResponse.json(
    {
      ok: result.ok,
      status: result.status,
      mode: result.mode,
      error: result.ok ? undefined : result.detail,
    },
    { status: result.ok ? 200 : 502 },
  );
}
