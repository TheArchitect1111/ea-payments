/**
 * Durable concept preview contracts:
 * - slim persist omits fat puck blobs
 * - launch status withholds links until pack/previews ready
 * - recompose path uses experience_concepts (cross-instance)
 * - preview link targets must match durable preview routes
 *
 * Run: npx --yes tsx scripts/test-factory-durable-concept-previews.ts
 */
import assert from 'node:assert/strict';
import {
  composeConceptPreviews,
  slimConceptPreviewsPayload,
} from '../lib/factory-concept-previews';
import {
  buildLaunchConceptStatus,
  shouldRunPostBuildConceptPack,
} from '../lib/factory-post-build-concepts';
import type { FactoryProject } from '../lib/factory-project-store';
import type { ProjectContext } from '../lib/factory-project-context';

const creative = {
  organizationName: 'Harbor Light Cooperative',
  story: {
    sentence: 'Member-owned fisheries with a clear next path.',
    audience: 'Great Lakes fishing communities',
    transformation: 'From scattered outreach to one member home.',
    proofSignals: ['Co-op charter', 'Seasonal harvests'],
  },
  visualDirection: {
    style: 'editorial, coastal, calm',
    photography: 'documentary realism',
    typography: 'expressive editorial display',
    composition: 'image-led chapters',
    motion: 'slow purposeful reveals',
  },
  homepageStoryBeats: ['Who', 'Why', 'Who we help', 'What changes'],
  portalContinuity: {
    purpose: 'Continue the public story inside the member workspace',
    firstView: ['where I am', 'what happened', 'what happens next'],
  },
};

const concepts = [
  {
    id: 'workorder-website-p1-concept-a',
    name: 'Coastal Documentary',
    rationale: 'Leads with place and people.',
    organizationName: 'Harbor Light Cooperative',
    story: creative.story,
    website: {
      composition: 'full-bleed threshold hero',
      imageBehavior: 'documentary photography',
      typeBehavior: 'high-contrast editorial headlines',
      motion: 'slow scene reveals',
    },
    portal: { composition: 'single next-best-action hero', tone: 'member workspace' },
  },
  {
    id: 'workorder-website-p1-concept-b',
    name: 'Harbor Journal',
    rationale: 'Publication-like experience.',
    organizationName: 'Harbor Light Cooperative',
    story: creative.story,
    website: {
      composition: 'asymmetric editorial lead',
      imageBehavior: 'mixed portrait crops',
      typeBehavior: 'magazine scale changes',
      motion: 'measured page turns',
    },
    portal: { composition: 'personal briefing cover', tone: 'private journal' },
  },
  {
    id: 'workorder-website-p1-concept-c',
    name: 'Member Threshold',
    rationale: 'Clear invitation into membership.',
    organizationName: 'Harbor Light Cooperative',
    story: creative.story,
    website: {
      composition: 'centered invitation hero',
      imageBehavior: 'quiet environmental stills',
      typeBehavior: 'warm conversational headlines',
      motion: 'soft fades',
    },
    portal: { composition: 'welcome desk', tone: 'concierge' },
  },
];

const composed = composeConceptPreviews({
  projectId: 'proj-durable-test',
  portalSlug: 'harbor-light-durable',
  concepts: concepts as never,
  creativeDirection: creative as never,
  recommendedConceptId: concepts[0]!.id,
  selectionStatus: 'awaiting_selection',
});

assert.equal(composed.previews.length, 3);
for (const preview of composed.previews) {
  assert.ok(preview.puckData, `puckData for ${preview.conceptId}`);
  assert.ok(preview.portalShell, `portalShell for ${preview.conceptId}`);
  assert.match(
    preview.websitePreviewPath,
    new RegExp(`/preview/factory/proj-durable-test/${preview.conceptId}$`),
  );
  assert.match(
    preview.portalPreviewPath,
    new RegExp(`/preview/factory/proj-durable-test/${preview.conceptId}/portal$`),
  );
}

const slim = slimConceptPreviewsPayload(composed);
const slimPreviews = slim.previews as Array<Record<string, unknown>>;
assert.equal(slimPreviews.length, 3);
for (const row of slimPreviews) {
  assert.equal('puckData' in row, false, 'slim must omit puckData');
  assert.equal('websiteSite' in row, false, 'slim must omit websiteSite');
  assert.ok(row.portalShell, 'slim keeps portalShell');
  assert.ok(row.websitePreviewPath);
  assert.ok(row.portalPreviewPath);
}

function art(id: string, kind: string, data: Record<string, unknown>) {
  return {
    schemaVersion: 1 as const,
    id,
    projectId: 'proj-durable-test',
    kind,
    providerId: 'test',
    createdAt: '2026-07-29T12:00:00.000Z',
    provenance: {
      capabilityId: 'test',
      sourceType: 'test',
      collectedAt: '2026-07-29T12:00:00.000Z',
    },
    data,
  };
}

function baseContext(overrides: Partial<ProjectContext> = {}): ProjectContext {
  const at = '2026-07-29T12:00:00.000Z';
  return {
    schemaVersion: 1,
    projectId: 'proj-durable-test',
    pipelineStatus: 'BUILDING',
    createdAt: at,
    updatedAt: at,
    seed: {
      client: 'Harbor Light Cooperative',
      goal: 'Website + Portal',
      deliverable: 'Website + Portal',
      notes: 'Distinguishing detail: Great Lakes fisheries co-op\nSource: Universal Quick Launch',
      url: 'https://example.com/harbor-light',
      attachments: [],
      source: 'admin',
    },
    artifacts: [
      art('art-concepts-1', 'experience_concepts', {
        concepts,
        recommendedConceptId: concepts[0]!.id,
      }),
      art('art-direction-1', 'creative_direction', creative),
    ],
    outputs: [],
    ...overrides,
  };
}

