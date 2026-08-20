import assert from 'node:assert/strict';
import {
  invitedAmandaLearner,
  invitedAmandaPortalIdentity,
} from '../lib/amanda-catherine/invited-learners.ts';

assert.deepEqual(invitedAmandaLearner('Info@RosieMarocha.com')?.courseIds, [
  'body-sculpt-practitioner-certification',
]);
assert.deepEqual(invitedAmandaLearner('jennifer@diamondaesthetics.ca')?.courseIds, [
  'body-sculpt-practitioner-certification',
]);
assert.deepEqual(invitedAmandaLearner('maeraesthetics@gmail.com')?.courseIds, [
  'aesthetikine-reset-training',
]);
assert.equal(invitedAmandaLearner('someone@example.com'), null);
assert.deepEqual(invitedAmandaPortalIdentity('maeraesthetics@gmail.com'), {
  ok: true,
  slug: 'amanda-catherine',
  recordId: '',
});

console.log('Amanda invited learner access: PASS');
