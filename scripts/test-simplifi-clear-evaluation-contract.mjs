import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const page = readFileSync(join(root, 'app/simplifi/opportunity/[id]/page.tsx'), 'utf8');
const summary = readFileSync(join(root, 'lib/evaluation-summary.ts'), 'utf8');

for (const heading of [
  'What this is',
  'Verdict',
  'Why it matters',
  'Your next move',
  'Next three steps',
  'View detailed analysis',
]) {
  assert.ok(page.includes(heading), `missing clear evaluation heading: ${heading}`);
}

assert.ok(page.includes('<details'), 'detailed analysis must be collapsed by default');
assert.ok(summary.includes("'Pursue' | 'Review' | 'Monitor' | 'Pass'"), 'missing required verdicts');
assert.ok(summary.includes('priority.reasons.slice(0, 3)'), 'why-it-matters must be limited to three');
assert.ok(summary.includes('nextSteps: nextStepsByVerdict[verdict]'), 'missing ordered next steps');

console.log('Simplifi clear evaluation contract passed.');
