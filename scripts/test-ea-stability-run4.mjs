import assert from 'node:assert/strict';
import { RUN4_FAILURES, runStabilityCertification } from '../lib/stability/run4-certification.mjs';

const result = runStabilityCertification();

assert.equal(RUN4_FAILURES.length, 13, 'Run 4 must cover all 13 certification failures');
assert.equal(result.standard, 'EA_STABLE_PRODUCTION_SYSTEM_V1');
assert.equal(result.status, 'PASS');
assert.equal(result.allDetected, true);
assert.equal(result.allFailClosed, true);
assert.equal(result.allSafe, true);
assert.equal(result.noProductionTouch, true);
assert.equal(result.repairPathsVerified, true);
assert.equal(result.rollbackPathsVerified, true);
assert.equal(result.resumePathsVerified, true);
assert.equal(result.unauthorizedBlocked, true);
assert.equal(result.killSwitchVerified, true);
assert.equal(result.results.every((r) => r.productionPromotionAllowed === false), true);
assert.equal(result.results.every((r) => r.externalProductionTouched === false), true);

const required = new Set([
  'bad-asset', 'missing-env', 'broken-api', 'failed-deploy', 'duplicate-image',
  'visual-drift', 'db-timeout', 'worker-restart', 'temporal-interruption',
  'unauthorized-change', 'bad-feature-flag', 'partial-deploy', 'portal-login-failure',
]);
for (const id of required) assert.equal(result.results.some((r) => r.id === id), true, `missing ${id}`);

console.log(JSON.stringify(result, null, 2));
console.log('EA Stability Run 4 certification: PASS');
