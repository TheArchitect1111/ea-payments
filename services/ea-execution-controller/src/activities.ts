import { createHash } from 'node:crypto';
import type { EAJob, GateResult } from './workflows.js';
import { evaluatePolicy } from './policy.js';
import { assessGateEvidence, loadAuthoritativeGateEvidence } from './evidence.js';

export async function lockContext(job: EAJob): Promise<string[]> {
  if (!job.manifestRef) throw new Error('manifestRef is required');
  return [`context:${job.project}`, `manifest:${job.manifestRef}`, `artifact:${job.artifactId}`];
}
export async function validateManifest(job: EAJob): Promise<string[]> {
  if (!job.approved) throw new Error('unapproved job');
  if (!job.artifactId) throw new Error('artifactId is required');
  if (!job.nextSteps?.length) throw new Error('nextSteps are required');
  return ['manifest:validated', 'artifact:bound', 'next-steps:declared'];
}
export async function compilePlan(job: EAJob): Promise<string[]> { return [`plan:${job.deliverable}`]; }
export async function executeExistingEAStack(job: EAJob): Promise<string[]> { return [`stack:delegated:${job.id}`, `artifact:${job.artifactId}`]; }

function receipt(job: EAJob, evidence: string[]) {
  return createHash('sha256').update(`${job.id}|${job.artifactId}|${evidence.join('|')}`).digest('hex');
}
function policyInput(job: EAJob, targetState: string, assessment: ReturnType<typeof assessGateEvidence>) {
  return { intent:{approved:job.approved}, context:{source_of_truth_locked:true}, target_state:targetState,
    stage:{ activities:[{required:true,status:'passed'}], gates:assessment.failedGates.length ? assessment.failedGates.map(name=>({name,required:true,status:'failed'})) : [{name:'ea-production-gate',required:true,status:'passed'}]},
    execution:{ verified:assessment.pass, unresolved_blocking_regressions:assessment.failedGates.length, required_evidence_complete:assessment.evidence.length>0, required_activity_substituted:false, required_activity_skipped:false, failed_required_gates:assessment.failedGates.length, rollback_defined:true, next_steps:job.nextSteps },
    verification:{ functional_passed:assessment.functionalPassed, visual_required:assessment.visualRequired, visual_passed:assessment.visualPassed, production_required:true, production_passed:assessment.productionPassed },
    quality:{unverified_identity_asset:false,duplicate_image_source:false} };
}
async function evaluateBound(job: EAJob, target: string, decisionPath?: string): Promise<GateResult> {
  const assessment=assessGateEvidence(await loadAuthoritativeGateEvidence());
  const decision=await evaluatePolicy(policyInput(job,target,assessment), decisionPath);
  const evidence=[...assessment.evidence,...decision.deny.map(reason=>`policy-deny:${reason}`)];
  return { pass:decision.allowed, repairable:!decision.allowed&&assessment.repairable, rollback:assessment.rollback, evidence, failedGates:assessment.failedGates, artifactId:job.artifactId, receiptId:decision.allowed?receipt(job,evidence):undefined };
}
export async function runExistingEAGates(job: EAJob): Promise<GateResult> { return evaluateBound(job,'GATE'); }
export async function repair(job: EAJob, gate: GateResult): Promise<string[]> { const failed=gate.failedGates??[]; if(!failed.length) throw new Error('automatic repair requires identified failed gates'); return failed.map(name=>`repair-route:${name}:requested:${job.id}`); }
export async function rollback(job: EAJob): Promise<string[]> { return [`rollback:${job.id}`]; }
export async function verify(job: EAJob): Promise<GateResult> { return evaluateBound(job,'COMPLETE','data.ea.execution.allow_complete'); }
