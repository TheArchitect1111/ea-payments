import { NextRequest, NextResponse } from 'next/server';
import { adminApiUnauthorized, guardAdminApi } from '@/lib/api/admin-route';
import { listMediaAssets, saveMediaAsset } from '@/lib/creative-studio/media-store';
import type { MediaAssetKind } from '@/lib/creative-studio/types';

export const dynamic = 'force-dynamic';

const KINDS: MediaAssetKind[] = ['image', 'logo', 'document', 'video'];

function positiveNumber(value: unknown): number | undefined {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

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
    width?: number;
    height?: number;
    fileSizeBytes?: number;
    altText?: string;
    rightsConfirmed?: boolean;
    rightsSource?: string;
    publiclyReachable?: boolean;
    tags?: string[];
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const url = body.url?.trim();
  if (!url || !url.startsWith('https://')) {
    return NextResponse.json(
      { ok: false, error: 'A public HTTPS media URL is required.' },
      { status: 400 },
    );
  }

  const kind = KINDS.includes(body.kind ?? 'image') ? (body.kind ?? 'image') : 'image';
  if (kind === 'image' && !body.altText?.trim()) {
    return NextResponse.json(
      { ok: false, error: 'Alternative text is required for images.' },
      { status: 400 },
    );
  }
  if (!body.rightsConfirmed || !body.rightsSource?.trim()) {
    return NextResponse.json(
      { ok: false, error: 'Confirm usage rights and record the media source or owner.' },
      { status: 400 },
    );
  }

  const asset = await saveMediaAsset({
    organizationId: body.organizationId,
    kind,
    label: body.label?.trim() || 'Untitled',
    url,
    mimeType: body.mimeType,
    width: positiveNumber(body.width),
    height: positiveNumber(body.height),
    fileSizeBytes: positiveNumber(body.fileSizeBytes),
    altText: body.altText,
    rightsConfirmed: true,
    rightsSource: body.rightsSource,
    publiclyReachable: body.publiclyReachable !== false,
    tags: body.tags,
  });

  return NextResponse.json({ ok: true, asset });
}
