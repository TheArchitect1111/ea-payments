import { get } from '@vercel/blob';
import { getFileCabinetShare } from '@/lib/file-cabinet-share-registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ shareId: string }> },
) {
  const { shareId } = await context.params;
  const record = getFileCabinetShare(shareId);

  if (!record) {
    return new Response('Share link not found', { status: 404 });
  }

  const range = request.headers.get('range');
  const result = await get(record.pathname, {
    access: 'private',
    useCache: true,
    headers: range ? { range } : undefined,
  });

  if (!result || (result.statusCode !== 200 && result.statusCode !== 206)) {
    return new Response('File not found', { status: 404 });
  }

  const headers = new Headers();
  headers.set('Content-Type', record.contentType || result.blob.contentType || 'application/octet-stream');
  headers.set('Content-Disposition', `inline; filename="${record.filename.replace(/"/g, '')}"`);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Cache-Control', 'public, max-age=300');
  headers.set('ETag', result.blob.etag);
  if (!range && result.blob.size) {
    headers.set('Content-Length', String(result.blob.size));
  }

  return new Response(result.stream, {
    status: result.statusCode,
    headers,
  });
}
