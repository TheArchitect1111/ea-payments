/**
 * Ensures concept review / launch status never exposes preview links that fail
 * a renderability contract (route shape + successful compose for each concept).
 *
 * Run: npx --yes tsx scripts/test-factory-preview-links-must-render.ts
 */
import assert from 'node:assert/strict';
import {
  composeConceptPreviews,
  slimConceptPreviewsPayload,
} from '../lib/factory-concept-previews';
import { buildLaunchConceptStatus } from '../lib/factory-post-build-concepts';
import type { FactoryProject } from '../lib/factory-project-store';
import type { ProjectContext } from '../lib/factory-project-context';

const projectId = 'proj-link-render-1';
const concepts = [
  {
    id: 'workorder-website-p1-concept-a',
    name: 'Concept A',
    rationale: 'A',
    organizationName: 'Render Co',
    story: {
      sentence: 'Clear story.',
      audience: 'Members',
      transformation: 'Clarity',
      proofSignals: ['Proof'],
    },
    website: {
      composition: 'full-bleed threshold hero',
      imageBehavior: 'documentary photography',
      typeBehavior: 'editorial headlines',
      motion: 'slow reveals',
    },
    portal: { composition: 'single next-best-action hero', tone: 'workspace' },
  },
  {
    id: 'workorder-website-p1-concept-b',
    name: 'Concept B',
    rationale: 'B',
    organizationName: 'Render Co',
    story: {
      sentence: 'Clear story.',
      audience: 'Members',
      transformation: 'Clarity',
      proofSignals: ['Proof'],
    },
    website: {
      composition: 'asymmetric editorial lead',
      imageBehavior: 'mixed crops',
      typeBehavior: 'magazine scale',
      motion: 'page turns',
    },
    portal: { composition: 'personal briefing cover', tone: 'journal' },
  },
  {
    id: 'workorder-website-p1-concept-c',
    name: 'Concept C',
    rationale: 'C',
    organizationName: 'Render Co',
    story: {
      sentence: 'Clear story.',
      audience: 'Members',
      transformation: 'Clarity',
      proofSignals: ['Proof'],
    },
    website: {
      composition: 'centered invitation hero',
      imageBehavior: 'still life',
      typeBehavior: 'warm headlines',
      motion: 'soft fades',
    },
    portal: { composition: 'welcome desk', tone: 'concierge' },
  },
];

const composed = composeConceptPreviews({
  projectId,
  portalSlug: 'render-co',
  concepts: concepts as never,
  recommendedConceptId: concepts[0]!.id,
});
assert.equal(composed.previews.length, 3);

const slim = slimConceptPreviewsPayload(composed);
const at = '2026-07-29T15:00:00.000Z';
const context: ProjectContext = {
  schemaVersion: 1,
  projectId,
  pipelineStatus: 'BUILDING',
  createdAt: at,
  updatedAt: at,
  seed: {
    client: 'Render Co',
    goal: 'Website + Portal',
    deliverable: 'Website + Portal',
    notes: 'Distinguishing detail: test subject\nSource: Universal Quick Launch',
    attachments: [],
    source: 'admin',
  },
  artifacts: [
    {
      schemaVersion: 1,
      id: 'art-concepts',
      projectId,
      kind: 'experience_concepts',
      providerId: 'test',
      createdAt: at,
      provenance: {
        capabilityId: 'test',
        sourceType: 'test',
        collectedAt: at,
      },
      data: { concepts },
    },
  ],
  outputs: [
    {
      id: 'out-prev',
      kind: 'production',
      worker: 'concept-previews',
      createdAt: at,
      payload: slim,
    },
    {
      id: 'out-pack',
      kind: 'production',
      worker: 'post-build-concepts',
      createdAt: at,
      payload: { ok: true, sourceConceptsArtifactId: 'art-concepts' },
    },
  ],
};

const project = {
  version: 1,
  id: projectId,
  client: 'Render Co',
  goal: 'Website + Portal',
  deliverable: 'Website + Portal',
  pipelineStatus: 'BUILDING',
  createdAt: at,
  updatedAt: at,
  notes: 'Distinguishing detail: test subject\nSource: Universal Quick Launch',
  attachments: [],
  source: 'admin',
  activity: [],
  context,
} as FactoryProject;

const status = buildLaunchConceptStatus(project);
assert.equal(status.conceptPackReady, true);
assert.equal(status.conceptUrls.length, 3);

for (const link of status.conceptUrls) {
  const website = composed.previews.find((p) => p.conceptId === link.conceptId);
  assert.ok(website, `composed draft missing for advertised concept ${link.conceptId}`);
  assert.ok(website!.puckData?.content?.length, `website puck empty for ${link.conceptId}`);
  assert.ok(website!.portalShell, `portal shell missing for ${link.conceptId}`);

  // Fail if UI would show a link that cannot resolve to a successful compose.
  assert.equal(link.websitePreviewPath, website!.websitePreviewPath);
  assert.equal(link.portalPreviewPath, website!.portalPreviewPath);
}

// Negative contract: incomplete pack must not advertise links
const incomplete = buildLaunchConceptStatus({
  ...project,
  context: { ...context, outputs: [] },
});
assert.equal(incomplete.conceptUrls.length, 0, 'incomplete pack must not show preview links');

console.log('test-factory-preview-links-must-render.ts: ok');
