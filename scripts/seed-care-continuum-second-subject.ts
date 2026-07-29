/**
 * Seed a second healthcare Factory project and compose Concept A
 * through the universal care-continuum pipeline (no subject hard-coding).
 */
import { appendArtifacts } from '../lib/factory-artifact';
import { appendProjectContextOutput } from '../lib/factory-project-context';
import {
  composeConceptPreviews,
  generateAndPersistConceptPreviews,
  CONCEPT_PREVIEWS_WORKER,
} from '../lib/factory-concept-previews';
import { CONTENT_PACKAGE_WORKER, type ContentPackage } from '../lib/factory-content-package';
import type { FactoryExperienceConcept } from '../lib/factory-concept-to-director';
import { saveFactoryProject, type FactoryProject } from '../lib/factory-project-store';
import { CARE_CONTINUUM_SIGNATURE } from '../lib/layout-composer/grammars/care-continuum-editorial';

export const SECOND_HEALTHCARE_PROJECT_ID = 'proj-care-proof-maple-01';
export const SECOND_CONCEPT_A_ID = 'workorder-website-p1-concept-a';

function buildPack(): ContentPackage {
  const now = new Date().toISOString();
  const lens = {
    heroHeadline: 'Compassionate guidance when care needs change',
    heroSupporting:
      'Jordan Ellis helps families understand palliative and hospice options with Maple Grove Hospice.',
    aboutTitle: 'Meet Jordan Ellis',
    aboutBody:
      'Jordan Ellis serves as a Hospice Care Coordinator with Maple Grove Hospice, helping households navigate palliative and hospice pathways.',
    sectionHeadlines: ['Role', 'Pathways', 'Journey'],
    sectionBodies: [
      'Care coordinators educate families and referring partners on hospice capabilities.',
      'Maple Grove Hospice provides in-home hospice, palliative consults, and bereavement support.',
      'Families move from open questions to a clear intake conversation.',
    ],
    ctaLabel: 'Call Maple Grove',
    portalPurpose: 'A private place for care pathway questions after the public story.',
  };
  return {
    schemaVersion: 1,
    generatedAt: now,
    projectId: SECOND_HEALTHCARE_PROJECT_ID,
    name: 'Jordan Ellis',
    positioning: 'Hospice care coordination for families facing serious illness.',
    centralStory:
      'Jordan Ellis coordinates hospice care pathways so families understand what support is possible next.',
    biography:
      'Jordan Ellis is a Hospice Care Coordinator at Maple Grove Hospice in the Piedmont region.',
    milestones: ['Since 1998'],
    accomplishments: [],
    currentWork: [
      'In-home hospice: Interdisciplinary support at home',
      'Palliative consult: Symptom-focused guidance earlier in illness',
      'Bereavement support: Family support that continues after loss',
    ],
    organizations: ['Maple Grove Hospice'],
    audience: 'Patients, families, and referring clinicians',
    callsToAction: ['Call 1-888-555-0142'],
    mediaPlan: { strategy: 'preview_healthcare', items: [] },
    claims: [
      {
        text: 'Jordan Ellis serves as Hospice Care Coordinator at Maple Grove Hospice.',
        status: 'admin_clarification',
      },
      {
        text: 'Maple Grove Hospice provides in-home hospice, palliative consults, and bereavement support.',
        status: 'verified',
        sourceUrl: 'https://example.org/maple',
      },
      {
        text: 'Maple Grove Hospice has served the Piedmont region since 1998.',
        status: 'verified',
        sourceUrl: 'https://example.org/maple',
      },
      {
        text: 'Assistance phone: 1-888-555-0142',
        status: 'verified',
        sourceUrl: 'https://example.org/maple',
      },
    ],
    sources: [{ url: 'https://example.org/maple', label: 'Maple Grove Hospice' }],
    lenses: { cinematic: lens, editorial: lens, intimate: lens },
    quality: { factCount: 4, sourceCount: 1, ready: true, missing: [] },
  };
}

