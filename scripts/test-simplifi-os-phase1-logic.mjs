/**
 * Runtime logic tests for Phase 1 Ask/Intel (no Supabase / LLM required).
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

// Pure helpers mirrored from embed-provider / detectors (avoid TS compile)
function hashEmbedContent(text) {
  return createHash('sha256').update(text).digest('hex');
}

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(title) {
  return new Set(normalizeTitle(title).split(' ').filter((t) => t.length > 3));
}

function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function rankItems(items) {
  const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
  return [...items].sort((a, b) => {
    const p = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (p !== 0) return p;
    return b.confidence - a.confidence;
  });
}

function suppressDuplicates(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    if (seen.has(item.fingerprint)) continue;
    seen.add(item.fingerprint);
    out.push(item);
  }
  return out;
}

// Embedding dedupe
assert.equal(hashEmbedContent('alpha'), hashEmbedContent('alpha'));
assert.notEqual(hashEmbedContent('alpha'), hashEmbedContent('beta'));

// Duplicate suppression
const drafts = suppressDuplicates([
  { fingerprint: 'upcoming_deadline:recA', priority: 'critical', confidence: 0.9 },
  { fingerprint: 'upcoming_deadline:recA', priority: 'critical', confidence: 0.9 },
  { fingerprint: 'duplicate_work:recA:recB', priority: 'medium', confidence: 0.7 },
]);
assert.equal(drafts.length, 2);

// Ranking
const ranked = rankItems([
  { fingerprint: 'a', priority: 'low', confidence: 0.99 },
  { fingerprint: 'b', priority: 'critical', confidence: 0.5 },
  { fingerprint: 'c', priority: 'high', confidence: 0.8 },
]);
assert.equal(ranked[0].fingerprint, 'b');
assert.equal(ranked[1].fingerprint, 'c');

// Similarity for repeated ideas / duplicates
const sim = jaccard(tokenSet('CPR partnership proposal'), tokenSet('CPR partnership proposal draft'));
assert.ok(sim >= 0.55, `expected high jaccard, got ${sim}`);

// Flag fallback: semantic ask must not hardcode OS_READ on
const flagsSrc = require('fs').readFileSync(path.join(root, 'lib/simplifi-os/flags.ts'), 'utf8');
assert.doesNotMatch(flagsSrc, /SIMPLIFI_OS_READ\s*=\s*['"]1['"]/);

// Isolation: ask route uses session.slug only
const askRoute = require('fs').readFileSync(path.join(root, 'app/api/simplifi/ask/route.ts'), 'utf8');
assert.match(askRoute, /session\.slug/);
assert.doesNotMatch(askRoute, /portalSlug:\s*body/);

// Keyword fallback module still exported
const askLib = require('fs').readFileSync(path.join(root, 'lib/simplifi-ask.ts'), 'utf8');
assert.match(askLib, /export function answerConversationalAskDetailed/);

// Cron does not embed detector business logic
const cron = require('fs').readFileSync(
  path.join(root, 'app/api/cron/simplifi-intelligence/route.ts'),
  'utf8',
);
assert.match(cron, /runIntelligenceWorkflow/);
assert.doesNotMatch(cron, /detectIntelligenceItems/);

console.log('OK simplifi-os phase1 runtime logic');
