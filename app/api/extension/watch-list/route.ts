import { NextRequest, NextResponse } from 'next/server';
import {
  EXTENSION_API_CORS_HEADERS,
  assertExtensionTenant,
  resolveExtensionAccess,
} from '@/lib/extension-api-auth';
import {
  createWatchListItem,
  listWatchListItems,
} from '@/lib/simplifi-watch-list-store';

export const dynamic = 'force-dynamic';

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...EXTENSION_API_CORS_HEADERS,
      ...(init?.headers ?? {}),
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: EXTENSION_API_CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const access = await resolveExtensionAccess(req);
  if (!access) {
    return json({ ok: false, error: 'Connect Simplifi before loading the watch list.' }, { status: 401 });
  }
  const requestedSlug =
    req.headers.get('x-ea-portal-slug') || req.nextUrl.searchParams.get('portalSlug');
  const portalSlug = assertExtensionTenant(access, requestedSlug);
  if (!portalSlug) {
    return json({ ok: false, error: 'Extension tenant mismatch.' }, { status: 403 });
  }

  const kindParam = req.nextUrl.searchParams.get('kind');
  const kind = kindParam === 'interest' || kindParam === 'item' ? kindParam : undefined;
  const items = await listWatchListItems(portalSlug, { kind });
  return json({ ok: true, portalSlug, items });
}

export async function POST(req: NextRequest) {
  const access = await resolveExtensionAccess(req);
  if (!access) {
    return json({ ok: false, error: 'Connect Simplifi before adding watch items.' }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    url?: string;
    category?: string;
    source?: string;
    notes?: string;
    kind?: 'item' | 'interest';
    portalSlug?: string;
  };
  const portalSlug = assertExtensionTenant(access, body.portalSlug);
  if (!portalSlug) {
    return json({ ok: false, error: 'Extension tenant mismatch.' }, { status: 403 });
  }
  if (!body.title?.trim()) {
    return json({ ok: false, error: 'title is required.' }, { status: 400 });
  }

  const orgId =
    access.kind === 'extension'
      ? access.session.orgId
      : access.kind === 'portal'
        ? access.session.orgId
        : undefined;

  try {
    const item = await createWatchListItem(portalSlug, orgId, {
      title: body.title,
      url: body.url,
      category: body.category,
      source: body.source,
      notes: body.notes,
      kind: body.kind,
    });
    return json({ ok: true, item });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create watch item.';
    return json({ ok: false, error: message }, { status: 400 });
  }
}
