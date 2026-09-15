import fs from 'node:fs'; import assert from 'node:assert/strict';
const c=JSON.parse(fs.readFileSync('.ea/universal-factory/run9-learning-compounding-engine.v1.json','utf8'));
assert.equal(c.run,9); assert.equal(c.principle,'SOLVE_ONCE_VERIFY_CERTIFY_REGISTER_REUSE');
for(const x of ['CAPABILITY','CONNECTOR','ARCHETYPE','DATA_MAPPING','DESIGN_PATTERN','RECOVERY_PATTERN','INFRASTRUCTURE_MODULE']) assert(c.candidateClasses.includes(x),x);
for(const x of ['CREATE_LEARNING_CANDIDATE','REMOVE_CLIENT_SPECIFIC_DATA','GENERATE_TESTS','TENANT_ISOLATION_REVIEW','CERTIFY','REGISTER','PUBLISH_TO_FACTORY_CATALOG','MEASURE_REUSE']) assert(c.lifecycle.includes(x),x);
assert.equal(c.promotion.automaticCandidateCreation,true); assert.equal(c.promotion.automaticCertification,false); assert.equal(c.promotion.failedOrUnverifiedSolutionCannotPromote,true); assert.equal(c.factoryDebt.manualStepCreatesCandidate,true); assert.equal(c.reuse.registrySearchBeforeBuild,true);
assert.equal(c.privacyAndIsolation.crossTenantRawEvidencePromotionForbidden,true); assert.equal(c.privacyAndIsolation.phiPiiRemovalRequired,true);
for(const x of ['unverified-solution','credential-present','regulated-pattern-without-domain-review']) assert(c.failClosedOn.includes(x),x);
assert.equal(c.handoff.nextRun,'RUN_10_UNIVERSAL_TORTURE_CERTIFICATION'); console.log('EA Universal Factory Run 9 learning and compounding engine certified.');