export type EAActionTier = 0 | 1 | 2 | 3;
export type EAActionDecision = 'ALLOW' | 'REQUIRES_HUMAN_APPROVAL' | 'DENY';

export type EAActionAuthorityInput = {
  tier: EAActionTier;
  actorId?: string | null;
  tenantId?: string | null;
  targetTenantId?: string | null;
  authorization?: 'standing' | 'explicit' | 'deterministic-approved-workflow' | null;
  attemptsPrivilegeElevation?: boolean;
  policyResolved?: boolean;
};

export type EAActionAuthorityResult = {
  decision: EAActionDecision;
  reason: string;
  executionEnabled: boolean;
};

export function isGlobalAIExecutionEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.EA_AI_EXECUTION_ENABLED === 'true';
}

export function evaluateAIActionAuthority(
  input: EAActionAuthorityInput,
  env: NodeJS.ProcessEnv = process.env,
): EAActionAuthorityResult {
  const executionEnabled = isGlobalAIExecutionEnabled(env);

  if (input.tier === 0) {
    return { decision: 'ALLOW', reason: 'Observe/draft action does not mutate state.', executionEnabled };
  }

  if (!executionEnabled) {
    return { decision: 'DENY', reason: 'Global AI mutation execution is disabled or unresolved.', executionEnabled };
  }

  if (input.policyResolved === false) {
    return { decision: 'DENY', reason: 'Policy resolution failed or is unknown. Fail closed.', executionEnabled };
  }

  if (!input.actorId || !input.tenantId) {
    return { decision: 'DENY', reason: 'Verified actor and tenant are required before mutation.', executionEnabled };
  }

  if (input.targetTenantId && input.targetTenantId !== input.tenantId) {
    return { decision: 'DENY', reason: 'Cross-tenant mutation is prohibited.', executionEnabled };
  }

  if (input.attemptsPrivilegeElevation) {
    return { decision: 'DENY', reason: 'AI self-elevation or privilege expansion is prohibited.', executionEnabled };
  }

  if (input.tier === 3 && input.authorization !== 'deterministic-approved-workflow') {
    return { decision: 'REQUIRES_HUMAN_APPROVAL', reason: 'Tier 3 protected action requires a separately approved deterministic workflow.', executionEnabled };
  }

  if (input.tier === 2 && input.authorization !== 'explicit' && input.authorization !== 'deterministic-approved-workflow') {
    return { decision: 'REQUIRES_HUMAN_APPROVAL', reason: 'Tier 2 material action requires explicit or pre-approved workflow authorization.', executionEnabled };
  }

  if (input.tier === 1 && input.authorization !== 'standing' && input.authorization !== 'explicit' && input.authorization !== 'deterministic-approved-workflow') {
    return { decision: 'REQUIRES_HUMAN_APPROVAL', reason: 'Tier 1 mutation requires standing or current-task authority.', executionEnabled };
  }

  return { decision: 'ALLOW', reason: 'Action satisfies EA AI authority policy.', executionEnabled };
}

export function assertAIActionAuthorized(input: EAActionAuthorityInput, env: NodeJS.ProcessEnv = process.env) {
  const result = evaluateAIActionAuthority(input, env);
  if (result.decision !== 'ALLOW') {
    const error = new Error(result.reason);
    error.name = result.decision;
    throw error;
  }
  return result;
}
