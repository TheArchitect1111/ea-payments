import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApiCookie, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import {
  createWatchListItem,
  listWatchListItems,
} from '@/lib/simplifi-watch-list-store';

export const dynamic = 'force-dynamic';

/** Workspace parity for Simplifi watch list (cookie auth). */
export async function GET() {
  const auth = await guardPortalApiCookie({ realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  const items = await listWatchListItems(tenant.portalSlug);
  return NextResponse.json({ ok: true, portalSlug: tenant.portalSlug, items });
}

export async function POST(req: NextRequest) {
  const auth = await guardPortalApiCookie({ realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    url?: string;
    category?: string;
    source?: string;
    notes?: string;
    kind?: 'item' | 'interest';
  };
  if (!body.title?.trim()) {
    return NextResponse.json({ ok: false, error: 'title is required.' }, { status: 400 });
  }
  try {
    const item = await createWatchListItem(tenant.portalSlug, tenant.organizationId, {
      title: body.title,
      url: body.url,
      category: body.category,
      source: body.source,
      notes: body.notes,
      kind: body.kind,
    });
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create watch item.';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
