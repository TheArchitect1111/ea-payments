import { NextRequest, NextResponse } from 'next/server';
import { adminApiUnauthorized, guardAdminApi } from '@/lib/api/admin-route';
import { listMediaAssets, saveMediaAsset } from '@/lib/creative-studio/media-store';
import type { MediaAssetKind } from '@/lib/creative-studio/types';

export const dynamic = 'force-dynamic';

const KINDS: MediaAssetKind[] = ['image', 'logo', 'document', 'video'];

export async function GET(req: NextRequest) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return adminApiUnauthorized(auth);

  const organizationId = req.nextUrl.searchParams.get('organizationId') ?? undefined;
  const media = await listMediaAssets(organizationId);
  return NextResponse.json({ ok: true, media });
}

export async function POST(req: NextRequest) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return adminApiUnauthorized(auth);

  let body: {
    organizationId?: string;
    kind?: MediaAssetKind;
    label?: string;
    url?: string;
    mimeType?: string;
    tags?: string[];
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const url = body.url?.trim();
  if (!url) {
    return NextResponse.json({ ok: false, error: 'Media URL is required.' }, { status: 400 });
  }

  const kind = KINDS.includes(body.kind ?? 'image') ? (body.kind ?? 'image') : 'image';
  const asset = await saveMediaAsset({
    organizationId: body.organizationId,
    kind,
    label: body.label?.trim() || 'Untitled',
    url,
    mimeType: body.mimeType,
    tags: body.tags,
  });

  return NextResponse.json({ ok: true, asset });
}
