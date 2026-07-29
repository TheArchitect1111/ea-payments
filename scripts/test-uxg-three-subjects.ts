/**
 * Three-subject Universal Experience Generator contract (no live publish).
 * Subjects: community leader, nonprofit, media/athlete brand — not Amanda.
 * Run: npx --yes tsx scripts/test-uxg-three-subjects.ts
 */
import assert from 'node:assert/strict';
import { evaluateIdentityGate } from '../lib/factory-identity-gate';
import { composeConceptPreviews } from '../lib/factory-concept-previews';
import { buildLaunchConceptStatus } from '../lib/factory-post-build-concepts';
import type { FactoryProject } from '../lib/factory-project-store';
import type { ProjectContext } from '../lib/factory-project-context';

const subjects = [
  {
    id: 'proj-leader',
    name: 'Jordan Hale',
    kind: 'leader',
    detail: 'city council president, Columbus OH',
    url: 'https://example.com/jordan-hale-columbus',
    siteTitle: 'Jordan Hale | Columbus City Council',
  },
  {
    id: 'proj-nonprofit',
    name: 'River Bend Conservancy',
    kind: 'nonprofit',
    detail: 'membership land trust, Vermont',
    url: 'https://example.org/river-bend-conservancy',
    siteTitle: 'River Bend Conservancy — Land Trust',
  },
  {
    id: 'proj-media',
    name: 'Astra Court Media',
    kind: 'media',
    detail: 'athlete entertainment brand, Miami',
    url: 'https://example.com/astra-court',
    siteTitle: 'Astra Court Media',
  },
] as const;

function art(projectId: string, id: string, kind: string, data: Record<string, unknown>) {
  return {
    schemaVersion: 1,
    id,
    projectId,
    kind,
    providerId: 'test',
    createdAt: '2026-07-29T12:00:00.000Z',
    provenance: {
      capabilityId: 'test',
      sourceType: 'website',
      sourceUrl: typeof data.url === 'string' ? data.url : undefined,
      collectedAt: '2026-07-29T12:00:00.000Z',
    },
    data,
  };
}

function projectFor(subject: (typeof subjects)[number]): FactoryProject {
  const at = '2026-07-29T12:00:00.000Z';
  const context: ProjectContext = {
    schemaVersion: 1,
    projectId: subject.id,
    pipelineStatus: 'BUILDING',
    createdAt: at,
    updatedAt: at,
    seed: {
      client: subject.name,
      goal: 'Website + Portal',
      deliverable: 'Website + Portal',
      notes: `Distinguishing detail: ${subject.detail}`,
      url: subject.url,
      attachments: [],
      source: 'admin',
    },
    artifacts: [
      art(subject.id, `${subject.id}-web`, 'website', {
        url: subject.url,
        extracted: {
          title: subject.siteTitle,
          textPreview: `${subject.name} — ${subject.detail}`,
          canonicalUrl: subject.url,
        },
      }),
      art(subject.id, `${subject.id}-brand`, 'branding', {
        hasVision: true,
        visionSummary: `${subject.name} serves their community with a clear public presence.`,
        detectedUrl: subject.url,
        whatTheyDo: subject.detail,
      }),
      art(subject.id, `${subject.id}-cd`, 'creative_direction', {
        organizationName: subject.name,
        story: {
          sentence: `${subject.name} helps people take a clear next step.`,
          audience: 'Members and partners',
          transformation: 'From unclear presence to a guided public experience.',
          proofSignals: ['Public work', 'Community trust'],
        },
        visualDirection: {
          style: 'editorial, human, calm',
          photography: 'documentary',
          typography: 'expressive display',
          composition: 'image-led',
          motion: 'slow reveals',
        },
        homepageStoryBeats: ['Who', 'Why', 'Who we help', 'What changes', 'Invite'],
        portalContinuity: {
          purpose: 'Continue the story inside the portal',
          firstView: ['where I am', 'what happened', 'what happens next'],
        },
      }),
      art(subject.id, `${subject.id}-concepts`, 'experience_concepts', {
        concepts: [
          {
            id: `${subject.id}-a`,
            name: 'Cinematic Documentary',
            rationale: 'Human-led story',
            organizationName: subject.name,
            story: {
              sentence: `${subject.name} helps people take a clear next step.`,
              audience: 'Members and partners',
              transformation: 'Clarity and belonging',
              proofSignals: ['Public work'],
            },
            website: {
              composition: 'full-bleed threshold hero',
              imageBehavior: 'documentary photography',
              typeBehavior: 'editorial headlines',
              motion: 'slow scene reveals',
            },
            portal: { composition: 'single next-best-action hero', tone: 'concierge workspace' },
          },
          {
            id: `${subject.id}-b`,
            name: 'Editorial Journal',
            rationale: 'Publication-like',
            organizationName: subject.name,
            story: {
              sentence: `${subject.name} publishes a clear path forward.`,
              audience: 'Members and partners',
              transformation: 'From noise to narrative',
              proofSignals: ['Community trust'],
            },
            website: {
              composition: 'asymmetric editorial lead',
              imageBehavior: 'mixed portrait crops',
              typeBehavior: 'magazine scale',
              motion: 'measured page turns',
            },
            portal: { composition: 'personal briefing cover', tone: 'private journal' },
          },
          {
            id: `${subject.id}-c`,
            name: 'Intimate Companion',
            rationale: 'Close guidance',
            organizationName: subject.name,
            story: {
              sentence: `${subject.name} walks with people one step at a time.`,
              audience: 'Members and partners',
              transformation: 'From alone to accompanied',
              proofSignals: ['Lived service'],
            },
            website: {
              composition: 'companion-centered hero',
              imageBehavior: 'warm close portraits',
              typeBehavior: 'soft display',
              motion: 'gentle fades',
            },
            portal: { composition: 'guided next step', tone: 'companion workspace' },
          },
        ],
        recommendedConceptId: `${subject.id}-a`,
        selectionStatus: 'awaiting_review',
      }),
    ],
    outputs: [],
  };

  return {
    version: 1,
    id: subject.id,
    client: subject.name,
    goal: 'Website + Portal',
    deliverable: 'Website + Portal',
    notes: `Distinguishing detail: ${subject.detail}\nSource: Universal Quick Launch`,
    url: subject.url,
    attachments: [],
    source: 'admin',
    pipelineStatus: 'BUILDING',
    createdAt: at,
    updatedAt: at,
    activity: [],
    context,
  };
}

