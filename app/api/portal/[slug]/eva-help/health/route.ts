import { NextResponse } from 'next/server';
import { health, knowledge } from '@/src/bricks/eva-portal-help/manifest-loader';
import { logStorageMode } from '@/src/bricks/eva-portal-help/logger';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const state = health(slug);
  if (!state.ok) return NextResponse.json({ ...state, portalId: slug }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  return NextResponse.json({ ...state, ...knowledge(slug), logging: logStorageMode() },
    { status: 200, headers: { 'Cache-Control': 'no-store' } });
}
