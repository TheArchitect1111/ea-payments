import fs from 'node:fs'; import assert from 'node:assert/strict';
const c=JSON.parse(fs.readFileSync('.ea/universal-factory/run8-autonomous-operations.v1.json','utf8'));
assert.equal(c.run,8); assert.equal(c.engines.durableOrchestration,'Temporal'); assert.equal(c.engines.engineeringWorker,'OpenHands'); assert.equal(c.engines.policy,'OPA'); assert.equal(c.engines.telemetry,'OpenTelemetry');
assert.equal(c.authority.controlPlaneOwnsAuthority,true); assert.equal(c.authority.workersOwnProductionAuthority,false); assert.equal(c.authority.destructiveActionDefault,'DENY');
for(const x of ['OBSERVE','DIAGNOSE','CHECK_AUTHORITY','POLICY_EVALUATE','EXECUTE_SAFE_ACTION','VERIFY','CLOSE_OR_ROLLBACK','RECORD_EVIDENCE']) assert(c.lifecycle.includes(x),x);
for(const x of ['domain-repoint','destructive-data-change','new-regulated-data-access','financial-commitment']) assert(c.autonomousActions.humanGateRequired.includes(x),x);
assert.equal(c.recovery.crossTenantRepairForbidden,true); assert.equal(c.recovery.postRepairVerificationRequired,true); assert.equal(c.verification.http200AloneNeverSufficient,true); assert.equal(c.eva.mayNotClaimFixedBeforeVerification,true);
for(const x of ['missing-authority','cross-tenant-action','worker-self-declared-completion']) assert(c.failClosedOn.includes(x),x);
assert.equal(c.handoff.nextRun,'RUN_9_LEARNING_AND_COMPOUNDING_ENGINE'); console.log('EA Universal Factory Run 8 autonomous operations certified.');