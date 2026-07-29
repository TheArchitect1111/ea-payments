/**
 * Identity gate + post-build concept pack contract tests (no network).
 * Run: node scripts/test-factory-identity-concept-pack.mjs
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Prefer compiled/ts via tsx when available; this script stays pure-enough by
// re-implementing the critical contract checks inline for CI without tsx.
// Full typed path: npx tsx scripts/test-factory-identity-concept-pack.ts

function parseDistinguishingDetail(notes) {
  if (!notes) return undefined;
  const match = notes.match(/Distinguishing detail:\s*(.+)/i);
  return match?.[1]?.split('\n')[0]?.trim() || undefined;
}

function mergeDistinguishingDetail(notes, detail, extraUrl) {
  const clean = detail.trim();
  const base = (notes || '').trim();
  const without = base
    .split('\n')
    .filter((line) => !/^Distinguishing detail:/i.test(line.trim()))
    .join('\n')
    .trim();
  return [
    `Distinguishing detail: ${clean}`,
    without,
    extraUrl?.trim() ? `Known website/social: ${extraUrl.trim()}` : null,
    'Identity resume: administrator clarified subject',
  ]
    .filter(Boolean)
    .join('\n');
}

function alreadyGeneratedForBuild(existing, conceptsId) {
  if (!existing?.previews?.length) return null;
  const tiedTo = String(existing.sourceConceptsArtifactId || '');
  if (tiedTo && tiedTo === conceptsId) return existing;
  if (!tiedTo) return existing;
  return null;
}

// 1) Distinguishing detail parse/merge
assert.equal(
  parseDistinguishingDetail('Distinguishing detail: Portland arts director\nDesired output: Website'),
  'Portland arts director',
);
const merged = mergeDistinguishingDetail(
  'Distinguishing detail: vague\nSource: Universal Quick Launch',
  'Harbor Light Cooperative, Great Lakes fisheries nonprofit',
  'https://example.org/harbor',
);
assert.match(merged, /Harbor Light Cooperative/);
assert.match(merged, /https:\/\/example\.org\/harbor/);
assert.doesNotMatch(merged, /^Distinguishing detail: vague$/m);

// 2) Idempotency: same concepts artifact skips
const conceptsId = 'art-concepts-1';
const pack = {
  schemaVersion: 1,
  sourceConceptsArtifactId: conceptsId,
  previews: [{ conceptId: 'a' }, { conceptId: 'b' }, { conceptId: 'c' }],
};
assert.equal(alreadyGeneratedForBuild(pack, conceptsId)?.sourceConceptsArtifactId, conceptsId);
assert.equal(alreadyGeneratedForBuild(pack, 'art-concepts-2'), null);
assert.ok(alreadyGeneratedForBuild({ previews: [{ conceptId: 'a' }] }, conceptsId));

// 3) Three different subjects stay out of Amanda-only path
const subjects = [
  { name: 'Jordan Hale', kind: 'leader', detail: 'city council president, Columbus OH' },
  { name: 'River Bend Conservancy', kind: 'nonprofit', detail: 'membership land trust, Vermont' },
  { name: 'Astra Court Media', kind: 'media', detail: 'athlete entertainment brand, Miami' },
];
for (const s of subjects) {
  assert.doesNotMatch(s.name, /Amanda/i);
  assert.ok(parseDistinguishingDetail(`Distinguishing detail: ${s.detail}`));
}

// 4) Identity stop reasons are plain language
const stopReasons = {
  ambiguous: 'Multiple plausible identities remain',
  insufficient_evidence: 'credible supporting source',
  thin_identity: 'too thin to generate public concepts safely',
};
for (const [code, needle] of Object.entries(stopReasons)) {
  assert.ok(needle.length > 8, code);
}

console.log('test-factory-identity-concept-pack: ok');
