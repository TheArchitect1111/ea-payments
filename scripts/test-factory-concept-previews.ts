/**
 * Phase 2B — concept → OrganizationStoryInput adapter + composeDirectedWebsite smoke.
 * Run: npx --yes tsx scripts/test-factory-concept-previews.ts
 */
import assert from 'node:assert/strict';
import {
  composeConceptPreviews,
} from '../lib/factory-concept-previews';
import {
  conceptToOrganizationStoryInput,
  detectConceptLens,
  themeIdForConceptLens,
} from '../lib/factory-concept-to-director';
import { puckContainsFeatureCards } from '../lib/layout-composer';
import { runWebsiteDirector } from '../lib/website-director';

const creative = {
  organizationName: 'Amanda Catherine',
  story: {
    sentence: 'Turn your gifts into purpose, impact, and sustainable opportunity.',
    audience: 'Purpose-led creators and wellness seekers',
    transformation: 'From unused gifts to a clear next path.',
    proofSignals: ['Lived mentoring', 'Creative + wellness paths'],
  },
  visualDirection: {
    style: 'editorial, cinematic, human, calm, premium',
    photography: 'documentary realism',
    typography: 'expressive editorial display',
    composition: 'image-led chapters',
    motion: 'slow purposeful reveals',
  },
  homepageStoryBeats: [
    'Who they are',
    'Why they exist',
    'Who they help',
    'Why that matters',
    'What changes',
  ],
  portalContinuity: {
    purpose: 'Continue the public story inside a calm executive workspace',
    firstView: ['where I am', 'what happened', 'what happens next'],
  },
};

const concepts = [
  {
    id: 'wo-1-concept-a',
    name: 'Cinematic Documentary',
    rationale: 'Leads with the human story.',
    organizationName: 'Amanda Catherine',
    story: creative.story,
    website: {
      composition: 'full-bleed threshold hero',
      imageBehavior: 'documentary photography',
      typeBehavior: 'high-contrast editorial headlines',
      motion: 'slow scene reveals',
    },
    portal: {
      composition: 'single next-best-action hero',
      tone: 'concierge workspace',
    },
  },
  {
    id: 'wo-1-concept-b',
    name: 'Editorial Journal',
    rationale: 'Publication-like experience.',
    organizationName: 'Amanda Catherine',
    story: creative.story,
    website: {
      composition: 'asymmetric editorial lead',
      imageBehavior: 'mixed portrait crops',
      typeBehavior: 'magazine scale changes',
      motion: 'measured page turns',
    },
    portal: {
      composition: 'personal briefing cover',
      tone: 'private journal',
    },
  },
  {
    id: 'wo-1-concept-c',
    name: 'Intimate Studio',
    rationale: 'Relationship-first trust.',
    organizationName: 'Amanda Catherine',
    story: creative.story,
    website: {
      composition: 'portrait-led introduction',
      imageBehavior: 'warm environmental portraits',
      typeBehavior: 'elegant display typography',
      motion: 'soft depth',
    },
    portal: {
      composition: 'personal welcome',
      tone: 'private studio',
    },
  },
];

assert.equal(detectConceptLens(concepts[0]!), 'cinematic');
assert.equal(detectConceptLens(concepts[1]!), 'editorial');
assert.equal(detectConceptLens(concepts[2]!), 'intimate');
assert.equal(themeIdForConceptLens('editorial', 'amanda-catherine'), 'amanda-editorial');

const mapped = concepts.map((concept) =>
  conceptToOrganizationStoryInput({
    concept,
    creativeDirection: creative,
    portalSlug: 'amanda-catherine',
    portalLoginHref: 'https://example.com/portal/login',
    sitePath: '/sites/amanda-catherine',
  }),
);

assert.equal(mapped[0]!.organizationName, 'Amanda Catherine');
assert.ok(mapped[0]!.brandVoice?.toLowerCase().includes('cinematic'));
assert.ok(mapped[1]!.brandVoice?.toLowerCase().includes('editorial'));
assert.ok(mapped[2]!.brandVoice?.toLowerCase().includes('intimate'));
assert.notEqual(mapped[0]!.primaryColor, mapped[1]!.primaryColor);

const payload = composeConceptPreviews({
  projectId: 'proj-amanda-test',
  portalSlug: 'amanda-catherine',
  concepts,
  creativeDirection: creative,
  recommendedConceptId: concepts[0]!.id,
  selectionStatus: 'awaiting_review',
});

assert.equal(payload.previews.length, 3);
assert.equal(payload.recommendedConceptId, concepts[0]!.id);
assert.equal(payload.selectionStatus, 'awaiting_review');

const archetypes = new Set(
  mapped.map((org) => runWebsiteDirector(org).classification.primaryArchetype),
);
assert.ok(archetypes.size >= 2, `expected distinct director archetypes, got ${[...archetypes]}`);

const signatures = new Set(payload.previews.map((p) => p.compositionSignature));
assert.ok(signatures.size >= 1, 'expected composition signatures');
assert.equal(new Set(payload.previews.map((p) => p.lens)).size, 3);
assert.equal(new Set(payload.previews.map((p) => p.primaryColor)).size, 3);

for (const preview of payload.previews) {
  assert.ok(preview.puckData?.content, `${preview.name} missing puck content`);
  assert.equal(puckContainsFeatureCards(preview.puckData), false);
  assert.ok(preview.websitePreviewPath.includes('/preview/factory/'));
  assert.ok(preview.portalPreviewPath.endsWith('/portal'));
  assert.ok(preview.portalShell.organizationName);
  assert.ok(preview.portalShell.firstView.length >= 1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      lenses: payload.previews.map((p) => p.lens),
      signatures: [...signatures],
      previewPaths: payload.previews.map((p) => p.websitePreviewPath),
    },
    null,
    2,
  ),
);
