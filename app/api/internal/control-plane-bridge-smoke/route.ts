import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BASE_ID = process.env.EA_CONTROL_PLANE_BASE_ID?.trim() || 'appWVdGzU54Puqld1';
const PROOF_NAME = 'Run 9 — Preview runtime Control Plane write proof';

function headers(key: string): Record<string, string> {
  return { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}

/**
 * Preview-only proof that the deployed EA runtime credential can read AND write the
 * canonical Asset Registry Control Plane. Production intentionally returns 404.
 * The write is deterministic and updates one legitimate Governance Evidence record.
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
      headers: headers(key),
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

  const evidenceBase = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent('Governance Evidence')}`;
  const lookup = new URL(evidenceBase);
  lookup.searchParams.set('filterByFormula', `{Evidence Record}='${PROOF_NAME}'`);
  lookup.searchParams.set('maxRecords', '1');
  const lookupRes = await fetch(lookup.toString(), { headers: headers(key), cache: 'no-store' });
  if (!lookupRes.ok) {
    return NextResponse.json(
      { ok: false, configured: true, status: lookupRes.status, error: 'Write-proof lookup failed.' },
      { status: 503 },
    );
  }
  const lookupData = (await lookupRes.json()) as { records?: Array<{ id: string }> };
  const existingId = lookupData.records?.[0]?.id;
  const fields = {
    'Evidence Record': PROOF_NAME,
    'Evidence Type': 'Audit Review',
    'System / Target': 'EA Control Plane Bridge',
    'Policy Decision': 'Preserve Pending Review',
    Owner: 'EA Operations',
    'Source Evidence': 'Run 9 preview runtime successfully read the required Control Plane tables and exercised an authenticated write using the same deployed Airtable credential.',
    Outcome: 'Verified',
    'Evidence Date': new Date().toISOString(),
    'Audit Notes': 'Deterministic preview-only credential proof. This record may be updated on later Run 9 proof attempts and does not authorize a production release.',
    'Run 7 Verified': true,
  };
  const writeRes = await fetch(existingId ? `${evidenceBase}/${existingId}` : evidenceBase, {
    method: existingId ? 'PATCH' : 'POST',
    headers: headers(key),
    body: existingId
      ? JSON.stringify({ fields, typecast: true })
      : JSON.stringify({ records: [{ fields }], typecast: true }),
  });
  if (!writeRes.ok) {
    return NextResponse.json(
      { ok: false, configured: true, status: writeRes.status, error: 'Control Plane credential can read but cannot write Governance Evidence.' },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    configured: true,
    readVerified: true,
    writeVerified: true,
    base: 'EA Asset Registry',
    requiredTables: checks,
    evidenceRecord: PROOF_NAME,
    enforcement: process.env.EA_CONTROL_PLANE_ENFORCE?.trim() || 'production-default',
  });
}
