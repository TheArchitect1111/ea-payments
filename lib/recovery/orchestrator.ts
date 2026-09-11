import { randomUUID } from 'node:crypto';
import { decideRecovery } from './policy';
import { loadRecoveryAuthority, recordRecoveryEvidence } from './control-plane';
import type { RecoveryActionId, RecoveryExecution, RecoveryOutcome, RecoveryRunMode, RecoverySignal, RecoveryVerification } from './types';

export type RecoveryActionAdapter = (input: { action: RecoveryActionId; signal: RecoverySignal; rollbackTarget?: string; approvedBaseline?: string }) => Promise<{ mutated: boolean; detail: string }>;

function executionEnabled() {
  return process.env.EA_RECOVERY_EXECUTION_ENABLED?.trim().toLowerCase() === 'true';
}

async function verify(signal: RecoverySignal, productionUrl?: string): Promise<RecoveryVerification> {
  if (!productionUrl) return { ok: false, route: signal.route, detail: 'No canonical production URL available for verification.' };
  try {
    const base = productionUrl.endsWith('/') ? productionUrl : `${productionUrl}/`;
    const url = new URL(signal.route?.replace(/^\//, '') || '', base).toString();
    const res = await fetch(url, { method: 'GET', redirect: 'follow', cache: 'no-store', signal: AbortSignal.timeout(15_000) });
    return { ok: res.ok, status: res.status, route: url, detail: `Canonical verification returned HTTP ${res.status}.` };
  } catch (error) {
    return { ok: false, route: signal.route, detail: `Canonical verification failed: ${error instanceof Error ? error.message : 'network error'}.` };
  }
}

export async function runRecoveryOrchestrator(input: { signal: RecoverySignal; mode?: RecoveryRunMode; adapter?: RecoveryActionAdapter }): Promise<RecoveryOutcome> {
  const startedAt = new Date().toISOString();
  const runId = `recovery_${randomUUID()}`;
  const mode = input.mode ?? 'dry_run';
  const authority = await loadRecoveryAuthority(input.signal.target);
  const decision = decideRecovery(input.signal, authority);

  let execution: RecoveryExecution;
  if (decision.disposition !== 'auto_repair' || !decision.action) {
    execution = { attempted: false, mutated: false, detail: `No mutation. ${decision.disposition}: ${decision.reasons.join(' ')}` };
  } else if (mode === 'dry_run') {
    execution = { attempted: false, mutated: false, action: decision.action, detail: `Dry-run approved ${decision.action}; production was not changed.` };
  } else if (!executionEnabled()) {
    execution = { attempted: false, mutated: false, action: decision.action, detail: 'Execution fail-closed: EA_RECOVERY_EXECUTION_ENABLED is not true.' };
  } else if (!input.adapter) {
    execution = { attempted: false, mutated: false, action: decision.action, detail: 'Execution fail-closed: no approved recovery action adapter was supplied.' };
  } else {
    try {
      const result = await input.adapter({ action: decision.action, signal: input.signal, rollbackTarget: authority?.rollbackTarget, approvedBaseline: authority?.approvedBaseline });
      execution = { attempted: true, mutated: result.mutated, action: decision.action, detail: result.detail };
    } catch (error) {
      execution = { attempted: true, mutated: false, action: decision.action, detail: `Approved recovery adapter failed: ${error instanceof Error ? error.message : 'unknown error'}.` };
    }
  }

  const verification = await verify(input.signal, authority?.productionUrl);
  const completedAt = new Date().toISOString();
  const outcome: RecoveryOutcome = { runId, mode, signal: input.signal, decision, execution, verification, evidenceRecorded: false, startedAt, completedAt };
  outcome.evidenceRecorded = await recordRecoveryEvidence(outcome);
  return outcome;
}

export function recoveryOrchestratorStatus() {
  return {
    installed: true,
    executionEnabled: executionEnabled(),
    defaultMode: 'dry_run' as const,
    failClosed: true,
    loop: ['detect', 'diagnose', 'compare', 'repair', 'verify', 'record', 'notify'] as const,
    note: executionEnabled()
      ? 'Execution flag is enabled; mutation still requires canonical gates plus an explicit approved action adapter.'
      : 'Run 1 safety state: classification, authority, verification and evidence are active; autonomous mutation remains disabled until certification.',
  };
}
