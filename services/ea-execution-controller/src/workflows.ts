import { proxyActivities, defineQuery, setHandler } from '@temporalio/workflow';
import type * as activities from './activities.js';

export type ExecutionState = 'INTAKE'|'CONTEXT_LOCK'|'MANIFEST'|'PLAN'|'EXECUTE'|'GATE'|'REPAIR'|'VERIFY'|'COMPLETE'|'BLOCKED'|'ROLLED_BACK';
export type GateResult = { pass: boolean; repairable?: boolean; rollback?: boolean; evidence?: string[] };
export type EAJob = { id:string; project:string; deliverable:string; approved:boolean; manifestRef:string; maxRepairCycles?:number };
export type EAResult = { jobId:string; state:ExecutionState; repairCycles:number; evidence:string[]; blocker?:string };

const a = proxyActivities<typeof activities>({ startToCloseTimeout: '10 minutes', retry: { initialInterval:'2 seconds', backoffCoefficient:2, maximumInterval:'1 minute', maximumAttempts:5 } });
export const executionStatus = defineQuery<EAResult>('executionStatus');

export async function eaExecutionWorkflow(job: EAJob): Promise<EAResult> {
  let result: EAResult = { jobId:job.id, state:'INTAKE', repairCycles:0, evidence:[] };
  setHandler(executionStatus, () => result);
  if (!job.approved) return { ...result, state:'BLOCKED', blocker:'Action intent is not approved.' };
  result.state='CONTEXT_LOCK';
  result.evidence.push(...await a.lockContext(job));
  result.state='MANIFEST';
  result.evidence.push(...await a.validateManifest(job));
  result.state='PLAN';
  result.evidence.push(...await a.compilePlan(job));
  const maxRepairCycles = job.maxRepairCycles ?? 8;
  while (true) {
    result.state='EXECUTE';
    result.evidence.push(...await a.executeExistingEAStack(job));
    result.state='GATE';
    const gate = await a.runExistingEAGates(job);
    result.evidence.push(...(gate.evidence ?? []));
    if (gate.pass) break;
    if (gate.rollback) {
      result.evidence.push(...await a.rollback(job));
      return { ...result, state:'ROLLED_BACK' };
    }
    if (!gate.repairable || result.repairCycles >= maxRepairCycles) {
      return { ...result, state:'BLOCKED', blocker:'Required gate failed without a safe automatic repair path.' };
    }
    result.state='REPAIR';
    result.repairCycles += 1;
    result.evidence.push(...await a.repair(job, gate));
  }
  result.state='VERIFY';
  const verified = await a.verify(job);
  result.evidence.push(...(verified.evidence ?? []));
  if (!verified.pass) {
    return { ...result, state:'BLOCKED', blocker:'Final verification failed. COMPLETE is prohibited.' };
  }
  result.state='COMPLETE';
  return result;
}
