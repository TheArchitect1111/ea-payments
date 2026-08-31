import { get } from '@vercel/blob';
import { getFileCabinetShare } from '@/lib/file-cabinet-share-registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type StoredShareRecord = {
  shareId: string;
  filename: string;
  contentType: string;
  blobPath: string;
  enabled: boolean;
};

async function getStoredShareRecord(shareId: string): Promise<StoredShareRecord | null> {
  const metadata = await get(`ea-file-cabinet/_shares/${shareId}.json`, {
    access: 'private',
    useCache: true,
  });
  if (!metadata || metadata.statusCode !== 200) return null;

  try {
    const text = await new Response(metadata.stream).text();
    const record = JSON.parse(text) as StoredShareRecord;
    if (!record.enabled || record.shareId !== shareId || !record.blobPath) return null;
    return record;
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ shareId: string }> },
) {
  const { shareId } = await context.params;
  const stored = await getStoredShareRecord(shareId);
  const fallback = stored ? null : getFileCabinetShare(shareId);

  const pathname = stored?.blobPath ?? fallback?.pathname;
  const contentType = stored?.contentType ?? fallback?.contentType;
  const filename = stored?.filename ?? fallback?.filename;

  if (!pathname || !filename) {
    return new Response('Share link not found', { status: 404 });
  }

  const range = request.headers.get('range');
  const result = await get(pathname, {
    access: 'private',
    useCache: true,
    headers: range ? { range } : undefined,
  });

  if (!result || (result.statusCode !== 200 && result.statusCode !== 206)) {
    return new Response('File not found', { status: 404 });
  }

  const headers = new Headers();
  headers.set('Content-Type', contentType || result.blob.contentType || 'application/octet-stream');
  headers.set('Content-Disposition', `inline; filename="${filename.replace(/"/g, '')}"`);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Cache-Control', 'public, max-age=300');
  headers.set('ETag', result.blob.etag);
  headers.set('Accept-Ranges', 'bytes');
  if (!range && result.blob.size) {
    headers.set('Content-Length', String(result.blob.size));
  }

  return new Response(result.stream, {
    status: result.statusCode,
    headers,
  });
}
