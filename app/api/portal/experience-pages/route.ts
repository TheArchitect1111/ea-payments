import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import { createExperiencePage, listExperiencePages } from '@/lib/experience-builder/page-store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') ?? undefined;
  if (!slug) {
    return NextResponse.json({ ok: false, error: 'slug required' }, { status: 400 });
  }

  const auth = await guardPortalApi(req, { slug });
  if (!auth.ok) return portalApiUnauthorized(auth);

  const pages = await listExperiencePages(slug);
  return NextResponse.json({ ok: true, pages });
}

export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req);
  if (!auth.ok) return portalApiUnauthorized(auth);

  const body = (await req.json()) as { slug?: string; title?: string };
  if (!body.slug) {
    return NextResponse.json({ ok: false, error: 'slug required' }, { status: 400 });
  }
  if (body.slug !== auth.session.slug) {
    return NextResponse.json({ ok: false, error: 'Portal access denied.' }, { status: 403 });
  }

  const page = await createExperiencePage(body.slug, body.title);
  return NextResponse.json({ ok: true, page });
}
