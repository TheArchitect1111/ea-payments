import type { EAJob, GateResult } from './workflows.js';
import { evaluatePolicy } from './policy.js';

// Existing EA engines and gates remain authoritative. OPA decides whether their evidence
// is sufficient to advance. Missing evidence always fails closed.
export async function lockContext(job: EAJob): Promise<string[]> {
  if (!job.manifestRef) throw new Error('manifestRef is required');
  return [`context:${job.project}`, `manifest:${job.manifestRef}`];
}
export async function validateManifest(job: EAJob): Promise<string[]> {
  if (!job.approved) throw new Error('unapproved job');
  if (!job.nextSteps?.length) throw new Error('nextSteps are required');
  return ['manifest:validated', 'next-steps:declared'];
}
export async function compilePlan(job: EAJob): Promise<string[]> { return [`plan:${job.deliverable}`]; }
export async function executeExistingEAStack(job: EAJob): Promise<string[]> { return [`stack:delegated:${job.id}`]; }

function awaitingEvidenceInput(job: EAJob, targetState: string) {
  return {
    intent: { approved: job.approved },
    context: { source_of_truth_locked: true },
    target_state: targetState,
    stage: { activities: [{ required: true, status: 'passed' }], gates: [{ required: true, status: 'pending' }] },
    execution: {
      verified: false,
      unresolved_blocking_regressions: 0,
      required_evidence_complete: false,
      required_activity_substituted: false,
      required_activity_skipped: false,
      failed_required_gates: 1,
      rollback_defined: true,
      next_steps: job.nextSteps ?? [],
    },
    verification: { functional_passed: false, visual_required: true, visual_passed: false, production_required: true, production_passed: false },
    quality: { unverified_identity_asset: false, duplicate_image_source: false },
  };
}

export async function runExistingEAGates(job: EAJob): Promise<GateResult> {
  const decision = await evaluatePolicy(awaitingEvidenceInput(job, 'GATE'));
  return { pass: decision.allowed, repairable: false, evidence: decision.deny.length ? decision.deny : [`policy:gate-pass:${job.id}`] };
}
export async function repair(job: EAJob, _gate: GateResult): Promise<string[]> { return [`repair:requested:${job.id}`]; }
export async function rollback(job: EAJob): Promise<string[]> { return [`rollback:${job.id}`]; }
export async function verify(job: EAJob): Promise<GateResult> {
  const decision = await evaluatePolicy(awaitingEvidenceInput(job, 'COMPLETE'), 'data.ea.execution.allow_complete');
  return { pass: decision.allowed, evidence: decision.deny.length ? decision.deny : [`policy:complete-pass:${job.id}`] };
}
