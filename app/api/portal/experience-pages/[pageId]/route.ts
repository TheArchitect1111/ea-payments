import { NextRequest, NextResponse } from 'next/server';
import type { Data } from '@measured/puck';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import { getExperiencePage, saveExperiencePage } from '@/lib/experience-builder/page-store';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const { pageId } = await params;
  const slug = req.nextUrl.searchParams.get('slug') ?? undefined;
  const auth = await guardPortalApi(req, { slug });
  if (!auth.ok) return portalApiUnauthorized(auth);

  const page = await getExperiencePage(pageId);
  if (!page) {
    return NextResponse.json({ ok: false, error: 'Page not found.' }, { status: 404 });
  }
  if (page.portalSlug !== auth.session.slug) {
    return NextResponse.json({ ok: false, error: 'Portal access denied.' }, { status: 403 });
  }

  return NextResponse.json({ ok: true, page });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const { pageId } = await params;
  const auth = await guardPortalApi(req);
  if (!auth.ok) return portalApiUnauthorized(auth);

  const body = (await req.json()) as {
    slug?: string;
    title?: string;
    puckData?: Data;
  };

  if (!body.slug || body.slug !== auth.session.slug) {
    return NextResponse.json({ ok: false, error: 'Portal access denied.' }, { status: 403 });
  }

  const existing = await getExperiencePage(pageId);
  if (!existing) {
    return NextResponse.json({ ok: false, error: 'Page not found.' }, { status: 404 });
  }
  if (existing.portalSlug !== body.slug) {
    return NextResponse.json({ ok: false, error: 'Portal access denied.' }, { status: 403 });
  }

  const saved = await saveExperiencePage({
    ...existing,
    title: body.title?.trim() || existing.title,
    puckData: body.puckData ?? existing.puckData,
    status: existing.status,
  });

  return NextResponse.json({ ok: true, page: saved });
}
