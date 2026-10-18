import { NextResponse } from 'next/server';
import { loadPortalKnowledgeLive } from '@/src/bricks/eva-portal-help/manifest-loader';
import { logStorageMode } from '@/src/bricks/eva-portal-help/logger';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const data = await loadPortalKnowledgeLive(slug);
    return NextResponse.json({ status: 200, ok: true, portalId: slug, entryCount: data.entries.length,
      lastRefreshTime: data.lastRefreshTime, logging: logStorageMode() },
      { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ status: 503, ok: false, portalId: slug,
      error: 'Portal help knowledge unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
