/**
 * One-page Quick Launch review payload contracts.
 * Run: npx --yes tsx scripts/test-factory-quick-launch-review.ts
 */
import assert from 'node:assert/strict';
import { buildQuickLaunchReview } from '../lib/factory-quick-launch-review';
import type { FactoryProject } from '../lib/factory-project-store';
import type { ProjectContext } from '../lib/factory-project-context';

const at = '2026-07-29T16:00:00.000Z';
const projectId = 'proj-review-1';

const context: ProjectContext = {
  schemaVersion: 1,
  projectId,
  pipelineStatus: 'BUILDING',
  createdAt: at,
  updatedAt: at,
  seed: {
    client: 'Harbor Light Cooperative',
    goal: 'Website + Portal',
    deliverable: 'Website + Portal',
    notes: 'Distinguishing detail: Great Lakes fisheries\nSource: Universal Quick Launch',
    url: 'https://harborlight.example',
    attachments: [],
    source: 'admin',
  },
  artifacts: [
    {
      schemaVersion: 1,
      id: 'art-web',
      projectId,
      kind: 'website',
      providerId: 'website',
      createdAt: at,
      provenance: { capabilityId: 'research', sourceType: 'website', collectedAt: at },
      data: {
        url: 'https://harborlight.example',
        extracted: { title: 'Harbor Light', textPreview: 'Member-owned fisheries.' },
      },
    },
    {
      schemaVersion: 1,
      id: 'art-brand',
      projectId,
      kind: 'branding',
      providerId: 'branding',
      createdAt: at,
      provenance: { capabilityId: 'research', sourceType: 'website', collectedAt: at },
      data: { visionSummary: 'Coastal calm brand', whatTheyDo: 'Fisheries co-op' },
    },
    {
      schemaVersion: 1,
      id: 'art-dir',
      projectId,
      kind: 'creative_direction',
      providerId: 'planning',
      createdAt: at,
      provenance: { capabilityId: 'planning', sourceType: 'derived', collectedAt: at },
      data: {
        organizationName: 'Harbor Light Cooperative',
        story: {
          sentence: 'Member-owned fisheries with a clear next path.',
          audience: 'Great Lakes communities',
          transformation: 'From scattered outreach to one home.',
        },
        visualDirection: {
          style: 'editorial coastal',
          photography: 'documentary',
          typography: 'editorial',
          composition: 'image-led',
          motion: 'slow',
        },
        homepageStoryBeats: ['Who', 'Why', 'Invite'],
        portalContinuity: { purpose: 'Member workspace continuity' },
      },
    },
    {
      schemaVersion: 1,
      id: 'art-concepts',
      projectId,
      kind: 'experience_concepts',
      providerId: 'production',
      createdAt: at,
      provenance: { capabilityId: 'production', sourceType: 'derived', collectedAt: at },
      data: {
        recommendedConceptId: 'c-a',
        concepts: [
          {
            id: 'c-a',
            name: 'Coastal Documentary',
            rationale: 'Leads with place and people.',
            story: { sentence: 'Harbor first.' },
            website: { composition: 'full-bleed threshold hero' },
          },
          {
            id: 'c-b',
            name: 'Harbor Journal',
            rationale: 'Publication-like experience.',
            story: { sentence: 'Editorial chapters.' },
            website: { composition: 'asymmetric editorial lead' },
          },
          {
            id: 'c-c',
            name: 'Member Threshold',
            rationale: 'Clear invitation into membership.',
            story: { sentence: 'Belonging first.' },
            website: { composition: 'centered invitation hero' },
          },
        ],
      },
    },
  ],
  outputs: [
    {
      id: 'out-prev',
      kind: 'production',
      worker: 'concept-previews',
      createdAt: at,
      payload: {
        schemaVersion: 1,
        projectId,
        portalSlug: 'harbor-light',
        recommendedConceptId: 'c-a',
        selectedConceptId: null,
        selectionStatus: 'awaiting_review',
        previews: [
          {
            conceptId: 'c-a',
            name: 'Coastal Documentary',
            lens: 'cinematic',
            recommended: true,
            websitePreviewPath: `/preview/factory/${projectId}/c-a`,
            portalPreviewPath: `/preview/factory/${projectId}/c-a/portal`,
            compositionSignature: 'sig-a',
            primaryColor: '#0B1F33',
            accentColor: '#C4A35A',
          },
          {
            conceptId: 'c-b',
            name: 'Harbor Journal',
            lens: 'editorial',
            recommended: false,
            websitePreviewPath: `/preview/factory/${projectId}/c-b`,
            portalPreviewPath: `/preview/factory/${projectId}/c-b/portal`,
            compositionSignature: 'sig-b',
            primaryColor: '#17130F',
            accentColor: '#B9894D',
          },
          {
            conceptId: 'c-c',
            name: 'Member Threshold',
            lens: 'intimate',
            recommended: false,
            websitePreviewPath: `/preview/factory/${projectId}/c-c`,
            portalPreviewPath: `/preview/factory/${projectId}/c-c/portal`,
            compositionSignature: 'sig-c',
            primaryColor: '#1B2B4D',
            accentColor: '#D9CFC1',
          },
        ],
      },
    },
  ],
};

const project = {
  version: 1,
  id: projectId,
  client: 'Harbor Light Cooperative',
  goal: 'Website + Portal',
  deliverable: 'Website + Portal',
  pipelineStatus: 'BUILDING',
  createdAt: at,
  updatedAt: at,
  notes: 'Distinguishing detail: Great Lakes fisheries\nSource: Universal Quick Launch',
  url: 'https://harborlight.example',
  attachments: [],
  source: 'admin',
  activity: [],
  context,
} as FactoryProject;

async function main() {
  const review = await buildQuickLaunchReview(project, { verifyPreviews: false });
  assert.equal(review.packageReady, true);
  assert.ok(review.packageSections.some((s) => s.id === 'content-package'));
  assert.ok(review.packageSections.some((s) => s.id === 'verified-profile'));
  assert.ok(review.packageSections.some((s) => s.id === 'creative-brief'));
  assert.ok(review.packageSections.some((s) => s.id === 'content-copy'));
  assert.equal(review.qualityBlocked, false, review.qualityReasons.join('; '));
  assert.equal(review.concepts.length, 3);
  assert.equal(review.concepts[0]?.recommended, true);
  assert.notEqual(
    review.concepts[0]?.compositionSignature,
    review.concepts[1]?.compositionSignature,
  );

  console.log('test-factory-quick-launch-review.ts: ok');
}

void main();
