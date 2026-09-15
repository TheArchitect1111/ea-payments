import fs from 'node:fs'; import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
for(let i=0;i<=9;i++){
 const names=fs.readdirSync('.ea/universal-factory').filter(n=>n.startsWith(`run${i}-`)&&n.endsWith('.json'));
 assert(names.length>0,`Run ${i} contract missing`);
 assert(fs.existsSync(`scripts/test-universal-factory-run${i}.mjs`),`Run ${i} test missing`);
}
const c=read('.ea/universal-factory/run10-universal-torture-certification.v1.json');
assert.equal(c.run,10); assert.equal(c.targetCertification,'EA_UNIVERSAL_FACTORY_V1_CERTIFIED');
for(const x of ['AMANDA','TARRIS','CPR','ESR','PROJECT_HOSPITAL','GREENFIELD']) assert(c.provingGrounds.some(p=>p.id===x),x);
for(const x of ['cross-tenant-artifact','secret-in-source','worker-self-authorized-production','http-200-with-broken-user-journey','unverified-learning-promotion','rollback-target-unverified']) assert(c.failureScenarios.includes(x),x);
assert.equal(c.scaleScenarios.knownArchetypeBatch.tenants*c.scaleScenarios.knownArchetypeBatch.productsPerTenant,250);
assert.equal(c.certificationRules.commitIsNotCompletion,true); assert.equal(c.certificationRules.deploymentIsNotCompletion,true); assert.equal(c.certificationRules.http200IsNotCompletion,true); assert.equal(c.finalDecision.passRequiresAllMaterialScenarios,true); assert.equal(c.externalRuntimeTruth.contractCertificationDoesNotProveRuntimeProvisioning,true);
console.log('EA_UNIVERSAL_FACTORY_V1_CERTIFIED: repository contracts, proving-ground requirements, failure matrix, scale envelope, and runtime-truth boundary certified.');