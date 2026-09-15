import fs from 'node:fs';

const path = '.ea/governance/stack-first-enforcement.v1.json';
if (!fs.existsSync(path)) throw new Error('STACK_FIRST_POLICY_MISSING');
const p = JSON.parse(fs.readFileSync(path, 'utf8'));
const required = [
  p.policyId === 'EA_STACK_FIRST_ENFORCEMENT_V1',
  p.status === 'ENFORCED',
  p.default === true,
  p.rules?.directBypassProhibited === true,
  p.rules?.silentSubstitutionProhibited === true,
  p.rules?.explicitOwnerBypassRequired === true,
  p.rules?.failClosedWhenRequiredRuntimeUnavailable === true,
  p.rules?.completionRequiresStackReceipt === true,
  p.visualFoundry?.genericGenerationFallbackAllowed === false,
  p.visualFoundry?.identityFailureResult === 'BLOCKED',
  p.stackReceipt?.noReceiptNoCompletion === true,
  p.runtimeTruth?.contractIsNotRuntime === true,
  p.runtimeTruth?.unprovenRuntimeMustNotBeClaimedLive === true
];
if (required.some(v => !v)) throw new Error('STACK_FIRST_POLICY_INVALID');
console.log('EA_STACK_FIRST_ENFORCEMENT_V1_PASS');
