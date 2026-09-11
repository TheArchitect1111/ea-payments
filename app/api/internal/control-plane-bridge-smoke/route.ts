import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BASE_ID = process.env.EA_CONTROL_PLANE_BASE_ID?.trim() || 'appWVdGzU54Puqld1';

/**
 * Preview-only proof that the deployed EA runtime credential can read the canonical
 * Asset Registry Control Plane. Production intentionally returns 404.
 */
export async function GET() {
  if (process.env.VERCEL_ENV === 'production') {
    return new NextResponse(null, { status: 404 });
  }

  const key = (process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT ?? '').trim();
  if (!key) {
    return NextResponse.json(
      { ok: false, configured: false, error: 'Airtable credential missing.' },
      { status: 503 },
    );
  }

  const tables = ['Universal Manifest', 'Release Governance', 'Production Acceptance', 'Governance Evidence'];
  const checks: Record<string, number> = {};

  for (const table of tables) {
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`);
    url.searchParams.set('maxRecords', '1');
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${key}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          configured: true,
          table,
          status: res.status,
          error: 'Control Plane credential cannot read a required table.',
        },
        { status: 503 },
      );
    }
    const data = (await res.json()) as { records?: unknown[] };
    checks[table] = data.records?.length ?? 0;
  }

  return NextResponse.json({
    ok: true,
    configured: true,
    base: 'EA Asset Registry',
    requiredTables: checks,
    enforcement: process.env.EA_CONTROL_PLANE_ENFORCE?.trim() || 'production-default',
  });
}
