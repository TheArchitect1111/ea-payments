import { proxyActivities, defineQuery, setHandler } from '@temporalio/workflow';
import type * as activities from './activities.js';

export type ExecutionState = 'INTAKE'|'CONTEXT_LOCK'|'MANIFEST'|'PLAN'|'EXECUTE'|'GATE'|'REPAIR'|'VERIFY'|'COMPLETE'|'BLOCKED'|'ROLLED_BACK';
export type GateResult = { pass: boolean; repairable?: boolean; rollback?: boolean; evidence?: string[]; failedGates?: string[]; artifactId?: string; receiptId?: string };
export type EAJob = { id:string; project:string; deliverable:string; approved:boolean; manifestRef:string; artifactId:string; nextSteps:string[]; maxRepairCycles?:number };
export type EAResult = { jobId:string; artifactId:string; state:ExecutionState; repairCycles:number; evidence:string[]; nextSteps:string[]; gateReceipt?:string; blocker?:string };

const a = proxyActivities<typeof activities>({ startToCloseTimeout: '10 minutes', retry: { initialInterval:'2 seconds', backoffCoefficient:2, maximumInterval:'1 minute', maximumAttempts:5 } });
export const executionStatus = defineQuery<EAResult>('executionStatus');

function receiptMatches(job: EAJob, result: GateResult): boolean {
  return Boolean(result.pass && result.receiptId && result.artifactId === job.artifactId);
}

export async function eaExecutionWorkflow(job: EAJob): Promise<EAResult> {
  const result: EAResult = { jobId:job.id, artifactId:job.artifactId, state:'INTAKE', repairCycles:0, evidence:[], nextSteps:job.nextSteps ?? [] };
  setHandler(executionStatus, () => result);
  if (!job.approved) return { ...result, state:'BLOCKED', blocker:'Action intent is not approved.' };
  if (!job.artifactId) return { ...result, state:'BLOCKED', blocker:'Artifact identity is required. Unbound artifacts cannot execute.' };
  result.state='CONTEXT_LOCK'; result.evidence.push(...await a.lockContext(job));
  result.state='MANIFEST'; result.evidence.push(...await a.validateManifest(job));
  result.state='PLAN'; result.evidence.push(...await a.compilePlan(job));
  const maxRepairCycles = job.maxRepairCycles ?? 8;

  while (true) {
    result.state='EXECUTE'; result.evidence.push(...await a.executeExistingEAStack(job));
    result.state='GATE';
    const gate = await a.runExistingEAGates(job);
    result.evidence.push(...(gate.evidence ?? []));
    if (receiptMatches(job, gate)) { result.gateReceipt = gate.receiptId; break; }
    if (gate.pass && !receiptMatches(job, gate)) return { ...result, state:'BLOCKED', blocker:'Gate evidence is not bound to this artifact. Delivery prohibited.' };
    if (gate.rollback) { result.evidence.push(...await a.rollback(job)); return { ...result, state:'ROLLED_BACK' }; }
    if (!gate.repairable || result.repairCycles >= maxRepairCycles) return { ...result, state:'BLOCKED', blocker:'Required gate failed without a safe automatic repair path.' };
    result.state='REPAIR'; result.repairCycles += 1; result.evidence.push(...await a.repair(job, gate));
  }

  while (true) {
    result.state='VERIFY';
    const verified = await a.verify(job);
    result.evidence.push(...(verified.evidence ?? []));
    if (receiptMatches(job, verified)) { result.gateReceipt = verified.receiptId; break; }
    if (verified.pass && !receiptMatches(job, verified)) return { ...result, state:'BLOCKED', blocker:'Verification receipt does not match this artifact. COMPLETE is prohibited.' };
    if (!verified.repairable || result.repairCycles >= maxRepairCycles) return { ...result, state:'BLOCKED', blocker:'Final verification failed. COMPLETE is prohibited.' };
    result.state='REPAIR'; result.repairCycles += 1; result.evidence.push(...await a.repair(job, verified));
    result.state='GATE';
    const regated = await a.runExistingEAGates(job);
    result.evidence.push(...(regated.evidence ?? []));
    if (!regated.pass && (!regated.repairable || result.repairCycles >= maxRepairCycles)) return { ...result, state:'BLOCKED', blocker:'Repaired job failed authoritative re-gating.' };
  }

  if (!result.gateReceipt) return { ...result, state:'BLOCKED', blocker:'No artifact-bound gate receipt. COMPLETE is prohibited.' };
  result.state='COMPLETE';
  return result;
}
