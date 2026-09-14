import type { EAJob, GateResult } from './workflows.js';

// Run 1 deliberately uses adapters. Existing EA engines and gates remain authoritative.
// Run 3 will wire repair implementations. Run 2 will insert OPA policy decisions.
export async function lockContext(job: EAJob): Promise<string[]> {
  if (!job.manifestRef) throw new Error('manifestRef is required');
  return [`context:${job.project}`, `manifest:${job.manifestRef}`];
}
export async function validateManifest(job: EAJob): Promise<string[]> {
  if (!job.approved) throw new Error('unapproved job');
  return ['manifest:validated'];
}
export async function compilePlan(job: EAJob): Promise<string[]> { return [`plan:${job.deliverable}`]; }
export async function executeExistingEAStack(job: EAJob): Promise<string[]> { return [`stack:delegated:${job.id}`]; }
export async function runExistingEAGates(job: EAJob): Promise<GateResult> {
  // Fail closed until the gate adapter is supplied real evidence by the EA gate runner.
  return { pass:false, repairable:false, evidence:[`gate:awaiting-authoritative-evidence:${job.id}`] };
}
export async function repair(job: EAJob, _gate: GateResult): Promise<string[]> { return [`repair:requested:${job.id}`]; }
export async function rollback(job: EAJob): Promise<string[]> { return [`rollback:${job.id}`]; }
export async function verify(job: EAJob): Promise<GateResult> {
  // Fail closed. A Temporal workflow can never self-declare completion without external verification evidence.
  return { pass:false, evidence:[`verify:awaiting-authoritative-evidence:${job.id}`] };
}
