import { NextResponse } from 'next/server';
import { listAmandaMediaAssets } from '@/lib/amanda-catherine/media-assets';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export async function GET() {
  try {
    const media = await listAmandaMediaAssets(false);
    return NextResponse.json({ ok: true, media }, {
      headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error('[amanda-media] public read failed', error);
    return NextResponse.json({ ok: false, media: [] }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
