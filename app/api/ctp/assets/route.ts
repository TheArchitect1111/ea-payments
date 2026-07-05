import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/ai/rate-limit';
import { CTP_ASSET_MAX_BYTES, isAllowedCtpAssetMime, storeCtpAsset } from '@/lib/ctp-asset-store';

export const dynamic = 'force-dynamic';

const WINDOW_MS = 60 * 60 * 1000;
const MAX_UPLOADS = 30;

function clientKey(req: NextRequest, draftToken: string): string {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return `${forwarded ?? 'local'}:${draftToken}`;
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid multipart form.' }, { status: 400 });
  }

  const draftToken = String(form.get('draftToken') ?? '').trim();
  const assetType = String(form.get('assetType') ?? '').trim();
  const file = form.get('file');

  if (!draftToken || draftToken.length < 8) {
    return NextResponse.json({ ok: false, error: 'Draft token required.' }, { status: 400 });
  }
  if (!assetType) {
    return NextResponse.json({ ok: false, error: 'Asset type required.' }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'File required.' }, { status: 400 });
  }

  const limit = checkRateLimit(clientKey(req, draftToken), MAX_UPLOADS, WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json({ ok: false, error: 'Upload rate limit reached. Try again later.' }, { status: 429 });
  }

  if (file.size > CTP_ASSET_MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: `File exceeds ${Math.round(CTP_ASSET_MAX_BYTES / (1024 * 1024))}MB limit.` },
      { status: 413 },
    );
  }

  const mimeType = file.type || 'application/octet-stream';
  if (!isAllowedCtpAssetMime(mimeType)) {
    return NextResponse.json({ ok: false, error: 'File type is not allowed.' }, { status: 415 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  try {
    const asset = await storeCtpAsset({
      draftToken,
      assetType,
      fileName: file.name || `${assetType}-upload`,
      mimeType,
      bytes,
    });
    return NextResponse.json({ ok: true, asset });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Upload failed.' },
      { status: 500 },
    );
  }
}
