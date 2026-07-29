/**
 * Content package + quality gate + forbidden public copy contracts.
 * Run: npx --yes tsx scripts/test-factory-content-quality-gate.ts
 */
import assert from 'node:assert/strict';
import {
  containsForbiddenPublicCopy,
  findForbiddenPublicCopy,
  scrubForbiddenPublicCopy,
} from '../lib/factory-forbidden-copy.mjs';
import { buildContentPackageFromContext } from '../lib/factory-content-package';
import { evaluateConceptQualityGate } from '../lib/factory-concept-quality-gate';
import { composeConceptPreviews } from '../lib/factory-concept-previews';
import type { ProjectContext } from '../lib/factory-project-context';

assert.equal(containsForbiddenPublicCopy('Research the subject and produce a matched website'), true);
assert.equal(
  containsForbiddenPublicCopy('Acme exists to help the people it serves move forward.'),
  true,
);
assert.equal(containsForbiddenPublicCopy('workorder-website-abc'), true);
assert.equal(scrubForbiddenPublicCopy('Research the subject and produce a matched website'), undefined);
assert.equal(
  scrubForbiddenPublicCopy('Robert Brickey founded Efficiency Architects in Charlotte.'),
  'Robert Brickey founded Efficiency Architects in Charlotte.',
);

const notes =
  'Distinguishing detail: Former Duke basketball captain and founder of Efficiency Architects in Charlotte, North Carolina\nSource: Universal Quick Launch';

const pack = buildContentPackageFromContext(
  'proj-ms6046mq-efc59b',
  'Robert Brickey',
  notes,
  null,
);

assert.ok(pack.quality.factCount >= 3, 'clarification must yield ≥3 facts');
assert.ok(pack.biography.length >= 40, 'biography must be substantive');
assert.ok(!containsForbiddenPublicCopy(pack.centralStory), 'central story must be clean');
assert.ok(!containsForbiddenPublicCopy(pack.lenses.cinematic.heroHeadline));
assert.notEqual(
  pack.lenses.cinematic.heroHeadline,
  pack.lenses.editorial.heroHeadline,
  'concepts must not share the same headline',
);
assert.notEqual(
  pack.lenses.cinematic.heroSupporting,
  pack.lenses.intimate.heroSupporting,
  'concepts must not share the same supporting copy when evidence allows',
);
assert.match(pack.biography, /Duke|Efficiency Architects|Charlotte/i);

const concepts = [
  {
    id: 'wo-brickey-concept-a',
    name: 'Cinematic Documentary',
    rationale: 'Human story first.',
    organizationName: 'Robert Brickey',
    website: {
      composition: 'full-bleed threshold hero',
      imageBehavior: 'documentary',
      typeBehavior: 'editorial',
      motion: 'slow',
    },
    portal: { composition: 'next-best-action', tone: 'concierge' },
  },
  {
    id: 'wo-brickey-concept-b',
    name: 'Editorial Journal',
    rationale: 'Publication profile.',
    organizationName: 'Robert Brickey',
    website: {
      composition: 'asymmetric editorial lead',
      imageBehavior: 'mixed',
      typeBehavior: 'magazine',
      motion: 'page turns',
    },
    portal: { composition: 'briefing', tone: 'journal' },
  },
  {
    id: 'wo-brickey-concept-c',
    name: 'Intimate Studio',
    rationale: 'Relationship first.',
    organizationName: 'Robert Brickey',
    website: {
      composition: 'portrait-led',
      imageBehavior: 'warm',
      typeBehavior: 'elegant',
      motion: 'soft',
    },
    portal: { composition: 'welcome', tone: 'studio' },
  },
];

const composed = composeConceptPreviews({
  projectId: 'proj-ms6046mq-efc59b',
  portalSlug: 'robert-brickey-efc59b',
  concepts: concepts as never,
  contentPackage: pack,
  recommendedConceptId: concepts[0]!.id,
});

assert.equal(composed.previews.length, 3);

for (const preview of composed.previews) {
  const blob = JSON.stringify(preview.puckData);
  assert.equal(containsForbiddenPublicCopy('Research the subject'), true);
  assert.ok(!blob.includes('Research the subject'), `forbidden research prompt in ${preview.name}`);
  assert.ok(!blob.includes('produce a matched website'), `forbidden goal in ${preview.name}`);
  assert.ok(!blob.includes('exists to help the people it serves'), `forbidden slogan in ${preview.name}`);
  assert.ok(!blob.includes('/sites/'), `unpublished /sites link in ${preview.name}`);
  assert.ok(blob.includes('Return to concepts') || blob.includes('quick-launch'), `return CTA missing in ${preview.name}`);
  assert.ok(preview.websitePreviewPath.includes('/preview/factory/'));
  assert.ok(preview.portalPreviewPath.includes('/portal'));
  assert.match(blob, /Duke|Efficiency Architects|Charlotte|Robert Brickey/i);
}

const gate = evaluateConceptQualityGate({ contentPackage: pack, previews: composed });
assert.equal(gate.ok, true, gate.ok ? '' : gate.reasons.join('; '));

const thin = buildContentPackageFromContext('proj-thin', 'Someone', 'Source: Universal Quick Launch', null);
const thinGate = evaluateConceptQualityGate({ contentPackage: thin, previews: null });
assert.equal(thinGate.ok, false, 'thin package must not be Ready for review');

const forbiddenScan = findForbiddenPublicCopy({
  a: 'Research the subject and produce a matched website and portal experience',
});
assert.equal(forbiddenScan.ok, false);

// Planning creative_direction must not emit the slogan (smoke via scrub).
assert.equal(
  scrubForbiddenPublicCopy('Render Co exists to help the people it serves move forward.'),
  undefined,
);

void (null as unknown as ProjectContext);

console.log('test-factory-content-quality-gate.ts: ok');
