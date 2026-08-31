import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const [staticLearningRoute, moduleGate, accessStore, checkoutFulfillment, middleware] = await Promise.all([
  read('app/portal/amanda-catherine/learning/page.tsx'),
  read('lib/modules/portal-modules.ts'),
  read('lib/amanda-catherine/client-access.ts'),
  read('lib/amanda-catherine/payment-fulfillment.ts'),
  read('middleware.ts'),
]);

assert.doesNotMatch(staticLearningRoute, /redirect\(/, 'Amanda learning route must render, not redirect');
assert.match(staticLearningRoute, /LearningPage/, 'Amanda static route must render the learning center');
assert.match(moduleGate, /hasAmandaLearningAccess/, 'Training gate must honor learner-level course access');
assert.match(moduleGate, /moduleId === 'training'/, 'Learner override must be scoped to training');
assert.match(accessStore, /AmandaAccessProfileSchema\.safeParse/, 'Stored learner grants must be schema validated');
assert.match(accessStore, /if \(!profileSave\.ok\)/, 'Fulfillment must fail closed when course assignment persistence fails');
assert.match(checkoutFulfillment, /provisionAmandaClientAccess/, 'Stripe fulfillment must provision course access');
assert.match(checkoutFulfillment, /courseIds: record\.courseId \? \[record\.courseId\] : \[\]/, 'Purchased course must be assigned');
assert.match(middleware, /login\.searchParams\.set\('next', `\$\{pathname\}\$\{request\.nextUrl\.search\}`\)/, 'Unauthenticated course links must preserve the post-login destination');

console.log('Amanda enrollment → login → learning handoff: PASS');
