import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import { publishExperiencePage } from '@/lib/experience-builder/publish-page';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const { pageId } = await params;
  const auth = await guardPortalApi(req);
  if (!auth.ok) return portalApiUnauthorized(auth);

  const body = (await req.json()) as { slug?: string };
  if (!body.slug || body.slug !== auth.session.slug) {
    return NextResponse.json({ ok: false, error: 'Portal access denied.' }, { status: 403 });
  }

  const result = await publishExperiencePage({
    pageId,
    portalSlug: body.slug,
    actorName: auth.session.name ?? auth.session.email ?? 'Portal user',
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.detail }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    detail: result.detail,
    href: result.href,
    mode: result.mode,
    page: result.page,
  });
}