function buildConcepts(): FactoryExperienceConcept[] {
  return [
    {
      id: SECOND_CONCEPT_A_ID,
      name: 'Compassionate Continuum',
      organizationName: 'Jordan Ellis',
      rationale: 'Healthcare care-continuum storytelling for Concept A',
      story: {
        sentence:
          'Jordan Ellis helps families understand palliative and hospice options with Maple Grove Hospice.',
        audience: 'Families and referring clinicians',
        transformation: 'From open questions to a clear hospice pathway',
      },
    },
    {
      id: 'workorder-website-p1-concept-b',
      name: 'Editorial Brief',
      organizationName: 'Jordan Ellis',
    },
    {
      id: 'workorder-website-p1-concept-c',
      name: 'Intimate Guide',
      organizationName: 'Jordan Ellis',
    },
  ];
}

async function main() {
  const now = new Date().toISOString();
  const pack = buildPack();
  const concepts = buildConcepts();

  const dry = composeConceptPreviews({
    projectId: SECOND_HEALTHCARE_PROJECT_ID,
    portalSlug: 'jordan-ellis-maple',
    concepts,
    contentPackage: pack,
    projectNotes: 'Distinguishing detail: Hospice Care Coordinator at Maple Grove Hospice',
    recommendedConceptId: SECOND_CONCEPT_A_ID,
  });
  const a = dry.previews.find((p) => p.conceptId === SECOND_CONCEPT_A_ID);
  if (!a || a.compositionSignature !== CARE_CONTINUUM_SIGNATURE) {
    throw new Error(`Expected care continuum signature, got ${a?.compositionSignature}`);
  }
  if (/kristina/i.test(JSON.stringify(a.puckData))) {
    throw new Error('Second subject puck contains Kristina');
  }

  const project: FactoryProject = {
    version: 1,
    id: SECOND_HEALTHCARE_PROJECT_ID,
    client: 'Jordan Ellis',
    goal: 'Website + portal for hospice care coordination',
    deliverable: 'website',
    industry: 'Hospice and palliative care',
    notes: 'Distinguishing detail: Hospice Care Coordinator at Maple Grove Hospice',
    url: 'https://example.org/maple',
    attachments: [],
    source: 'admin',
    pipelineStatus: 'UNDER_REVIEW',
    createdAt: now,
    updatedAt: now,
    activity: [],
    context: {
      schemaVersion: 1,
      projectId: SECOND_HEALTHCARE_PROJECT_ID,
      seed: {
        client: 'Jordan Ellis',
        goal: 'Website + portal for hospice care coordination',
        deliverable: 'website',
        industry: 'Hospice and palliative care',
        notes: 'Distinguishing detail: Hospice Care Coordinator at Maple Grove Hospice',
        url: 'https://example.org/maple',
        attachments: [],
        source: 'admin',
      },
      pipelineStatus: 'UNDER_REVIEW',
      outputs: [],
      artifacts: [],
      createdAt: now,
      updatedAt: now,
    },
  };

  const saved = await saveFactoryProject(project);
  if (!saved.ok) throw new Error(saved.error || 'saveFactoryProject failed');

  await appendArtifacts(SECOND_HEALTHCARE_PROJECT_ID, [
    {
      kind: 'experience_concepts',
      providerId: 'seed-care-continuum',
      provenance: { capabilityId: 'seed', sourceType: 'proof_seed' },
      data: {
        concepts,
        recommendedConceptId: SECOND_CONCEPT_A_ID,
        selectedConceptId: null,
        selectionStatus: 'awaiting_review',
      },
    },
  ]);

  await appendProjectContextOutput(SECOND_HEALTHCARE_PROJECT_ID, {
    kind: 'production',
    worker: CONTENT_PACKAGE_WORKER,
    payload: pack as unknown as Record<string, unknown>,
  });

  const persisted = await generateAndPersistConceptPreviews(SECOND_HEALTHCARE_PROJECT_ID);
  if (!persisted.ok) throw new Error(persisted.error);

  console.log(
    JSON.stringify({
      ok: true,
      projectId: SECOND_HEALTHCARE_PROJECT_ID,
      conceptId: SECOND_CONCEPT_A_ID,
      signature: CARE_CONTINUUM_SIGNATURE,
      worker: CONCEPT_PREVIEWS_WORKER,
      previewPath: `/preview/factory/${SECOND_HEALTHCARE_PROJECT_ID}/${SECOND_CONCEPT_A_ID}`,
      persistedToAirtable: saved.persistedToAirtable,
    }),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