function baseProject(overrides: Partial<FactoryProject> = {}): FactoryProject {
  const at = '2026-07-29T12:00:00.000Z';
  return {
    version: 1,
    id: 'proj-durable-test',
    client: 'Harbor Light Cooperative',
    goal: 'Website + Portal',
    deliverable: 'Website + Portal',
    pipelineStatus: 'BUILDING',
    createdAt: at,
    updatedAt: at,
    notes:
      'Distinguishing detail: Great Lakes fisheries co-op\nSource: Universal Quick Launch',
    url: 'https://example.com/harbor-light',
    attachments: [],
    source: 'admin',
    activity: [
      { at, to: 'QUEUED', worker: 'queue' },
      { at: '2026-07-29T12:00:10.000Z', to: 'RESEARCHING', worker: 'research' },
      { at: '2026-07-29T12:01:10.000Z', to: 'BUILDING', worker: 'production' },
    ],
    context: baseContext(),
    ...overrides,
  } as FactoryProject;
}

// Before pack: no preview links advertised
const beforePack = buildLaunchConceptStatus(baseProject());
assert.equal(beforePack.conceptPackReady, false);
assert.equal(beforePack.conceptUrls.length, 0);
assert.equal(beforePack.needsAutomaticNudge, true);
assert.equal(beforePack.plainLanguageStage, 'Preparing previews');
assert.equal(shouldRunPostBuildConceptPack(baseProject()), true);
assert.ok(Object.keys(beforePack.stageDurationsMs).length >= 1);

// After slim persist + pack ok: links available
const afterPack = buildLaunchConceptStatus(
  baseProject({
    context: baseContext({
      outputs: [
        {
          id: 'out-prev',
          kind: 'production',
          worker: 'concept-previews',
          createdAt: '2026-07-29T12:02:00.000Z',
          payload: slim,
        },
        {
          id: 'out-pack',
          kind: 'production',
          worker: 'post-build-concepts',
          createdAt: '2026-07-29T12:03:00.000Z',
          payload: {
            ok: true,
            sourceConceptsArtifactId: 'art-concepts-1',
          },
        },
      ],
    }),
  }),
);
assert.equal(afterPack.conceptPackReady, true);
assert.equal(afterPack.conceptUrls.length, 3);
assert.equal(afterPack.needsAutomaticNudge, false);
assert.equal(
  shouldRunPostBuildConceptPack(
    baseProject({
      context: baseContext({
        outputs: [
          {
            id: 'out-prev',
            kind: 'production',
            worker: 'concept-previews',
            createdAt: '2026-07-29T12:02:00.000Z',
            payload: slim,
          },
          {
            id: 'out-pack',
            kind: 'production',
            worker: 'post-build-concepts',
            createdAt: '2026-07-29T12:03:00.000Z',
            payload: { ok: true, sourceConceptsArtifactId: 'art-concepts-1' },
          },
        ],
      }),
    }),
  ),
  false,
);

// Auto-retry: first failure still allows nudge; second blocks
const oneFail = baseProject({
  context: baseContext({
    outputs: [
      {
        id: 'fail-1',
        kind: 'production',
        worker: 'post-build-concepts',
        createdAt: '2026-07-29T12:02:00.000Z',
        payload: {
          ok: false,
          error: 'transient',
          sourceConceptsArtifactId: 'art-concepts-1',
        },
      },
    ],
  }),
});
assert.equal(shouldRunPostBuildConceptPack(oneFail), true);

const twoFail = baseProject({
  context: baseContext({
    outputs: [
      {
        id: 'fail-1',
        kind: 'production',
        worker: 'post-build-concepts',
        createdAt: '2026-07-29T12:02:00.000Z',
        payload: {
          ok: false,
          error: 'transient',
          sourceConceptsArtifactId: 'art-concepts-1',
        },
      },
      {
        id: 'fail-2',
        kind: 'production',
        worker: 'post-build-concepts',
        createdAt: '2026-07-29T12:03:00.000Z',
        payload: {
          ok: false,
          error: 'still failing',
          sourceConceptsArtifactId: 'art-concepts-1',
        },
      },
    ],
  }),
});
assert.equal(shouldRunPostBuildConceptPack(twoFail), false);

/**
 * Contract: concept screen must never advertise a preview path that is not a
 * successful Factory preview route shape (and must include project + concept ids).
 */
function assertPreviewLinkRenderable(path: string, projectId: string, conceptId: string) {
  assert.match(path, /^\/preview\/factory\//);
  assert.ok(path.includes(encodeURIComponent(projectId)) || path.includes(projectId));
  assert.ok(path.includes(encodeURIComponent(conceptId)) || path.includes(conceptId));
  assert.doesNotMatch(path, /undefined|null|\[object/i);
}

for (const row of afterPack.conceptUrls) {
  assertPreviewLinkRenderable(row.websitePreviewPath, 'proj-durable-test', row.conceptId);
  assertPreviewLinkRenderable(row.portalPreviewPath, 'proj-durable-test', row.conceptId);
}

console.log('test-factory-durable-concept-previews.ts: ok');
