import fs from 'node:fs';
import assert from 'node:assert/strict';

const path = '.ea/universal-factory/run0-universal-factory-contract.v1.json';
const contract = JSON.parse(fs.readFileSync(path, 'utf8'));

assert.equal(contract.program, 'EA_UNIVERSAL_FACTORY_V1');
assert.equal(contract.run, 0);
assert.equal(contract.status, 'ENFORCED_CONTRACT');
assert(contract.scope.appliesTo.includes('all-current-ea-projects'));
assert(contract.scope.appliesTo.includes('all-future-ea-projects'));
assert.match(contract.scope.migrationRule, /not rebuilt/i);

const lifecycle = contract.canonicalLifecycle;
for (const stage of ['DISCOVER','ARCHITECT','MANIFEST','ASSEMBLE','VERIFY','APPROVE','DEPLOY','OBSERVE','RECOVER_OR_IMPROVE','LEARN','COMPLETE']) {
  assert(lifecycle.includes(stage), `Missing lifecycle stage ${stage}`);
}
assert.equal(lifecycle.at(-1), 'COMPLETE');

for (const domain of ['identity','intent','tenant','archetype','capabilities','data','integrations','experience','security','compliance','infrastructure','approvals','verification','deployment','observability','recovery','learning']) {
  assert(contract.universalManifestRequiredDomains.includes(domain), `Missing manifest domain ${domain}`);
}

assert.equal(contract.reusePolicy.default, 'REUSE_BEFORE_BUILD');
assert.equal(contract.reusePolicy.manualWorkCreatesFactoryDebt, true);
assert(contract.reusePolicy.sequence.indexOf('find-existing-capability') < contract.reusePolicy.sequence.indexOf('only-then-build-missing-capability'));

for (const blocker of ['unknown-tenant','missing-approved-intent','missing-rollback','cross-tenant-request','ambiguous-production-target']) {
  assert(contract.automationPolicy.failClosedOn.includes(blocker), `Missing fail-closed rule ${blocker}`);
}

assert(contract.customizationPolicy.standardize.includes('tenant-isolation'));
assert(contract.customizationPolicy.customize.includes('visual-storytelling'));
assert.match(contract.customizationPolicy.rule, /cookie-cutter/i);

for (const evidence of ['authorized-intent','manifest-resolved','tenant-isolation-pass','functional-verification-pass','security-policy-pass','observability-registered','final-acceptance-pass']) {
  assert(contract.completionContract.required.includes(evidence), `Missing completion evidence ${evidence}`);
}
for (const forbidden of ['commit-means-complete','deploy-means-complete','http-200-means-complete','worker-self-report-means-complete']) {
  assert(contract.completionContract.forbiddenInference.includes(forbidden), `Missing completion prohibition ${forbidden}`);
}
assert.deepEqual(contract.completionContract.terminalStates, ['COMPLETE','BLOCKED','ROLLED_BACK']);

assert(contract.learningContract.onManualOrNovelSolution.includes('classify-reusability'));
assert(contract.learningContract.onManualOrNovelSolution.includes('register-capability-connector-workflow-policy-test-or-archetype'));
assert.match(contract.learningContract.rule, /never silently become a universal default/i);

for (const invariant of ['do-not-replace-ea-control-plane','do-not-replace-ea-factory','do-not-replace-opa-governance','do-not-replace-recovery-controller','do-not-create-second-file-cabinet']) {
  assert(contract.nonReplacementInvariants.includes(invariant), `Missing non-replacement invariant ${invariant}`);
}

console.log(JSON.stringify({
  certification: 'EA_UNIVERSAL_FACTORY_RUN_0_CONTRACT',
  status: 'PASS',
  scope: 'ALL_EA_PROJECTS',
  lifecycleStages: lifecycle.length,
  manifestDomains: contract.universalManifestRequiredDomains.length,
  decision: 'RUN_0_COMPLETE_PENDING_CI_AND_MERGE'
}, null, 2));
