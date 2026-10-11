import { NextResponse } from 'next/server';
import { listAmandaMediaAssets } from '@/lib/amanda-catherine/media-assets';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export async function GET() {
  // Public media is optional. A local/CI build without an Amanda registry
  // must not turn an otherwise healthy public page into an HTTP 503.
  // If credentials ARE configured, real provider errors still return 503.
  const configured = Boolean(
    (process.env.AIRTABLE_BASE_ID || process.env.AIRTABLE_PAYMENTS_BASE_ID) &&
    (process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN)
  );
  if (!configured) {
    console.warn('[amanda-media] optional media registry not configured; serving empty library');
    return NextResponse.json({ ok: true, media: [], available: false, reason: 'not_configured' }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }
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
