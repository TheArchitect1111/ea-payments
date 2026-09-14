import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile(new URL('../src/workflows.ts', import.meta.url), 'utf8');
const activities = await readFile(new URL('../src/activities.ts', import.meta.url), 'utf8');

assert.match(workflow, /state:'BLOCKED'/, 'unapproved or failed jobs must support BLOCKED');
assert.match(workflow, /state='REPAIR'/, 'repair loop must exist');
assert.match(workflow, /state='VERIFY'/, 'verification must precede completion');
assert.ok(workflow.indexOf("state='VERIFY'") < workflow.indexOf("state='COMPLETE'"), 'COMPLETE must occur after VERIFY');
assert.match(activities, /pass:false/, 'Run 1 adapters must fail closed without authoritative evidence');
assert.doesNotMatch(activities, /pass:true/, 'Run 1 must not manufacture passing evidence');
console.log('EA Temporal workflow contract: PASS');
