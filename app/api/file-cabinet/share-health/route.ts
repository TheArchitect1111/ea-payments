import { get, put } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pathname = `ea-file-cabinet/_health/share-layer-${Date.now()}.txt`;
    const expected = Buffer.from('EA File Cabinet share layer OK\n', 'utf8');

    const blob = await put(pathname, expected, {
      access: 'private',
      contentType: 'text/plain; charset=utf-8',
    });

    const result = await get(blob.pathname, { access: 'private', useCache: false });
    if (!result || result.statusCode !== 200) {
      throw new Error(`Private Blob read failed with status ${result?.statusCode ?? 'missing'}`);
    }

    const actual = Buffer.from(await new Response(result.stream).arrayBuffer());
    const exactMatch = actual.equals(expected);

    return Response.json({
      ok: exactMatch,
      backend: 'vercel-blob-private',
      pathname: blob.pathname,
      bytesWritten: expected.length,
      bytesRead: actual.length,
      exactMatch,
    }, { status: exactMatch ? 200 : 500 });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        backend: 'vercel-blob-private',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
