import { NextRequest, NextResponse } from 'next/server';
import {
  EXTENSION_API_CORS_HEADERS,
  assertExtensionTenant,
  resolveExtensionAccess,
} from '@/lib/extension-api-auth';
import {
  archiveWatchListItem,
  updateWatchListItem,
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await resolveExtensionAccess(req);
  if (!access) {
    return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    url?: string;
    category?: string;
    source?: string;
    notes?: string;
    status?: 'watching' | 'paused' | 'archived';
    portalSlug?: string;
    lastCheckedAt?: string;
  };
  const portalSlug = assertExtensionTenant(access, body.portalSlug);
  if (!portalSlug) {
    return json({ ok: false, error: 'Extension tenant mismatch.' }, { status: 403 });
  }

  const item = await updateWatchListItem(portalSlug, id, body);
  if (!item) {
    return json({ ok: false, error: 'Watch item not found.' }, { status: 404 });
  }
  return json({ ok: true, item });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await resolveExtensionAccess(req);
  if (!access) {
    return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const requestedSlug =
    req.headers.get('x-ea-portal-slug') || req.nextUrl.searchParams.get('portalSlug');
  const portalSlug = assertExtensionTenant(access, requestedSlug);
  if (!portalSlug) {
    return json({ ok: false, error: 'Extension tenant mismatch.' }, { status: 403 });
  }

  const ok = await archiveWatchListItem(portalSlug, id);
  if (!ok) {
    return json({ ok: false, error: 'Watch item not found.' }, { status: 404 });
  }
  return json({ ok: true });
}
