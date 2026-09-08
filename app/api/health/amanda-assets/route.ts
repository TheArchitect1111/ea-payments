import { list } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const matches: string[] = [];
  let cursor: string | undefined;
  do {
    const result = await list({ limit: 1000, cursor });
    for (const blob of result.blobs) {
      const p = blob.pathname;
      if (/amanda|aestheti|body.?sculpt|nervous|reset|wood|therapy|entrepreneur|firm.?foundation|\.mp4$|\.pdf$|\.docx$/i.test(p)) matches.push(p);
    }
    cursor = result.cursor;
  } while (cursor);
  return NextResponse.json({ count: matches.length, pathnames: [...new Set(matches)].sort() });
}
