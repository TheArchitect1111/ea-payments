import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { assessGateEvidence } from '../src/evidence.js';

const workflow = await readFile(new URL('../src/workflows.ts', import.meta.url), 'utf8');
const activities = await readFile(new URL('../src/activities.ts', import.meta.url), 'utf8');

assert.match(workflow, /state:'BLOCKED'/, 'unapproved or failed jobs must support BLOCKED');
assert.match(workflow, /state='REPAIR'/, 'repair loop must exist');
assert.match(workflow, /state='VERIFY'/, 'verification must precede completion');
assert.ok(workflow.indexOf("state='VERIFY'") < workflow.indexOf("state='COMPLETE'"), 'COMPLETE must occur after VERIFY');
assert.match(activities, /loadAuthoritativeGateEvidence/, 'controller must consume authoritative EA evidence');
assert.match(activities, /repair-route:/, 'controller must create deterministic repair routes');

const healthy = assessGateEvidence({ status:'PASS', gates:{ functional:{status:'PASS'}, assetQA:{status:'PASS'}, desktopVisual:{status:'PASS'}, mobileVisual:{status:'PASS'}, creativeCritic:{status:'PASS'} } });
assert.equal(healthy.pass, true);
assert.equal(healthy.failedGates.length, 0);
assert.equal(healthy.productionPassed, true);

const injected = [
  { name:'functional failure', gate:{ status:'FAIL', gates:{ functional:{status:'FAIL'}, desktopVisual:{status:'PASS'} } }, expected:['functional'] },
  { name:'missing asset / asset QA failure', gate:{ status:'FAIL', gates:{ functional:{status:'PASS'}, assetQA:{status:'FAIL'}, desktopVisual:{status:'PASS'} } }, expected:['assetQA'] },
  { name:'desktop visual regression', gate:{ status:'FAIL', gates:{ functional:{status:'PASS'}, desktopVisual:{status:'FAIL'}, mobileVisual:{status:'PASS'} } }, expected:['desktopVisual'] },
  { name:'mobile visual regression', gate:{ status:'FAIL', gates:{ functional:{status:'PASS'}, desktopVisual:{status:'PASS'}, mobileVisual:{status:'FAIL'} } }, expected:['mobileVisual'] },
  { name:'creative critic rejection', gate:{ status:'FAIL', gates:{ functional:{status:'PASS'}, creativeCritic:{status:'FAIL'} } }, expected:['creativeCritic'] },
];
for (const scenario of injected) {
  const result = assessGateEvidence(scenario.gate);
  assert.equal(result.pass, false, `${scenario.name} must prohibit pass`);
  assert.equal(result.productionPassed, false, `${scenario.name} must prohibit production verification`);
  assert.equal(result.repairable, true, `${scenario.name} must enter repair`);
  assert.deepEqual(result.failedGates, scenario.expected, `${scenario.name} must identify the failed gate`);
}

const multiFailure = assessGateEvidence({ status:'FAIL', gates:{ functional:{status:'FAIL'}, assetQA:{status:'FAIL'}, desktopVisual:{status:'FAIL'}, mobileVisual:{status:'FAIL'}, creativeCritic:{status:'FAIL'} } });
assert.equal(multiFailure.pass, false);
assert.deepEqual(multiFailure.failedGates, ['functional','assetQA','desktopVisual','mobileVisual','creativeCritic']);
assert.equal(multiFailure.repairable, true);

assert.match(workflow, /result\.repairCycles >= maxRepairCycles/, 'repair loop must have a hard safety bound');
assert.match(workflow, /Final verification failed\. COMPLETE is prohibited\./, 'false COMPLETE must be explicitly prohibited');
assert.match(workflow, /Repaired job failed authoritative re-gating\./, 'failed repair must be re-gated and blocked');
assert.match(workflow, /nextSteps:job\.nextSteps/, 'next steps must survive through execution result');

console.log('EA Execution Controller Run 4 failure-injection acceptance: PASS');
