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
  contentPackage: {
    schemaVersion: 1,
    generatedAt: '2026-07-29T15:00:00.000Z',
    projectId,
    name: 'Render Co',
    positioning: 'Render Co helps members move with clarity.',
    centralStory: 'Render Co is a researched subject with a clear public story for members.',
    biography:
      'Render Co was founded to serve members with clarity, proof, and a trusted next step in their work.',
    milestones: ['Founded to serve members', 'Built a public story'],
    accomplishments: ['Delivered clarity for members', 'Published proof in public'],
    currentWork: ['Guiding members through a clear next conversation'],
    organizations: ['Render Co'],
    audience: 'Members seeking a clear next step',
    callsToAction: ['Begin'],
    mediaPlan: {
      strategy: 'Temporary preview media until licensed assets are approved.',
      items: [{ label: 'Primary image', status: 'temporary_preview_media' }],
    },
    claims: [
      { text: 'Render Co serves members with clarity.', status: 'admin_clarification' },
      { text: 'Render Co publishes proof in public.', status: 'admin_clarification' },
      { text: 'Render Co guides a trusted next step.', status: 'admin_clarification' },
    ],
    sources: [
      { url: 'https://example.com/render-co' },
      { url: 'https://example.com/about' },
    ],
    lenses: {
      cinematic: {
        heroHeadline: 'Render Co: a story still being written',
        heroSupporting: 'Render Co serves members with clarity.',
        aboutTitle: 'Who Render Co is',
        aboutBody:
          'Render Co was founded to serve members with clarity, proof, and a trusted next step in their work.',
        sectionHeadlines: ['Path', 'Work', 'Proof', 'Next'],
        sectionBodies: [
          'Founded to serve members',
          'Built a public story',
          'Delivered clarity for members',
          'Guiding members through a clear next conversation',
        ],
        ctaLabel: 'Continue',
        portalPurpose: 'Continue the relationship after the public story.',
      },
      editorial: {
        heroHeadline: 'A profile of Render Co',
        heroSupporting: 'Render Co publishes proof in public.',
        aboutTitle: 'Selected chapters',
        aboutBody: 'Render Co is a researched subject with a clear public story for members.',
        sectionHeadlines: ['Expertise', 'Orgs', 'Evidence', 'Now'],
        sectionBodies: [
          'Render Co was founded to serve members with clarity.',
          'Render Co',
          'Published proof in public',
          'Guiding members through a clear next conversation',
        ],
        ctaLabel: 'Read on',
        portalPurpose: 'Private briefing continuity.',
      },
      intimate: {
        heroHeadline: 'Meet Render Co',
        heroSupporting: 'Render Co guides a trusted next step.',
        aboutTitle: 'A direct introduction',
        aboutBody:
          'Render Co was founded to serve members with clarity, proof, and a trusted next step in their work.',
        sectionHeadlines: ['Matters', 'Feel', 'For', 'Begin'],
        sectionBodies: [
          'Render Co is a researched subject with a clear public story for members.',
          'Delivered clarity for members',
          'Members seeking a clear next step',
          'One honest next step.',
        ],
        ctaLabel: 'Start',
        portalPurpose: 'Trusted companion workspace.',
      },
    },
    quality: { factCount: 3, sourceCount: 2, ready: true, missing: [] },
  },
  recommendedConceptId: concepts[0]!.id,
});
assert.equal(composed.previews.length, 3);

for (const preview of composed.previews) {
  const blob = JSON.stringify(preview.puckData);
  assert.ok(!blob.includes('/sites/'), 'preview must not link unpublished /sites routes');
  assert.ok(
    blob.includes('Return to concepts') || blob.includes('quick-launch'),
    'preview must offer return-to-concepts',
  );
}

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
      id: 'out-content',
      kind: 'production',
      worker: 'content-package',
      createdAt: at,
      payload: {
        schemaVersion: 1,
        generatedAt: at,
        projectId,
        name: 'Render Co',
        positioning: 'Render Co helps members move with clarity.',
        centralStory: 'Render Co is a researched subject with a clear public story for members.',
        biography:
          'Render Co was founded to serve members with clarity, proof, and a trusted next step in their work.',
        milestones: ['Founded to serve members'],
        accomplishments: ['Delivered clarity for members'],
        currentWork: ['Guiding members'],
        organizations: ['Render Co'],
        audience: 'Members seeking a clear next step',
        callsToAction: ['Begin'],
        mediaPlan: {
          strategy: 'Temporary preview media',
          items: [{ label: 'Primary', status: 'temporary_preview_media' }],
        },
        claims: [
          { text: 'Render Co serves members with clarity.', status: 'admin_clarification' },
          { text: 'Render Co publishes proof in public.', status: 'admin_clarification' },
          { text: 'Render Co guides a trusted next step.', status: 'admin_clarification' },
        ],
        sources: [
          { url: 'https://example.com/render-co' },
          { url: 'https://example.com/about' },
        ],
        lenses: composed.previews[0]
          ? {
              cinematic: {
                heroHeadline: 'Render Co: a story still being written',
                heroSupporting: 'Render Co serves members with clarity.',
                aboutTitle: 'Who',
                aboutBody:
                  'Render Co was founded to serve members with clarity, proof, and a trusted next step in their work.',
                sectionHeadlines: ['A', 'B', 'C'],
                sectionBodies: ['A body', 'B body', 'C body'],
                ctaLabel: 'Continue',
                portalPurpose: 'Continue.',
              },
              editorial: {
                heroHeadline: 'A profile of Render Co',
                heroSupporting: 'Render Co publishes proof in public.',
                aboutTitle: 'Chapters',
                aboutBody: 'Render Co is a researched subject with a clear public story for members.',
                sectionHeadlines: ['A', 'B', 'C'],
                sectionBodies: ['A body', 'B body', 'C body'],
                ctaLabel: 'Read',
                portalPurpose: 'Briefing.',
              },
              intimate: {
                heroHeadline: 'Meet Render Co',
                heroSupporting: 'Render Co guides a trusted next step.',
                aboutTitle: 'Intro',
                aboutBody:
                  'Render Co was founded to serve members with clarity, proof, and a trusted next step in their work.',
                sectionHeadlines: ['A', 'B', 'C'],
                sectionBodies: ['A body', 'B body', 'C body'],
                ctaLabel: 'Start',
                portalPurpose: 'Companion.',
              },
            }
          : undefined,
        quality: { factCount: 3, sourceCount: 2, ready: true, missing: [] },
      },
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
  notes: 'Distinguishing detail: Render Co serves members with clarity, proof, and a trusted next step\nSource: Universal Quick Launch',
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
