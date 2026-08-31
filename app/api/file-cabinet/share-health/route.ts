import { put } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pathname = `ea-file-cabinet/_health/share-layer-${Date.now()}.txt`;
    const blob = await put(pathname, Buffer.from('EA File Cabinet share layer OK\n', 'utf8'), {
      access: 'public',
      contentType: 'text/plain; charset=utf-8',
    });

    return Response.json({
      ok: true,
      backend: 'vercel-blob',
      url: blob.url,
      pathname: blob.pathname,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        backend: 'vercel-blob',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
