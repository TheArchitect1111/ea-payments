/**
 * Three-subject Universal Experience Generator content-quality contract.
 * Regression fixtures only — no subject-specific generator branches.
 * Subjects: healthcare professional, product business, nonprofit.
 * Run: npx --yes tsx scripts/test-uxg-three-subjects.ts
 */
import assert from 'node:assert/strict';
import { buildContentPackageFromContext } from '../lib/factory-content-package';
import { composeConceptPreviews } from '../lib/factory-concept-previews';
import { evaluateConceptQualityGate } from '../lib/factory-concept-quality-gate';
import { buildPublicCopyBundle, evaluatePublicCopyQuality } from '../lib/uxg';
import { buildStructuredEvidenceModel } from '../lib/uxg/evidence-model';

const CONCEPTS = [
  { id: 'concept-a', name: 'Concept A — Cinematic' },
  { id: 'concept-b', name: 'Concept B — Editorial' },
  { id: 'concept-c', name: 'Concept C — Intimate' },
];

const SUBJECTS = [
  {
    id: 'proj-uxg-healthcare',
    client: 'Kristina Brickey',
    kind: 'healthcare',
    notes:
      'Distinguishing detail: Clinical Liaison at 3HC. Helps patients and families navigate home health and hospice pathways in Eastern North Carolina.',
  },
  {
    id: 'proj-uxg-product',
    client: 'Brickey Botanicals',
    kind: 'product',
    notes:
      'Distinguishing detail: Founder at Brickey Botanicals. Small-batch botanical product collections for customers seeking plant-based wellness.',
  },
  {
    id: 'proj-uxg-nonprofit',
    client: 'Ascension Circle',
    kind: 'nonprofit',
    notes:
      'Distinguishing detail: Community Director at Ascension Circle. Nonprofit ministry programs that help neighbors find belonging and practical next steps.',
  },
] as const;

const repairedExamples: string[] = [];
const results: Array<Record<string, unknown>> = [];

for (const subject of SUBJECTS) {
  const pack = buildContentPackageFromContext(subject.id, subject.client, subject.notes, null);
  assert.ok(pack.quality.ready, `${subject.client} content package must be draft-ready`);
  assert.ok(pack.organizations.length >= 1, `${subject.client} must resolve an organization`);
  assert.ok(pack.lenses.cinematic.portalPurpose, `${subject.client} needs portal purpose`);
  assert.notEqual(
    pack.lenses.cinematic.aboutBody,
    pack.lenses.cinematic.portalPurpose,
    `${subject.client} portal purpose must not equal about body`,
  );

  const payload = composeConceptPreviews({
    projectId: subject.id,
    portalSlug: `${subject.id}-slug`,
    concepts: CONCEPTS,
    contentPackage: pack,
    projectNotes: subject.notes,
    recommendedConceptId: 'concept-a',
  });
  assert.equal(payload.previews.length, 3);

  const evidence = buildStructuredEvidenceModel({
    subjectIdentity: pack.name,
    distinguishingDetail: subject.notes.replace(/^Distinguishing detail:\s*/i, '').split('.')[0],
    organizations: pack.organizations,
    claims: pack.claims,
    sources: pack.sources,
    currentWork: pack.currentWork,
    milestones: pack.milestones,
  });
  assert.ok(evidence.verifiedRole || evidence.subjectFacts.length >= 1);
  assert.ok(evidence.verifiedOrganization || evidence.organizationFacts.length >= 1);

  for (const preview of payload.previews) {
    assert.ok(preview.copyQuality?.ok, `${subject.client}/${preview.conceptId} copy quality must pass`);
    if (preview.copyQuality?.repaired) {
      repairedExamples.push(
        ...preview.copyQuality.examples.map((e) => `${subject.client}/${preview.conceptId}: ${e}`),
      );
    }
    const bundle = buildPublicCopyBundle({
      puckData: preview.puckData,
      portalShell: preview.portalShell as unknown as Record<string, unknown>,
    });
    const q = evaluatePublicCopyQuality(bundle, evidence);
    assert.equal(q.ok, true, `${subject.client}/${preview.conceptId}: ${q.issues[0]?.message || 'copy fail'}`);

    const websiteBlob = JSON.stringify(preview.puckData);
    const portalPurpose = String(preview.portalShell.purpose || '');
    assert.ok(portalPurpose.length > 20, `${subject.client} portal purpose required`);
    assert.notEqual(
      portalPurpose,
      pack.lenses.cinematic.aboutBody,
      `${subject.client} portal purpose must differ from about body`,
    );
    assert.notEqual(
      portalPurpose,
      pack.lenses.cinematic.heroSupporting,
      `${subject.client} portal purpose must differ from website supporting copy`,
    );
    void websiteBlob;
  }

  const gate = evaluateConceptQualityGate({ contentPackage: pack, previews: payload });
  assert.equal(gate.ok, true, `${subject.client} gate: ${gate.reasons.join('; ')}`);

  results.push({
    subject: subject.client,
    kind: subject.kind,
    organizations: pack.organizations,
    websitePreviewPaths: payload.previews.map((p) => p.websitePreviewPath),
    portalPreviewPaths: payload.previews.map((p) => p.portalPreviewPath),
    copyRepaired: payload.previews.some((p) => p.copyQuality?.repaired),
  });
}

console.log(
  JSON.stringify(
    {
      ok: true,
      subjects: results,
      failedRepairedExamples: repairedExamples.slice(0, 24),
      note: 'Same Universal pipeline for all three subjects — draft/quarantine only.',
    },
    null,
    2,
  ),
);
