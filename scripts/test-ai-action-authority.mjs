import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../lib/ai/action-authority.ts', import.meta.url), 'utf8');
const body = source
  .replace(/export type[\s\S]*?};\n/g, '')
  .replace(/export function/g, 'function')
  .replace(/: NodeJS\.ProcessEnv/g, '')
  .replace(/: EAActionAuthorityInput/g, '')
  .replace(/: EAActionAuthorityResult/g, '')
  .replace(/: EAActionTier/g, '')
  .replace(/: EAActionDecision/g, '');
const api = new Function(`${body}; return { evaluateAIActionAuthority, isGlobalAIExecutionEnabled };`)();
const enabled = { EA_AI_EXECUTION_ENABLED: 'true' };
const disabled = { EA_AI_EXECUTION_ENABLED: 'false' };

assert.equal(api.evaluateAIActionAuthority({ tier: 1, actorId: 'u1', tenantId: 't1', authorization: 'standing' }, disabled).decision, 'DENY', 'kill switch must block mutation');
assert.equal(api.evaluateAIActionAuthority({ tier: 3, actorId: 'u1', tenantId: 't1', authorization: 'explicit' }, enabled).decision, 'REQUIRES_HUMAN_APPROVAL', 'Tier 3 must not accept ordinary explicit approval');
assert.equal(api.evaluateAIActionAuthority({ tier: 2, actorId: 'u1', tenantId: 't1', targetTenantId: 't2', authorization: 'explicit' }, enabled).decision, 'DENY', 'cross-tenant mutation must fail closed');
assert.equal(api.evaluateAIActionAuthority({ tier: 1, actorId: 'u1', tenantId: 't1', authorization: 'standing' }, enabled).decision, 'ALLOW', 'authorized reversible mutation should pass');
assert.equal(api.evaluateAIActionAuthority({ tier: 1, actorId: 'u1', tenantId: 't1', authorization: 'standing', policyResolved: false }, enabled).decision, 'DENY', 'unknown policy must fail closed');
assert.equal(api.evaluateAIActionAuthority({ tier: 1, actorId: 'u1', tenantId: 't1', authorization: 'standing', attemptsPrivilegeElevation: true }, enabled).decision, 'DENY', 'AI self-elevation must fail closed');
assert.equal(api.evaluateAIActionAuthority({ tier: 0 }, disabled).decision, 'ALLOW', 'kill switch should preserve observe/draft capability');

console.log('EA AI action authority certification checks passed.');
