import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [entry, trial] = await Promise.all([
  read('app/amplifi/test/page.tsx'),
  read('app/api/amplifi/trial/route.ts'),
]);

assert.match(entry, /redirect\('\/api\/amplifi\/trial'\)/);
assert.match(entry, /index: false/);
assert.match(trial, /const slug = `amplifi-trial-\$\{trialId\}`/);
assert.match(trial, /role: 'guest'/);
assert.match(trial, /TRIAL_LENGTH_DAYS = 10/);
assert.match(trial, /const allowed = \['\/amplifi\/create', '\/amplifi\/workspace', '\/amplifi\/performance'\]/);
assert.match(trial, /requested\.startsWith\('\/\/'\)/);

console.log('Amplifi isolated public trial entry contract passed.');
