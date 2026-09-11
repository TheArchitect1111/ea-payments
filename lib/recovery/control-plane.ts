import type { RecoveryAuthority, RecoveryOutcome } from './types';

const CONTROL_PLANE_BASE_ID = process.env.EA_CONTROL_PLANE_BASE_ID?.trim() || 'appv0YoLIMY45fmDA';
const AIRTABLE_URL = 'https://api.airtable.com/v0';
type CpRecord = { id: string; fields: Record<string, unknown> };

function apiKey() {
  return (process.env.EA_CONTROL_PLANE_AIRTABLE_PAT ?? process.env.AIRTABLE_PAT ?? process.env.AIRTABLE_API_KEY ?? '').trim();
}
function headers() {
  const key = apiKey();
  if (!key) throw new Error('Airtable credential not configured for Recovery Orchestrator.');
  return { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}
function escapeFormula(value: string) { return value.replace(/'/g, "\\'"); }
function text(record: CpRecord | null, field: string) {
  const value = record?.fields[field];
  return typeof value === 'string' ? value.trim() : undefined;
}
async function request(url: string, init: RequestInit) {
  let last: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const res = await fetch(url, init); last = res;
    if (res.status !== 429 && res.status < 500) return res;
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
  }
  if (!last) throw new Error('Recovery Control Plane request did not execute.');
  return last;
}
async function findByPrimary(table: string, field: string, value: string): Promise<CpRecord | null> {
  const url = new URL(`${AIRTABLE_URL}/${CONTROL_PLANE_BASE_ID}/${encodeURIComponent(table)}`);
  url.searchParams.set('filterByFormula', `{${field}}='${escapeFormula(value)}'`);
  url.searchParams.set('maxRecords', '1');
  const res = await request(url.toString(), { headers: headers(), cache: 'no-store' });
  if (!res.ok) throw new Error(`Recovery lookup ${table} failed (${res.status}): ${await res.text()}`);
  return ((await res.json()) as { records?: CpRecord[] }).records?.[0] ?? null;
}
async function writeEvidence(fields: Record<string, unknown>) {
  const url = `${AIRTABLE_URL}/${CONTROL_PLANE_BASE_ID}/${encodeURIComponent('Governance Evidence')}`;
  const res = await request(url, { method: 'POST', headers: headers(), body: JSON.stringify({ records: [{ fields }], typecast: true }) });
  if (!res.ok) throw new Error(`Recovery evidence write failed (${res.status}): ${await res.text()}`);
}

export function recoveryControlPlaneConfigured() { return Boolean(apiKey()); }

export async function loadRecoveryAuthority(target: string): Promise<RecoveryAuthority | null> {
  if (!apiKey()) return null;
  const [manifest, governance] = await Promise.all([
    findByPrimary('Universal Manifest', 'Manifest Name', target),
    findByPrimary('Release Governance', 'System / Release Target', target),
  ]);
  if (!manifest && !governance) return null;
  return {
    target,
    manifestRecordId: manifest?.id,
    governanceRecordId: governance?.id,
    productionUrl: text(manifest, 'Production URL'),
    portalUrl: text(manifest, 'Portal URL'),
    githubRepo: text(manifest, 'GitHub Repo'),
    infrastructureState: text(manifest, 'Infrastructure State'),
    approvalState: text(manifest, 'Approval State'),
    changeAuthorization: text(governance, 'Change Authorization'),
    approvedBaseline: text(governance, 'Approved Baseline'),
    rollbackTarget: text(governance, 'Rollback Target'),
    clientIsolation: text(governance, 'Client Isolation'),
    monitoringGate: text(governance, 'Monitoring Gate'),
    releaseReadiness: text(governance, 'Release Readiness'),
    automationPermission: text(governance, 'Automation Permission'),
  };
}

export async function recordRecoveryEvidence(outcome: RecoveryOutcome): Promise<boolean> {
  if (!apiKey()) return false;
  try {
    const primary = `Recovery ${outcome.runId}`;
    const rollbackLine = outcome.rollback ? `Rollback: ${outcome.rollback.detail}` : 'Rollback: not required';
    const rollbackVerificationLine = outcome.rollbackVerification ? `Rollback verification: ${outcome.rollbackVerification.detail}` : 'Rollback verification: not required';
    await writeEvidence({
      'Evidence Record': primary,
      'Evidence Type': outcome.rollback?.attempted ? 'Rollback' : outcome.decision.disposition === 'auto_repair' ? 'Fallback' : 'Owner Handoff',
      'System / Target': outcome.signal.target,
      'Policy Decision': outcome.rollback?.attempted ? 'Rollback' : outcome.decision.disposition === 'auto_repair' ? 'Allow' : 'Escalate',
      'Owner': 'EA Operations',
      'Source Evidence': [
        `Failure class: ${outcome.signal.failureClass}`,
        `Source: ${outcome.signal.source}`,
        `Summary: ${outcome.signal.summary}`,
        `Mode: ${outcome.mode}`,
        `Decision: ${outcome.decision.disposition}`,
        `Action: ${outcome.decision.action ?? 'none'}`,
        `Execution: ${outcome.execution.detail}`,
        `Repair verification: ${outcome.repairVerification?.detail ?? outcome.verification.detail}`,
        rollbackLine,
        rollbackVerificationLine,
        `Final verification: ${outcome.verification.detail}`,
      ].join('\n'),
      'Outcome': outcome.verification.ok && outcome.decision.disposition === 'auto_repair' ? 'Verified' : 'Conditional',
      'Evidence Date': outcome.completedAt,
      'Audit Notes': `Recovery Orchestrator certified loop. ${outcome.decision.reasons.join(' | ')}`,
      'Run 7 Verified': true,
    });
    return true;
  } catch (error) {
    console.error('[recovery-orchestrator] evidence write failed', error);
    return false;
  }
}
