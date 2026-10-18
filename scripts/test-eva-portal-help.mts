import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { health, knowledge, loadPortalKnowledge } from '../src/bricks/eva-portal-help/manifest-loader';
import { guideOneStep } from '../src/bricks/eva-portal-help/guide';
import { normalizeGuideRole, canReadEntry } from '../src/bricks/eva-portal-help/roles';
import { makeUnansweredEvent } from '../src/bricks/eva-portal-help/logger';
const portalId = 'amanda-catherine';
const manifest = JSON.parse(readFileSync('knowledge/eva-amanda-manifest.json', 'utf8'));
const data = loadPortalKnowledge(portalId);
assert.equal(health(portalId).status, 200);
assert.equal(knowledge(portalId).entryCount, 207);
assert.equal(data.entries.length, 207);
assert.equal(manifest.questionsEvaCannotReliablyAnswerToday.length, 30);
assert.equal(health('unregistered-tenant').status, 503);
assert.equal(normalizeGuideRole('owner'), 'owner');
assert.equal(normalizeGuideRole('admin'), 'admin');
assert.equal(normalizeGuideRole('student'), 'student');
for (const entry of data.entries.filter(x => x.group.startsWith('owner'))) {
  assert.equal(canReadEntry(entry, 'student'), false, 'Student leaked owner entry ' + entry.key);
}
const questions = [
  [1, 'student'], [2, 'student'], [4, 'student'], [5, 'student'],
  [8, 'owner'], [10, 'owner'], [11, 'owner'], [12, 'owner'],
  [13, 'owner'], [17, 'owner'],
] as const; // 1-based indices from the Step 1 unanswered list.
const expectedGuided = new Set([10, 11, 12, 13]);
let guidedCount = 0;
const events: Array<{ portalId: string; question: string; role: string }> = [];
for (const [index, role] of questions) {
  const question = manifest.questionsEvaCannotReliablyAnswerToday[index - 1].question as string;
  const result = await guideOneStep({ portalId, role, question }, async evt => { events.push(evt); });
  assert.equal(result.ok, expectedGuided.has(index), 'Unexpected guidance disposition for audit question #' + index);
  if (result.ok) {
    guidedCount++;
    assert.equal(result.status, 'guided');
    assert.match(result.link!, /^https:\/\//);
    assert.equal(result.stepNumber, 1);
    assert.ok(result.step && result.step.length > 0);
    assert.ok(result.totalSteps && result.totalSteps >= 1);
    // One step at a time: next response is only obtained with explicit continuation.
    if (result.nextStepIndex != null) {
      const next = await guideOneStep({ portalId, role, question, entryKey: result.entryKey, stepIndex: result.nextStepIndex }, async evt => events.push(evt));
      assert.equal(next.stepNumber, 2);
    }
  } else {
    assert.equal(result.status, 'unanswered');
    assert.equal(result.logged, true);
    assert.equal(result.escalation.required, true);
    assert.ok(events.some(e => e.question === question && e.portalId === portalId));
  }
}
assert.equal(guidedCount, 4);
assert.equal(events.length, 6);
const privateAttempt = await guideOneStep({ portalId, role: 'student', question: 'Owner invoices', entryKey: 'ownerSidebar:3', stepIndex: 0 }, async evt => events.push(evt));
assert.equal(privateAttempt.status, 'unanswered');
assert.equal(privateAttempt.logged, true);
assert.deepEqual(makeUnansweredEvent('amanda-catherine','student','help me test@example.com','not found').question, 'help me [email]');
console.log(JSON.stringify({ status:'PASS', health:health(portalId), knowledge:knowledge(portalId), testQuestionCount:questions.length, guidedCount, loggedUnknownCount:events.length, studentOwnerEntryLeakCount:0 }, null, 2));
