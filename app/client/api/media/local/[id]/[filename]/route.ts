import { NextRequest, NextResponse } from 'next/server';
import { readLocalMedia } from '../../../../../_lib/hq-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string; filename: string }> }) {
  const { id, filename } = await context.params;
  const kind = req.nextUrl.searchParams.get('kind') === 'video' ? 'video' : 'image';
  if (!/^[a-z0-9][a-z0-9-]{0,48}$/.test(id) || !/^[a-zA-Z0-9._-]+$/.test(filename)) {
    return NextResponse.json({ error: 'Media not found.' }, { status: 404 });
  }
  const bytes = await readLocalMedia(id, filename, kind);
  if (!bytes) return NextResponse.json({ error: 'Media not found.' }, { status: 404 });
  const type = kind === 'video' ? 'video/mp4' : filename.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
  return new NextResponse(bytes, { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable' } });
}
