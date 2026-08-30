import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import {
  getAmandaSiteContent,
  saveAmandaSiteContent,
  type AmandaSiteContent,
} from '@/lib/amanda-catherine/site-content';

export const dynamic = 'force-dynamic';

function isAmandaSlug(slug?: string | null) {
  return Boolean(slug && slug.toLowerCase().startsWith('amanda-catherine'));
}

function persistedOrganizationId(value?: string) {
  if (!value || value.startsWith('org_')) return null;
  return value;
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  if (!isAmandaSlug(slug)) {
    return NextResponse.json({ ok: false, error: 'Amanda Catherine portal required.' }, { status: 400 });
  }
  const auth = await guardPortalApi(req, { slug: slug! });
  if (!auth.ok) return portalApiUnauthorized(auth);
  return NextResponse.json({ ok: true, content: await getAmandaSiteContent() });
}

export async function PUT(req: NextRequest) {
  const auth = await guardPortalApi(req);
  if (!auth.ok) return portalApiUnauthorized(auth);

  const body = (await req.json()) as { slug?: string; content?: AmandaSiteContent };
  if (!isAmandaSlug(body.slug) || body.slug !== auth.session.slug || !body.content) {
    return NextResponse.json({ ok: false, error: 'Portal access denied.' }, { status: 403 });
  }

  const organizationId = persistedOrganizationId(auth.session.orgId);
  if (!organizationId) {
    return NextResponse.json({ ok: false, error: 'Persisted organization required.' }, { status: 403 });
  }

  const result = await saveAmandaSiteContent(organizationId, body.content);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error ?? 'Website save failed.' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    persisted: result.persisted,
    content: result.content,
    publicPath: '/amanda-catherine',
  });
}
