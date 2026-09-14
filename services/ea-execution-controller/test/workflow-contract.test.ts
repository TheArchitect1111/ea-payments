import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { assessGateEvidence } from '../src/evidence.js';

const workflow = await readFile(new URL('../src/workflows.ts', import.meta.url), 'utf8');
const activities = await readFile(new URL('../src/activities.ts', import.meta.url), 'utf8');

assert.match(workflow, /state:'BLOCKED'/, 'unapproved or failed jobs must support BLOCKED');
assert.match(workflow, /state='REPAIR'/, 'repair loop must exist');
assert.match(workflow, /state='VERIFY'/, 'verification must precede completion');
assert.ok(workflow.indexOf("state='VERIFY'") < workflow.indexOf("state='COMPLETE'"), 'COMPLETE must occur after VERIFY');
assert.match(activities, /loadAuthoritativeGateEvidence/, 'Run 3 must consume authoritative EA evidence');
assert.match(activities, /repair-route:/, 'Run 3 must create deterministic repair routes');

const pass = assessGateEvidence({ status:'PASS', gates:{ functional:{status:'PASS'}, desktopVisual:{status:'PASS'}, mobileVisual:{status:'PASS'}, creativeCritic:{status:'PASS'} } });
assert.equal(pass.pass, true);
assert.equal(pass.failedGates.length, 0);

const fail = assessGateEvidence({ status:'FAIL', gates:{ functional:{status:'FAIL'}, desktopVisual:{status:'PASS'} } });
assert.equal(fail.pass, false);
assert.deepEqual(fail.failedGates, ['functional']);
assert.equal(fail.repairable, true);

console.log('EA Temporal evidence + repair contract: PASS');
