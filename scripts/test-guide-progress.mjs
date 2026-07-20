/**
 * Contract: Progress page is the Guide (Guide Operating System).
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
function read(rel) {
  const p = resolve(root, rel);
  if (!existsSync(p)) throw new Error(`Missing ${rel}`);
  return readFileSync(p, 'utf8');
}

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    failed += 1;
  } else {
    console.log(`PASS: ${msg}`);
  }
}

const page = read('app/portal/[slug]/ctp/progress/page.tsx');
const adapter = read('lib/ctp-guide-progress.ts');

const banned = [
  'Executive Snapshot',
  'executive brief',
  'Admin drag',
  'Business Intelligence',
  'AI Evaluation',
  'AI production',
  'Ready For Reveal',
  'Digital Presence',
  'Maturity',
  'percentComplete',
  'Overview',
  '/ctp/bi',
];

for (const term of banned) {
  assert(!page.includes(term), `progress page must not contain "${term}"`);
}

assert(adapter.includes("'Welcome'"), 'adapter defines Welcome');
assert(adapter.includes("'Discovery'"), 'adapter defines Discovery');
assert(adapter.includes("'Strategy'"), 'adapter defines Strategy');
assert(adapter.includes("'Proposal'"), 'adapter defines Proposal');
assert(adapter.includes("'Agreement'"), 'adapter defines Agreement');
assert(adapter.includes("'Design'"), 'adapter defines Design');
assert(adapter.includes("'Build'"), 'adapter defines Build');
assert(adapter.includes("'Review'"), 'adapter defines Review');
assert(adapter.includes("'Launch'"), 'adapter defines Launch');
assert(adapter.includes("'Care'"), 'adapter defines Care');

assert(page.includes('buildGuideProgressView'), 'page uses Guide adapter');
assert(page.includes('What you need to do'), 'page has NBA section');
assert(page.includes('What has already happened'), 'page has milestones');
assert(page.includes('What is happening now'), 'page has behind-the-scenes');
assert(page.includes('What happens next'), 'page has whats next');
assert(page.includes('Where you are'), 'page has current stage');
assert((page.match(/guide-progress-nba-cta/g) || []).length === 1, 'exactly one NBA CTA class');

process.exit(failed ? 1 : 0);
