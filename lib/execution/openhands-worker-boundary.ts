export type OpenHandsEngineeringTask = {
  executionId: string;
  projectId: string;
  clientId: string;
  repository: string;
  baseRef: string;
  task: string;
  allowedPaths: string[];
  forbiddenPaths: string[];
  acceptanceCriteria: string[];
  rollbackTarget: string;
  mode: 'SHADOW' | 'PATCH_ONLY';
};

export type OpenHandsEngineeringResult = {
  executionId: string;
  status: 'SUCCEEDED' | 'FAILED' | 'BLOCKED';
  workspaceId?: string;
  changedPaths: string[];
  patchRef?: string;
  testCommands: string[];
  testResults: Array<{ command: string; passed: boolean; summary: string }>;
  evidenceRefs: string[];
  notes: string[];
};

export interface OpenHandsEngineeringWorker {
  /**
   * Executes engineering work inside an isolated workspace and returns evidence.
   * This interface deliberately exposes no merge/deploy/production mutation method.
   */
  execute(task: OpenHandsEngineeringTask): Promise<OpenHandsEngineeringResult>;
}

export const OPENHANDS_RUN1_POLICY = Object.freeze({
  productionAuthority: false,
  mergeAuthority: false,
  deployAuthority: false,
  directMasterWrite: false,
  allowedModes: ['SHADOW', 'PATCH_ONLY'] as const,
  requiredControls: [
    'tenant scope locked before dispatch',
    'repository and base ref locked before dispatch',
    'allowed and forbidden path lists required',
    'acceptance criteria required',
    'known rollback target required',
    'all returned work must pass EA CI and policy gates independently',
    'worker output can never declare EA COMPLETE',
  ],
});

export function assertOpenHandsRun1TaskSafe(task: OpenHandsEngineeringTask): void {
  if (!task.clientId || !task.projectId || !task.executionId) {
    throw new Error('OpenHands task requires execution, project, and client identity.');
  }
  if (!task.rollbackTarget) {
    throw new Error('OpenHands task requires a known rollback target.');
  }
  if (!task.allowedPaths.length) {
    throw new Error('OpenHands task requires an explicit allowed path scope.');
  }
  if (!task.acceptanceCriteria.length) {
    throw new Error('OpenHands task requires acceptance criteria.');
  }
  if (!OPENHANDS_RUN1_POLICY.allowedModes.includes(task.mode)) {
    throw new Error('OpenHands Run 1 only permits SHADOW or PATCH_ONLY mode.');
  }
  if (task.allowedPaths.some((path) => task.forbiddenPaths.includes(path))) {
    throw new Error('OpenHands allowed path scope conflicts with forbidden path scope.');
  }
}
