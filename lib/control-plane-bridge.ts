import type { FactoryProject } from '@/lib/factory-project-store';
import type { CtpSubmission } from '@/lib/ctp-submissions';

const CONTROL_PLANE_BASE_ID =
  process.env.EA_CONTROL_PLANE_BASE_ID?.trim() || 'appWVdGzU54Puqld1';
const AIRTABLE_URL = 'https://api.airtable.com/v0';
const SHARED_REPO = 'TheArchitect1111/ea-payments';
const SHARED_BRANCH = 'master';

export type ControlPlaneBridgeResult = {
  ok: boolean;
  error?: string;
  manifestRecordId?: string;
  governanceRecordId?: string;
  acceptanceRecordId?: string;
};

export type ControlPlaneReleaseState = {
  ok: boolean;
  ready: boolean;
  error?: string;
  reasons: string[];
  manifestRecordId?: string;
  governanceRecordId?: string;
};

type CpRecord = {
  id: string;
  fields: Record<string, unknown>;
};

type BridgePhase =
  | 'factory-created'
  | 'factory-wired'
  | 'ctp-created'
  | 'ctp-workspace-active'
  | 'ctp-production-ready';

type BridgeInput = {
  name: string;
  phase: BridgePhase;
  sourceId: string;
  sourceKind: 'Factory' | 'CTP';
  productionUrl?: string;
  portalUrl?: string;
  evidence?: string;
};

function apiKey(): string {
  return (process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT ?? '').trim();
}

function enforced(): boolean {
  const explicit = process.env.EA_CONTROL_PLANE_ENFORCE?.trim().toLowerCase();
  if (explicit === '0' || explicit === 'false' || explicit === 'off') return false;
  if (explicit === '1' || explicit === 'true' || explicit === 'on') return true;
  return process.env.VERCEL_ENV === 'production';
}

