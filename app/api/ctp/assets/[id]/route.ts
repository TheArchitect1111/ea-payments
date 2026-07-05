import { NextRequest, NextResponse } from 'next/server';
import { readCtpAssetBytes } from '@/lib/ctp-asset-store';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const assetId = decodeURIComponent(id).trim();
  if (!assetId) {
    return NextResponse.json({ ok: false, error: 'Asset ID required.' }, { status: 400 });
  }

  const loaded = await readCtpAssetBytes(assetId);
  if (!loaded) {
    return NextResponse.json({ ok: false, error: 'Asset not found.' }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(loaded.bytes), {
    status: 200,
    headers: {
      'Content-Type': loaded.meta.mimeType,
      'Content-Length': String(loaded.bytes.length),
      'Cache-Control': 'private, max-age=3600',
      'Content-Disposition': `inline; filename="${loaded.meta.fileName.replace(/"/g, '')}"`,
    },
  });
}
