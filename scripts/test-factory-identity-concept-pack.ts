/**
 * Typed identity gate + launch status tests.
 * Run: npx --yes tsx scripts/test-factory-identity-concept-pack.ts
 */
import assert from 'node:assert/strict';
import { evaluateIdentityGate, mergeDistinguishingDetail } from '../lib/factory-identity-gate';
import { buildLaunchConceptStatus } from '../lib/factory-post-build-concepts';
import type { FactoryProject } from '../lib/factory-project-store';
import type { ProjectContext } from '../lib/factory-project-context';

function art(
  id: string,
  kind: string,
  data: Record<string, unknown>,
  provenance: Record<string, unknown> = {},
) {
  return {
    schemaVersion: 1,
    id,
    projectId: 'proj-test-1',
    kind,
    providerId: 'test',
    createdAt: '2026-07-29T12:00:00.000Z',
    provenance: {
      capabilityId: 'test',
      sourceType: 'test',
      collectedAt: '2026-07-29T12:00:00.000Z',
      ...provenance,
    },
    data,
  };
}

function baseContext(overrides: Partial<ProjectContext> = {}): ProjectContext {
  const at = '2026-07-29T12:00:00.000Z';
  return {
    schemaVersion: 1,
    projectId: 'proj-test-1',
    pipelineStatus: 'BUILDING',
    createdAt: at,
    updatedAt: at,
    seed: {
      client: 'Jordan Hale',
      goal: 'Website + Portal',
      deliverable: 'Website + Portal',
      notes: 'Distinguishing detail: city council president, Columbus OH',
      url: 'https://example.com/jordan-hale',
      attachments: [],
      source: 'admin',
    },
    artifacts: [
      art(
        'art-web-1',
        'website',
        {
          url: 'https://example.com/jordan-hale',
          extracted: {
            title: 'Jordan Hale | City Council',
            textPreview: 'Community leadership in Columbus.',
          },
        },
        { sourceUrl: 'https://example.com/jordan-hale' },
      ),
      art('art-concepts-1', 'experience_concepts', {
        concepts: [
          { id: 'c1', name: 'A' },
          { id: 'c2', name: 'B' },
          { id: 'c3', name: 'C' },
        ],
      }),
    ],
    outputs: [],
    ...overrides,
  };
}

function baseProject(overrides: Partial<FactoryProject> = {}): FactoryProject {
  const at = '2026-07-29T12:00:00.000Z';
  return {
    version: 1,
    id: 'proj-test-1',
    client: 'Jordan Hale',
    goal: 'Website + Portal',
    deliverable: 'Website + Portal',
    pipelineStatus: 'BUILDING',
    createdAt: at,
    updatedAt: at,
    notes:
      'Distinguishing detail: city council president, Columbus OH\nSource: Universal Quick Launch',
    url: 'https://example.com/jordan-hale',
    attachments: [],
    source: 'admin',
    activity: [],
    context: baseContext(),
    ...overrides,
  } as FactoryProject;
}

const pass = evaluateIdentityGate(baseProject());
assert.equal(pass.ok, true);
if (pass.ok) {
  assert.ok(pass.sources.length >= 1);
  assert.ok(pass.claims.some((c) => c.status === 'verified' || c.status === 'inferred'));
}

const thin = evaluateIdentityGate(
  baseProject({
    url: undefined,
    notes: 'Source: Universal Quick Launch',
    context: baseContext({
      seed: {
        client: 'Nobody',
        goal: 'Website',
        deliverable: 'Website',
        notes: '',
        attachments: [],
        source: 'admin',
      },
      artifacts: [],
      outputs: [],
    }),
  }),
);
assert.equal(thin.ok, false);
if (!thin.ok) {
  assert.ok(['thin_identity', 'insufficient_evidence'].includes(thin.code));
  assert.match(thin.resumeHint, /detail|URL/i);
}

const ambiguous = evaluateIdentityGate(
  baseProject({
    url: undefined,
    notes: 'Source: Universal Quick Launch',
    context: baseContext({
      seed: {
        client: 'Jordan Hale',
        goal: 'Website',
        deliverable: 'Website',
        notes: '',
        attachments: [],
        source: 'admin',
      },
      artifacts: [
        art('art-brand', 'branding', {
          identityCandidates: [
            { name: 'Jordan Hale (Ohio)' },
            { name: 'Jordan Hale (Texas coach)' },
            { name: 'J. Hale Consulting' },
          ],
        }),
      ],
      outputs: [],
    }),
  }),
);
assert.equal(ambiguous.ok, false);
if (!ambiguous.ok) {
  assert.equal(ambiguous.code, 'ambiguous');
  assert.match(ambiguous.reason, /Multiple plausible identities/i);
}

const resumedNotes = mergeDistinguishingDetail(
  'Distinguishing detail: vague\nSource: Universal Quick Launch',
  'Columbus city council president',
  'https://columbus.gov/hale',
);
assert.match(resumedNotes, /Columbus city council/);

const ready = buildLaunchConceptStatus(
  baseProject({
    context: baseContext({
      outputs: [
        {
          id: 'out-id',
          kind: 'research',
          worker: 'identity-gate',
          createdAt: '2026-07-29T12:01:00.000Z',
          payload: { ok: true, code: 'passed' },
        },
        {
          id: 'out-prev',
          kind: 'production',
          worker: 'concept-previews',
          createdAt: '2026-07-29T12:02:00.000Z',
          payload: {
            schemaVersion: 1,
            sourceConceptsArtifactId: 'art-concepts-1',
            previews: [
              {
                conceptId: 'c1',
                name: 'A',
                websitePreviewPath: '/preview/factory/proj-test-1/c1',
                portalPreviewPath: '/preview/factory/proj-test-1/c1/portal',
              },
              {
                conceptId: 'c2',
                name: 'B',
                websitePreviewPath: '/preview/factory/proj-test-1/c2',
                portalPreviewPath: '/preview/factory/proj-test-1/c2/portal',
              },
              {
                conceptId: 'c3',
                name: 'C',
                websitePreviewPath: '/preview/factory/proj-test-1/c3',
                portalPreviewPath: '/preview/factory/proj-test-1/c3/portal',
              },
            ],
          },
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
);
assert.equal(ready.conceptPackReady, true);
assert.equal(ready.readyForConceptReview, true);
assert.equal(ready.conceptUrls.length, 3);
assert.match(ready.statusLabel, /concept review/i);

const blocked = buildLaunchConceptStatus(
  baseProject({
    context: baseContext({
      outputs: [
        {
          id: 'out-block',
          kind: 'research',
          worker: 'identity-gate',
          createdAt: '2026-07-29T12:01:00.000Z',
          payload: {
            ok: false,
            code: 'ambiguous',
            reason: 'Multiple plausible identities remain.',
            resumeHint: 'Add one clearer identifying detail.',
          },
        },
      ],
    }),
  }),
);
assert.equal(blocked.identityBlocked, true);
assert.match(blocked.statusLabel, /identity/i);

console.log('test-factory-identity-concept-pack.ts: ok');