function headers(): Record<string, string> {
  const key = apiKey();
  if (!key) throw new Error('AIRTABLE_API_KEY not configured for Control Plane bridge.');
  return { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}

function escapeFormula(value: string): string {
  return value.replace(/'/g, "\\'");
}

async function request(url: string, init: RequestInit): Promise<Response> {
  let last: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const res = await fetch(url, init);
    last = res;
    if (res.status !== 429 && res.status < 500) return res;
    if (attempt < 2) {
      const retryAfter = Number(res.headers.get('retry-after'));
      const wait = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 5000)
        : Math.min(250 * 2 ** attempt, 1500);
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
  if (!last) throw new Error('Control Plane Airtable request did not execute.');
  return last;
}

async function findByPrimary(
  table: string,
  primaryField: string,
  value: string,
): Promise<CpRecord | null> {
  const url = new URL(`${AIRTABLE_URL}/${CONTROL_PLANE_BASE_ID}/${encodeURIComponent(table)}`);
  url.searchParams.set('filterByFormula', `{${primaryField}}='${escapeFormula(value)}'`);
  url.searchParams.set('maxRecords', '1');
  const res = await request(url.toString(), { headers: headers(), cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Control Plane lookup ${table} failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { records?: CpRecord[] };
  return data.records?.[0] ?? null;
}

async function writeRecord(
  table: string,
  recordId: string | null,
  fields: Record<string, unknown>,
): Promise<CpRecord> {
  const base = `${AIRTABLE_URL}/${CONTROL_PLANE_BASE_ID}/${encodeURIComponent(table)}`;
  const res = await request(recordId ? `${base}/${recordId}` : base, {
    method: recordId ? 'PATCH' : 'POST',
    headers: headers(),
    body: recordId
      ? JSON.stringify({ fields, typecast: true })
      : JSON.stringify({ records: [{ fields }], typecast: true }),
  });
  if (!res.ok) {
    throw new Error(`Control Plane write ${table} failed (${res.status}): ${await res.text()}`);
  }
  if (recordId) return (await res.json()) as CpRecord;
  const data = (await res.json()) as { records?: CpRecord[] };
  const created = data.records?.[0];
  if (!created) throw new Error(`Control Plane write ${table} returned no record.`);
  return created;
}

function appendEvidence(existing: unknown, addition: string): string {
  const current = typeof existing === 'string' ? existing.trim() : '';
  if (!current) return addition;
  if (current.includes(addition)) return current;
  return `${current}\n\n${addition}`;
}

function preferExisting(existing: unknown, proposed: unknown): unknown {
  if (existing !== undefined && existing !== null && String(existing).trim() !== '') return existing;
  return proposed;
}

function fieldText(record: CpRecord | null, field: string): string {
  const raw = record?.fields[field];
  return typeof raw === 'string' ? raw.trim() : '';
}

async function upsertManifest(input: BridgeInput): Promise<CpRecord> {
  const existing = await findByPrimary('Universal Manifest', 'Manifest Name', input.name);
  const marker = `Run 9 bridge · ${input.sourceKind} ${input.sourceId} · ${input.phase}`;
  const proposed: Record<string, unknown> = {
    'Manifest Name': input.name,
    'Entity Type': 'Client',
    'GitHub Repo': SHARED_REPO,
    'Deployment Target': 'Shared Vercel: ea-payments',
    'Approval State': 'No Approved Asset Recorded',
    'Infrastructure State': 'Partially Resolved',
    'Recovery / Legacy Notes': marker,
  };
  if (input.productionUrl) proposed['Production URL'] = input.productionUrl;
  if (input.portalUrl) proposed['Portal URL'] = input.portalUrl;

  if (!existing) return writeRecord('Universal Manifest', null, proposed);

  const fields: Record<string, unknown> = {
    'Recovery / Legacy Notes': appendEvidence(existing.fields['Recovery / Legacy Notes'], marker),
  };
  for (const key of ['GitHub Repo', 'Deployment Target', 'Production URL', 'Portal URL']) {
    if (proposed[key] !== undefined) fields[key] = preferExisting(existing.fields[key], proposed[key]);
  }
  return writeRecord('Universal Manifest', existing.id, fields);
}

async function upsertGovernance(input: BridgeInput): Promise<CpRecord> {
  const existing = await findByPrimary('Release Governance', 'System / Release Target', input.name);
  const note = `Run 9 bridge registered ${input.sourceKind} ${input.sourceId} at ${input.phase}. ` +
    'Production remains fail-closed until approved baseline, rollback, monitoring and verification gates resolve.';
  if (existing) {
    return writeRecord('Release Governance', existing.id, {
      'Recovery Notes': appendEvidence(existing.fields['Recovery Notes'], note),
    });
  }
  return writeRecord('Release Governance', null, {
    'System / Release Target': input.name,
    'Release Repo': SHARED_REPO,
    'Release Branch': SHARED_BRANCH,
    'Change Authorization': 'Required',
    'Approved Baseline': 'Needs Reconciliation',
    'Rollback Target': 'Needs Mapping',
    'Client Isolation': 'Shared Platform',
    'CI / Build Gate': 'Required',
    'Monitoring Gate': 'Code Wired / Account Setup Needed',
    'Automation Permission': 'Human Approval Required',
    'Release Readiness': 'Conditional',
    'Recovery Notes': note,
    'Run 2 Verified': false,
  });
}

async function upsertAcceptance(input: BridgeInput): Promise<CpRecord> {
  const existing = await findByPrimary('Production Acceptance', 'Acceptance Target', input.name);
  const evidence = [
    `Run 9 bridge · ${input.sourceKind} ${input.sourceId} · ${input.phase}`,
    input.evidence,
    input.productionUrl ? `Production URL: ${input.productionUrl}` : undefined,
    input.portalUrl ? `Portal URL: ${input.portalUrl}` : undefined,
  ].filter(Boolean).join(' · ');

  if (existing) {
    return writeRecord('Production Acceptance', existing.id, {
      'Evidence / Blockers': appendEvidence(existing.fields['Evidence / Blockers'], evidence),
    });
  }

  const operational = input.phase === 'factory-wired' || input.phase === 'ctp-production-ready';
  return writeRecord('Production Acceptance', null, {
    'Acceptance Target': input.name,
    'Scope': 'Client',
    'Canonical Ownership': 'Partial',
    'Rollback Proof': 'Partial',
    'Runtime Health': operational ? 'Healthy' : 'Blocked',
    'Monitoring Proof': 'Missing',
    'Consolidation State': 'Preserve Pending Reconciliation',
    'Acceptance Result': 'Conditional',
    'Evidence / Blockers': evidence,
    'Run 3 Verified': false,
  });
}

async function upsertGovernanceEvidence(input: BridgeInput): Promise<void> {
  const primary = `Run 9 bridge — ${input.sourceKind} — ${input.sourceId}`;
  const existing = await findByPrimary('Governance Evidence', 'Evidence Record', primary);
  const sourceEvidence = [
    `Target: ${input.name}`,
    `Phase: ${input.phase}`,
    input.evidence,
    input.productionUrl ? `Production: ${input.productionUrl}` : undefined,
    input.portalUrl ? `Portal: ${input.portalUrl}` : undefined,
  ].filter(Boolean).join('\n');
  await writeRecord('Governance Evidence', existing?.id ?? null, {
    'Evidence Record': primary,
    'Evidence Type': 'Normal',
    'System / Target': input.name,
    'Policy Decision': 'Preserve Pending Review',
    'Owner': 'EA Operations',
    'Source Evidence': sourceEvidence,
    'Outcome': 'Conditional',
    'Evidence Date': new Date().toISOString(),
    'Audit Notes': 'Machine-created by Run 9 Control Plane bridge. Evidence does not override release gates.',
    'Run 7 Verified': true,
  });
}

async function register(input: BridgeInput): Promise<ControlPlaneBridgeResult> {
  if (!apiKey()) {
    const error = 'Control Plane bridge cannot run because AIRTABLE_API_KEY/AIRTABLE_PAT is missing.';
    return enforced() ? { ok: false, error } : { ok: true, error: `Non-production skip: ${error}` };
  }

  try {
    const manifest = await upsertManifest(input);
    const governance = await upsertGovernance(input);
    const acceptance = await upsertAcceptance(input);
    await upsertGovernanceEvidence(input);
    return {
      ok: true,
      manifestRecordId: manifest.id,
      governanceRecordId: governance.id,
      acceptanceRecordId: acceptance.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Control Plane bridge error.';
    if (!enforced()) {
      console.warn('[control-plane-bridge] non-production bridge failure', message);
      return { ok: true, error: `Non-production bridge warning: ${message}` };
    }
    console.error('[control-plane-bridge] fail-closed', message);
    return { ok: false, error: message };
  }
}

export async function getControlPlaneReleaseState(name: string): Promise<ControlPlaneReleaseState> {
  if (!apiKey()) {
    const error = 'Control Plane release check cannot run because AIRTABLE_API_KEY/AIRTABLE_PAT is missing.';
    return enforced()
      ? { ok: false, ready: false, error, reasons: [error] }
      : { ok: true, ready: false, error: `Non-production warning: ${error}`, reasons: [error] };
  }

  try {
    const manifest = await findByPrimary('Universal Manifest', 'Manifest Name', name.trim());
    const governance = await findByPrimary('Release Governance', 'System / Release Target', name.trim());
    const reasons: string[] = [];

    if (!manifest) reasons.push('Universal Manifest identity is missing.');
    if (!governance) reasons.push('Release Governance record is missing.');

    if (manifest) {
      const infrastructure = fieldText(manifest, 'Infrastructure State');
      if (infrastructure !== 'Resolved') {
        reasons.push(`Infrastructure State is ${infrastructure || 'unset'}, not Resolved.`);
      }
      const approval = fieldText(manifest, 'Approval State');
      if (approval !== 'Current Approved' && approval !== 'Verified') {
        reasons.push(`Approval State is ${approval || 'unset'}, not Current Approved/Verified.`);
      }
    }

    if (governance) {
      const authorization = fieldText(governance, 'Change Authorization');
      const baseline = fieldText(governance, 'Approved Baseline');
      const rollback = fieldText(governance, 'Rollback Target');
      const build = fieldText(governance, 'CI / Build Gate');
      const monitoring = fieldText(governance, 'Monitoring Gate');
      const readiness = fieldText(governance, 'Release Readiness');

      if (authorization !== 'Approved') reasons.push(`Change Authorization is ${authorization || 'unset'}, not Approved.`);
      if (baseline !== 'Verified') reasons.push(`Approved Baseline is ${baseline || 'unset'}, not Verified.`);
      if (rollback !== 'Known') reasons.push(`Rollback Target is ${rollback || 'unset'}, not Known.`);
      if (build !== 'Verified') reasons.push(`CI / Build Gate is ${build || 'unset'}, not Verified.`);
      if (monitoring !== 'Verified') reasons.push(`Monitoring Gate is ${monitoring || 'unset'}, not Verified.`);
      if (readiness !== 'Ready') reasons.push(`Release Readiness is ${readiness || 'unset'}, not Ready.`);
    }

    return {
      ok: true,
      ready: reasons.length === 0,
      reasons,
      manifestRecordId: manifest?.id,
      governanceRecordId: governance?.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Control Plane release-check error.';
    if (!enforced()) {
      return { ok: true, ready: false, error: `Non-production warning: ${message}`, reasons: [message] };
    }
    return { ok: false, ready: false, error: message, reasons: [message] };
  }
}

export async function registerFactoryProjectControlPlane(
  project: Pick<FactoryProject, 'id' | 'client' | 'goal' | 'deliverable' | 'source'>,
): Promise<ControlPlaneBridgeResult> {
  return register({
    name: project.client.trim(),
    phase: 'factory-created',
    sourceId: project.id,
    sourceKind: 'Factory',
    evidence: `Goal: ${project.goal}; Deliverable: ${project.deliverable}; Source: ${project.source}`,
  });
}

export async function registerFactoryWiredControlPlane(input: {
  project: Pick<FactoryProject, 'id' | 'client'>;
  portalUrl?: string;
  productionUrl?: string;
  websiteStatus?: string;
}): Promise<ControlPlaneBridgeResult> {
  return register({
    name: input.project.client.trim(),
    phase: 'factory-wired',
    sourceId: input.project.id,
    sourceKind: 'Factory',
    portalUrl: input.portalUrl,
    productionUrl: input.productionUrl,
    evidence: `Factory selected concept wired; website status: ${input.websiteStatus || 'unknown'}`,
  });
}

export async function registerCtpCreatedControlPlane(
  submission: Pick<CtpSubmission, 'id' | 'businessName' | 'contactName'>,
): Promise<ControlPlaneBridgeResult> {
  return register({
    name: submission.businessName.trim() || submission.contactName.trim(),
    phase: 'ctp-created',
    sourceId: submission.id,
    sourceKind: 'CTP',
    evidence: `CTP intake for ${submission.contactName}`,
  });
}

export async function registerCtpWorkspaceControlPlane(
  submission: Pick<CtpSubmission, 'id' | 'businessName' | 'contactName'>,
  portalUrl: string,
): Promise<ControlPlaneBridgeResult> {
  return register({
    name: submission.businessName.trim() || submission.contactName.trim(),
    phase: 'ctp-workspace-active',
    sourceId: submission.id,
    sourceKind: 'CTP',
    portalUrl,
    evidence: 'CTP workspace provisioned and portal identity established.',
  });
}

export async function registerCtpProductionControlPlane(input: {
  submission: Pick<CtpSubmission, 'id' | 'businessName' | 'contactName'>;
  portalUrl: string;
  productionUrl?: string;
}): Promise<ControlPlaneBridgeResult> {
  return register({
    name: input.submission.businessName.trim() || input.submission.contactName.trim(),
    phase: 'ctp-production-ready',
    sourceId: input.submission.id,
    sourceKind: 'CTP',
    portalUrl: input.portalUrl,
    productionUrl: input.productionUrl,
    evidence: 'CTP production provision completed; release remains governed by canonical gates.',
  });
}