const results: Array<Record<string, unknown>> = [];

for (const subject of subjects) {
  assert.doesNotMatch(subject.name, /Amanda/i);
  const project = projectFor(subject);
  const identity = evaluateIdentityGate(project);
  assert.equal(identity.ok, true, `${subject.name} identity should pass`);
  if (!identity.ok) throw new Error('unreachable');
  assert.ok(identity.sources.length >= 1, `${subject.name} needs a source`);
  assert.ok(identity.claims.length >= 1);

  const conceptsArt = project.context?.artifacts.find((a) => a.kind === 'experience_concepts');
  assert.ok(conceptsArt, `${subject.name} missing experience_concepts`);
  const concepts = (conceptsArt.data.concepts as Array<Record<string, unknown>>) || [];
  assert.equal(concepts.length, 3);

  const creativeArt = project.context?.artifacts.find((a) => a.kind === 'creative_direction');
  assert.ok(creativeArt, `${subject.name} missing creative_direction`);
  const slug = `${subject.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-test`;
  const pack = composeConceptPreviews({
    projectId: subject.id,
    portalSlug: slug,
    concepts: concepts as never,
    creativeDirection: creativeArt.data as never,
  });
  assert.equal(pack.previews.length, 3);
  const names = new Set(pack.previews.map((p) => p.name));
  assert.equal(names.size, 3, `${subject.name} concepts must be distinct`);
  const signatures = new Set(pack.previews.map((p) => p.compositionSignature));
  assert.ok(signatures.size >= 2, `${subject.name} compositions should differ`);

  for (const preview of pack.previews) {
    assert.match(preview.websitePreviewPath, new RegExp(`/preview/factory/${subject.id}/`));
    assert.match(preview.portalPreviewPath, /\/portal$/);
    assert.ok(preview.puckData);
    assert.ok(preview.portalShell.organizationName);
  }

  const withPack: FactoryProject = {
    ...project,
    context: {
      ...project.context!,
      outputs: [
        {
          id: 'out-id',
          kind: 'research',
          worker: 'identity-gate',
          createdAt: '2026-07-29T12:01:00.000Z',
          payload: { ok: true, code: 'passed', sources: identity.sources },
        },
        {
          id: 'out-prev',
          kind: 'production',
          worker: 'concept-previews',
          createdAt: '2026-07-29T12:02:00.000Z',
          payload: {
            ...pack,
            sourceConceptsArtifactId: conceptsArt.id,
          } as unknown as Record<string, unknown>,
        },
        {
          id: 'out-pack',
          kind: 'production',
          worker: 'post-build-concepts',
          createdAt: '2026-07-29T12:03:00.000Z',
          payload: { ok: true, sourceConceptsArtifactId: conceptsArt.id },
        },
      ],
    },
  };
  const status = buildLaunchConceptStatus(withPack);
  assert.equal(status.conceptPackReady, true);
  assert.equal(status.readyForConceptReview, true);
  assert.equal(status.identityBlocked, false);
  assert.ok(status.conceptsReviewPath?.includes(subject.id));

  results.push({
    subject: subject.name,
    kind: subject.kind,
    identityOk: identity.ok,
    sourceCount: identity.sources.length,
    concepts: pack.previews.map((p) => p.name),
    websitePreviewPaths: pack.previews.map((p) => p.websitePreviewPath),
    portalPreviewPaths: pack.previews.map((p) => p.portalPreviewPath),
    conceptsReviewPath: status.conceptsReviewPath,
    autoPublish: false,
  });
}

// Ambiguity stop on a fourth pathological fixture
const leader = subjects[0];
assert.ok(leader);
const conflicted = projectFor(leader);
conflicted.url = undefined;
conflicted.notes = 'Source: Universal Quick Launch';
conflicted.context = {
  ...conflicted.context!,
  seed: { ...conflicted.context!.seed, url: undefined, notes: '' },
  artifacts: [
    art(leader.id, 'brand-amb', 'branding', {
      identityCandidates: [
        { name: 'Jordan Hale (Ohio)' },
        { name: 'Jordan Hale (Texas)' },
        { name: 'J Hale LLC' },
      ],
    }),
  ],
};
const blocked = evaluateIdentityGate(conflicted);
assert.equal(blocked.ok, false);
if (!blocked.ok) assert.equal(blocked.code, 'ambiguous');

console.log(
  JSON.stringify(
    {
      ok: true,
      subjects: results,
      ambiguityStop: true,
      note: 'Draft/quarantine only — no live publish in this contract test.',
    },
    null,
    2,
  ),
);
