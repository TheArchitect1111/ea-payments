import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BASE_ID = process.env.EA_CONTROL_PLANE_BASE_ID?.trim() || 'appv0YoLIMY45fmDA';
const PROOF_NAME = 'Run 9 — Preview runtime Control Plane write proof';
function headers(key: string): Record<string, string> { return { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }; }
type Candidate = { name: string; key: string };
function credentialCandidates(): Candidate[] {
  const candidates: Candidate[] = [
    { name: 'EA_CONTROL_PLANE_AIRTABLE_PAT', key: process.env.EA_CONTROL_PLANE_AIRTABLE_PAT?.trim() || '' },
    { name: 'AIRTABLE_PAT', key: process.env.AIRTABLE_PAT?.trim() || '' },
    { name: 'AIRTABLE_API_KEY', key: process.env.AIRTABLE_API_KEY?.trim() || '' },
    { name: 'AIRTABLE_ACCESS_TOKEN', key: process.env.AIRTABLE_ACCESS_TOKEN?.trim() || '' },
    { name: 'AIRTABLE_TOKEN', key: process.env.AIRTABLE_TOKEN?.trim() || '' },
  ];
  const seen = new Set<string>();
  return candidates.filter((candidate) => { if (!candidate.key || seen.has(candidate.key)) return false; seen.add(candidate.key); return true; });
}
async function selectReadableCredential(candidates: Candidate[]) {
  const diagnostics: Array<{ name: string; status: number }> = [];
  const probe = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent('Universal Manifest')}`); probe.searchParams.set('maxRecords', '1');
  for (const candidate of candidates) {
    const res = await fetch(probe.toString(), { headers: headers(candidate.key), cache: 'no-store' }); diagnostics.push({ name: candidate.name, status: res.status });
    if (res.ok) return { candidate, diagnostics };
  }
  return { candidate: undefined, diagnostics };
}
export async function GET() {
  if (process.env.VERCEL_ENV === 'production') return new NextResponse(null, { status: 404 });
  const candidates = credentialCandidates();
  if (!candidates.length) return NextResponse.json({ ok: false, configured: false, error: 'Airtable credential missing.' }, { status: 503 });
  const selection = await selectReadableCredential(candidates); const selected = selection.candidate;
  if (!selected) return NextResponse.json({ ok: false, configured: true, credentialDiagnostics: selection.diagnostics, error: 'No deployed Airtable credential can read the EA operational Control Plane.' }, { status: 503 });
  const tables = ['Universal Manifest', 'Release Governance', 'Production Acceptance', 'Governance Evidence']; const checks: Record<string, number> = {};
  for (const table of tables) {
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`); url.searchParams.set('maxRecords', '1');
    const res = await fetch(url.toString(), { headers: headers(selected.key), cache: 'no-store' });
    if (!res.ok) return NextResponse.json({ ok: false, configured: true, selectedCredential: selected.name, credentialDiagnostics: selection.diagnostics, table, status: res.status, error: 'Selected Control Plane credential cannot read a required table.' }, { status: 503 });
    checks[table] = ((await res.json()) as { records?: unknown[] }).records?.length ?? 0;
  }
  const evidenceBase = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent('Governance Evidence')}`;
  const lookup = new URL(evidenceBase); lookup.searchParams.set('filterByFormula', `{Evidence Record}='${PROOF_NAME}'`); lookup.searchParams.set('maxRecords', '1');
  const lookupRes = await fetch(lookup.toString(), { headers: headers(selected.key), cache: 'no-store' });
  if (!lookupRes.ok) return NextResponse.json({ ok: false, configured: true, selectedCredential: selected.name, status: lookupRes.status, error: 'Write-proof lookup failed.' }, { status: 503 });
  const existingId = ((await lookupRes.json()) as { records?: Array<{ id: string }> }).records?.[0]?.id;
  const fields = { 'Evidence Record': PROOF_NAME, 'Evidence Type': 'Audit Review', 'System / Target': 'EA Control Plane Bridge', 'Policy Decision': 'Preserve Pending Review', Owner: 'EA Operations', 'Source Evidence': `Run 9 preview runtime successfully read the required operational Control Plane tables and exercised an authenticated write using ${selected.name}.`, Outcome: 'Verified', 'Evidence Date': new Date().toISOString(), 'Audit Notes': 'Deterministic preview-only credential proof. Original Asset Registry remains preserved as recovery history.', 'Run 7 Verified': true };
  const writeRes = await fetch(existingId ? `${evidenceBase}/${existingId}` : evidenceBase, { method: existingId ? 'PATCH' : 'POST', headers: headers(selected.key), body: existingId ? JSON.stringify({ fields, typecast: true }) : JSON.stringify({ records: [{ fields }], typecast: true }) });
  if (!writeRes.ok) return NextResponse.json({ ok: false, configured: true, selectedCredential: selected.name, status: writeRes.status, error: 'Control Plane credential can read but cannot write Governance Evidence.' }, { status: 503 });
  return NextResponse.json({ ok: true, configured: true, readVerified: true, writeVerified: true, selectedCredential: selected.name, credentialDiagnostics: selection.diagnostics, base: 'EA Operational Control Plane', requiredTables: checks, evidenceRecord: PROOF_NAME, enforcement: process.env.EA_CONTROL_PLANE_ENFORCE?.trim() || 'production-default' });
}
