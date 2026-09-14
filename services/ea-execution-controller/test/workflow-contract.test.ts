import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { assessGateEvidence } from '../src/evidence.js';

const workflow=await readFile(new URL('../src/workflows.ts',import.meta.url),'utf8');
const activities=await readFile(new URL('../src/activities.ts',import.meta.url),'utf8');
assert.match(workflow,/state:'BLOCKED'/);
assert.match(workflow,/state='REPAIR'/);
assert.match(workflow,/state='VERIFY'/);
assert.ok(workflow.indexOf("state='VERIFY'")<workflow.indexOf("state='COMPLETE'"));
assert.match(activities,/loadAuthoritativeGateEvidence/);
assert.match(activities,/repair-route:/);
assert.match(workflow,/artifactId:string/,'every job must identify the exact artifact');
assert.match(workflow,/Gate evidence is not bound to this artifact\. Delivery prohibited\./,'passing generic gates cannot authorize delivery');
assert.match(workflow,/No artifact-bound gate receipt\. COMPLETE is prohibited\./,'COMPLETE requires artifact-bound receipt');
assert.match(activities,/receiptId:decision\.allowed\?receipt\(job,evidence\):undefined/,'passing evidence must issue an artifact receipt');
assert.match(activities,/artifact:bound/,'manifest validation must bind artifact');

const healthy=assessGateEvidence({status:'PASS',gates:{functional:{status:'PASS'},assetQA:{status:'PASS'},desktopVisual:{status:'PASS'},mobileVisual:{status:'PASS'},creativeCritic:{status:'PASS'}}});
assert.equal(healthy.pass,true);
const injected=[
 {gate:{status:'FAIL',gates:{functional:{status:'FAIL'},desktopVisual:{status:'PASS'}}},expected:['functional']},
 {gate:{status:'FAIL',gates:{functional:{status:'PASS'},assetQA:{status:'FAIL'},desktopVisual:{status:'PASS'}}},expected:['assetQA']},
 {gate:{status:'FAIL',gates:{functional:{status:'PASS'},desktopVisual:{status:'FAIL'},mobileVisual:{status:'PASS'}}},expected:['desktopVisual']},
 {gate:{status:'FAIL',gates:{functional:{status:'PASS'},desktopVisual:{status:'PASS'},mobileVisual:{status:'FAIL'}}},expected:['mobileVisual']},
 {gate:{status:'FAIL',gates:{functional:{status:'PASS'},creativeCritic:{status:'FAIL'}}},expected:['creativeCritic']},
];
for(const scenario of injected){const r=assessGateEvidence(scenario.gate);assert.equal(r.pass,false);assert.equal(r.repairable,true);assert.deepEqual(r.failedGates,scenario.expected);}
assert.match(workflow,/result\.repairCycles >= maxRepairCycles/);
assert.match(workflow,/nextSteps:job\.nextSteps/);
console.log('EA artifact-bound execution + failure-injection acceptance: PASS');
