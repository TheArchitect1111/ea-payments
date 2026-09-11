import type { FactoryProject } from '@/lib/factory-project-store';
import type { CtpSubmission } from '@/lib/ctp-submissions';

// Run 9 operational Control Plane lives beside the runtime data the deployed Airtable
// credential already owns. The original EA Asset Registry remains preserved as recovery history.
const CONTROL_PLANE_BASE_ID = process.env.EA_CONTROL_PLANE_BASE_ID?.trim() || 'appv0YoLIMY45fmDA';
const AIRTABLE_URL = 'https://api.airtable.com/v0';
const SHARED_REPO = 'TheArchitect1111/ea-payments';
const SHARED_BRANCH = 'master';

export type ControlPlaneBridgeResult = { ok: boolean; error?: string; manifestRecordId?: string; governanceRecordId?: string; acceptanceRecordId?: string };
export type ControlPlaneReleaseState = { ok: boolean; ready: boolean; error?: string; reasons: string[]; manifestRecordId?: string; governanceRecordId?: string };
type CpRecord = { id: string; fields: Record<string, unknown> };
type BridgePhase = 'factory-created' | 'factory-wired' | 'ctp-created' | 'ctp-workspace-active' | 'ctp-production-ready';
type BridgeInput = { name: string; phase: BridgePhase; sourceId: string; sourceKind: 'Factory' | 'CTP'; productionUrl?: string; portalUrl?: string; evidence?: string };

