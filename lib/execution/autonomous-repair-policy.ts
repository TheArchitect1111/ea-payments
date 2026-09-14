import type { OpenHandsEngineeringResult, OpenHandsEngineeringTask } from './openhands-worker-boundary';
import type { ApprovedVisualSurface, VisualComparisonEvidence } from './approved-visual-baseline';
import { evaluateVisualEvidence } from './approved-visual-baseline';

export type AutonomousRepairDecisionInput = {
  task: OpenHandsEngineeringTask;
  workerResult: OpenHandsEngineeringResult;
  opaAllowed: boolean;
  functionalGatePassed: boolean;
  tenantIsolationPassed: boolean;
  rollbackVerified: boolean;
  productionVerificationRequired: boolean;
  visualSurface?: ApprovedVisualSurface;
  visualEvidence?: VisualComparisonEvidence[];
};

export type AutonomousRepairDecision = {
  disposition: 'BLOCKED' | 'READY_FOR_HUMAN_OR_RELEASE_GATE';
  reasons: string[];
};

export function decideAutonomousRepair(input: AutonomousRepairDecisionInput): AutonomousRepairDecision {
  const reasons: string[] = [];
  if (!input.opaAllowed) reasons.push('OPA denied advancement');
  if (!input.functionalGatePassed) reasons.push('functional verification failed');
  if (!input.tenantIsolationPassed) reasons.push('tenant isolation failed');
  if (!input.rollbackVerified || !input.task.rollbackTarget) reasons.push('rollback target not verified');
  if (input.workerResult.status !== 'SUCCEEDED') reasons.push(`engineering worker status ${input.workerResult.status}`);
  if (!input.workerResult.evidenceRefs.length) reasons.push('engineering evidence missing');
  if (input.workerResult.changedPaths.some((path) => input.task.forbiddenPaths.includes(path))) {
    reasons.push('worker changed forbidden path');
  }
  if (input.workerResult.changedPaths.some((path) => !input.task.allowedPaths.some((allowed) => path === allowed || path.startsWith(`${allowed}/`)))) {
    reasons.push('worker changed path outside approved scope');
  }

  if (input.visualSurface) {
    const visual = evaluateVisualEvidence(input.visualSurface, input.visualEvidence ?? []);
    if (!visual.passed) reasons.push(...visual.failures);
  }

  // Run 2 still grants no direct deploy/merge authority to OpenHands.
  // A clean result is only eligible for the independent EA release gate.
  return reasons.length
    ? { disposition: 'BLOCKED', reasons }
    : { disposition: 'READY_FOR_HUMAN_OR_RELEASE_GATE', reasons: [] };
}

export const RUN2_REPAIR_INVARIANTS = Object.freeze([
  'OpenHands cannot merge or deploy',
  'repair scope is locked before worker dispatch',
  'OPA authorization is mandatory',
  'functional verification is mandatory',
  'tenant isolation is mandatory',
  'known rollback is mandatory',
  'protected visual surfaces require approved-baseline evidence',
  'successful repair means eligible for independent release gate, never COMPLETE',
]);
