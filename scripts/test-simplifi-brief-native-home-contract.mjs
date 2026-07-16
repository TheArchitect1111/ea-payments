#!/usr/bin/env node
/**
 * Contract: Simplifi Brief home Pass 3 — native Expo matches web design language.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const home = readFileSync(join(root, 'mobile/app/(app)/home.tsx'), 'utf8');
assert(home.includes("TODAY'S BRIEF") || home.includes('TODAY\\\'S BRIEF'), "Today's Brief card required");
assert(home.includes('RECENT OPPORTUNITIES'), 'Recent Opportunities required');
assert(home.includes('buildBriefHomeSummaries'), 'must use summary helper');
assert(home.includes('opportunityStatusLine'), 'must use status lines');
assert(home.includes('What deserves your attention'), 'attention headline required');
assert(!/CPR Basketball|Mack Attack|Amanda Katherine/.test(home), 'no mock filler');

const helper = readFileSync(join(root, 'mobile/src/brief-home.ts'), 'utf8');
assert(helper.includes('buildBriefHomeSummaries'), 'mobile brief-home helper required');
assert(helper.includes('opportunityStatusLine'), 'mobile status line required');

const briefApi = readFileSync(join(root, 'app/api/simplifi/brief/route.ts'), 'utf8');
assert(briefApi.includes('recentObjects'), 'brief API must expose recentObjects for mobile');

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS simplifi-brief-native-home-contract');