function apiKey() { return (process.env.EA_CONTROL_PLANE_AIRTABLE_PAT ?? process.env.AIRTABLE_PAT ?? process.env.AIRTABLE_API_KEY ?? '').trim(); }
function enforced() {
  const value = process.env.EA_CONTROL_PLANE_ENFORCE?.trim().toLowerCase();
  if (['0','false','off'].includes(value || '')) return false;
  if (['1','true','on'].includes(value || '')) return true;
  return process.env.VERCEL_ENV === 'production';
}
function headers() {
  const key = apiKey();
  if (!key) throw new Error('Airtable credential not configured for Control Plane bridge.');
  return { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}
function escapeFormula(value: string) { return value.replace(/'/g, "\\'"); }
async function request(url: string, init: RequestInit) {
  let last: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const res = await fetch(url, init); last = res;
    if (res.status !== 429 && res.status < 500) return res;
    if (attempt < 2) {
      const retry = Number(res.headers.get('retry-after'));
      const wait = Number.isFinite(retry) && retry > 0 ? Math.min(retry * 1000, 5000) : Math.min(250 * 2 ** attempt, 1500);
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
  if (!last) throw new Error('Control Plane Airtable request did not execute.');
  return last;
}
async function findByPrimary(table: string, field: string, value: string): Promise<CpRecord | null> {
  const url = new URL(`${AIRTABLE_URL}/${CONTROL_PLANE_BASE_ID}/${encodeURIComponent(table)}`);
  url.searchParams.set('filterByFormula', `{${field}}='${escapeFormula(value)}'`); url.searchParams.set('maxRecords', '1');
  const res = await request(url.toString(), { headers: headers(), cache: 'no-store' });
  if (!res.ok) throw new Error(`Control Plane lookup ${table} failed (${res.status}): ${await res.text()}`);
  return ((await res.json()) as { records?: CpRecord[] }).records?.[0] ?? null;
}
async function writeRecord(table: string, recordId: string | null, fields: Record<string, unknown>): Promise<CpRecord> {
  const base = `${AIRTABLE_URL}/${CONTROL_PLANE_BASE_ID}/${encodeURIComponent(table)}`;
  const res = await request(recordId ? `${base}/${recordId}` : base, {
    method: recordId ? 'PATCH' : 'POST', headers: headers(),
    body: recordId ? JSON.stringify({ fields, typecast: true }) : JSON.stringify({ records: [{ fields }], typecast: true }),
  });
  if (!res.ok) throw new Error(`Control Plane write ${table} failed (${res.status}): ${await res.text()}`);
  if (recordId) return (await res.json()) as CpRecord;
  const created = ((await res.json()) as { records?: CpRecord[] }).records?.[0];
  if (!created) throw new Error(`Control Plane write ${table} returned no record.`);
  return created;
}
function appendEvidence(existing: unknown, addition: string) {
  const current = typeof existing === 'string' ? existing.trim() : '';
  if (!current) return addition; if (current.includes(addition)) return current; return `${current}\n\n${addition}`;
}
function fieldText(record: CpRecord | null, field: string) { const raw = record?.fields[field]; return typeof raw === 'string' ? raw.trim() : ''; }

async function upsertManifest(input: BridgeInput) {
  const existing = await findByPrimary('Universal Manifest', 'Manifest Name', input.name);
  const marker = `Run 9 bridge · ${input.sourceKind} ${input.sourceId} · ${input.phase}`;
  if (!existing) return writeRecord('Universal Manifest', null, {
    'Manifest Name': input.name, 'Entity Type': 'Client', 'GitHub Repo': SHARED_REPO, 'Deployment Target': 'Shared Vercel: ea-payments',
    'Approval State': 'No Approved Asset Recorded', 'Infrastructure State': 'Partially Resolved',
    ...(input.productionUrl ? { 'Production URL': input.productionUrl } : {}), ...(input.portalUrl ? { 'Portal URL': input.portalUrl } : {}),
    'Recovery / Legacy Notes': marker,
  });
  const fields: Record<string, unknown> = { 'Recovery / Legacy Notes': appendEvidence(existing.fields['Recovery / Legacy Notes'], marker) };
  if (!existing.fields['Production URL'] && input.productionUrl) fields['Production URL'] = input.productionUrl;
  if (!existing.fields['Portal URL'] && input.portalUrl) fields['Portal URL'] = input.portalUrl;
  return writeRecord('Universal Manifest', existing.id, fields);
}
async function upsertGovernance(input: BridgeInput) {
  const existing = await findByPrimary('Release Governance', 'System / Release Target', input.name);
  const note = `Run 9 bridge registered ${input.sourceKind} ${input.sourceId} at ${input.phase}. Production remains fail-closed until approved baseline, rollback, monitoring and verification gates resolve.`;
  if (existing) return writeRecord('Release Governance', existing.id, { 'Recovery Notes': appendEvidence(existing.fields['Recovery Notes'], note) });
  return writeRecord('Release Governance', null, {
    'System / Release Target': input.name, 'Release Repo': SHARED_REPO, 'Release Branch': SHARED_BRANCH, 'Change Authorization': 'Required',
    'Approved Baseline': 'Needs Reconciliation', 'Rollback Target': 'Needs Mapping', 'Client Isolation': 'Shared Platform', 'CI / Build Gate': 'Required',
    'Monitoring Gate': 'Code Wired / Account Setup Needed', 'Automation Permission': 'Human Approval Required', 'Release Readiness': 'Conditional',
    'Recovery Notes': note, 'Run 2 Verified': false,
  });
}
async function upsertAcceptance(input: BridgeInput) {
  const existing = await findByPrimary('Production Acceptance', 'Acceptance Target', input.name);
  const evidence = [`Run 9 bridge · ${input.sourceKind} ${input.sourceId} · ${input.phase}`, input.evidence, input.productionUrl ? `Production URL: ${input.productionUrl}` : '', input.portalUrl ? `Portal URL: ${input.portalUrl}` : ''].filter(Boolean).join(' · ');
  if (existing) return writeRecord('Production Acceptance', existing.id, { 'Evidence / Blockers': appendEvidence(existing.fields['Evidence / Blockers'], evidence) });
  const operational = input.phase === 'factory-wired' || input.phase === 'ctp-production-ready';
  return writeRecord('Production Acceptance', null, {
    'Acceptance Target': input.name, 'Scope': 'Client', 'Canonical Ownership': 'Partial', 'Rollback Proof': 'Partial',
    'Runtime Health': operational ? 'Healthy' : 'Blocked', 'Monitoring Proof': 'Missing', 'Consolidation State': 'Preserve Pending Reconciliation',
    'Acceptance Result': 'Conditional', 'Evidence / Blockers': evidence, 'Run 3 Verified': false,
  });
}
async function upsertEvidence(input: BridgeInput) {
  const primary = `Run 9 bridge — ${input.sourceKind} — ${input.sourceId}`;
  const existing = await findByPrimary('Governance Evidence', 'Evidence Record', primary);
  await writeRecord('Governance Evidence', existing?.id ?? null, {
    'Evidence Record': primary, 'Evidence Type': 'Normal', 'System / Target': input.name, 'Policy Decision': 'Preserve Pending Review', 'Owner': 'EA Operations',
    'Source Evidence': [`Target: ${input.name}`, `Phase: ${input.phase}`, input.evidence, input.productionUrl ? `Production: ${input.productionUrl}` : '', input.portalUrl ? `Portal: ${input.portalUrl}` : ''].filter(Boolean).join('\n'),
    'Outcome': 'Conditional', 'Evidence Date': new Date().toISOString(), 'Audit Notes': 'Machine-created by Run 9 Control Plane bridge. Evidence does not override release gates.', 'Run 7 Verified': true,
  });
}
async function register(input: BridgeInput): Promise<ControlPlaneBridgeResult> {
  if (!apiKey()) { const error = 'Control Plane bridge cannot run because Airtable credential is missing.'; return enforced() ? { ok: false, error } : { ok: true, error: `Non-production skip: ${error}` }; }
  try {
    const manifest = await upsertManifest(input); const governance = await upsertGovernance(input); const acceptance = await upsertAcceptance(input); await upsertEvidence(input);
    return { ok: true, manifestRecordId: manifest.id, governanceRecordId: governance.id, acceptanceRecordId: acceptance.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Control Plane bridge error.';
    if (!enforced()) { console.warn('[control-plane-bridge] non-production bridge failure', message); return { ok: true, error: `Non-production bridge warning: ${message}` }; }
    console.error('[control-plane-bridge] fail-closed', message); return { ok: false, error: message };
  }
}

export async function getControlPlaneReleaseState(name: string): Promise<ControlPlaneReleaseState> {
  if (!apiKey()) { const error = 'Control Plane release check cannot run because Airtable credential is missing.'; return enforced() ? { ok: false, ready: false, error, reasons: [error] } : { ok: true, ready: false, error, reasons: [error] }; }
  try {
    const manifest = await findByPrimary('Universal Manifest', 'Manifest Name', name.trim());
    const governance = await findByPrimary('Release Governance', 'System / Release Target', name.trim());
    const reasons: string[] = [];
    if (!manifest) reasons.push('Universal Manifest identity is missing.');
    if (!governance) reasons.push('Release Governance record is missing.');
    if (manifest) {
      const infrastructure = fieldText(manifest, 'Infrastructure State'); const approval = fieldText(manifest, 'Approval State');
      if (infrastructure !== 'Resolved') reasons.push(`Infrastructure State is ${infrastructure || 'unset'}, not Resolved.`);
      if (!['Current Approved','Verified'].includes(approval)) reasons.push(`Approval State is ${approval || 'unset'}, not Current Approved/Verified.`);
    }
    if (governance) {
      const gates: Array<[string,string]> = [['Change Authorization','Approved'],['Approved Baseline','Verified'],['Rollback Target','Known'],['CI / Build Gate','Verified'],['Monitoring Gate','Verified'],['Release Readiness','Ready']];
      for (const [field, expected] of gates) { const actual = fieldText(governance, field); if (actual !== expected) reasons.push(`${field} is ${actual || 'unset'}, not ${expected}.`); }
    }
    return { ok: true, ready: reasons.length === 0, reasons, manifestRecordId: manifest?.id, governanceRecordId: governance?.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Control Plane release-check error.';
    return enforced() ? { ok: false, ready: false, error: message, reasons: [message] } : { ok: true, ready: false, error: message, reasons: [message] };
  }
}

export async function registerFactoryProjectControlPlane(project: Pick<FactoryProject, 'id' | 'client' | 'goal' | 'deliverable' | 'source'>) {
  return register({ name: project.client.trim(), phase: 'factory-created', sourceId: project.id, sourceKind: 'Factory', evidence: `Goal: ${project.goal}; Deliverable: ${project.deliverable}; Source: ${project.source}` });
}
export async function registerFactoryWiredControlPlane(input: { project: Pick<FactoryProject, 'id' | 'client'>; portalUrl?: string; productionUrl?: string; websiteStatus?: string }) {
  return register({ name: input.project.client.trim(), phase: 'factory-wired', sourceId: input.project.id, sourceKind: 'Factory', portalUrl: input.portalUrl, productionUrl: input.productionUrl, evidence: `Factory selected concept wired; website status: ${input.websiteStatus || 'unknown'}` });
}
export async function registerCtpCreatedControlPlane(submission: Pick<CtpSubmission, 'id' | 'businessName' | 'contactName'>) {
  return register({ name: submission.businessName.trim() || submission.contactName.trim(), phase: 'ctp-created', sourceId: submission.id, sourceKind: 'CTP', evidence: `CTP intake for ${submission.contactName}` });
}
export async function registerCtpWorkspaceControlPlane(submission: Pick<CtpSubmission, 'id' | 'businessName' | 'contactName'>, portalUrl: string) {
  return register({ name: submission.businessName.trim() || submission.contactName.trim(), phase: 'ctp-workspace-active', sourceId: submission.id, sourceKind: 'CTP', portalUrl, evidence: 'CTP workspace provisioned and portal identity established.' });
}
export async function registerCtpProductionControlPlane(input: { submission: Pick<CtpSubmission, 'id' | 'businessName' | 'contactName'>; portalUrl: string; productionUrl?: string }) {
  return register({ name: input.submission.businessName.trim() || input.submission.contactName.trim(), phase: 'ctp-production-ready', sourceId: input.submission.id, sourceKind: 'CTP', portalUrl: input.portalUrl, productionUrl: input.productionUrl, evidence: 'CTP production provision completed; release remains governed by canonical gates.' });
}
