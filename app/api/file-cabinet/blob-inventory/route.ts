import { list } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const matches: Array<{ pathname: string; size: number; contentType?: string; url: string }> = [];
    let cursor: string | undefined;

    do {
      const page = await list({ cursor, limit: 1000 });
      for (const blob of page.blobs) {
        if (/tarris|bouie|client.services.agreement|contract/i.test(blob.pathname)) {
          matches.push({
            pathname: blob.pathname,
            size: blob.size,
            contentType: blob.contentType,
            url: blob.url,
          });
        }
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);

    return Response.json({ ok: true, matches });
  } catch (error) {
    return Response.json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
