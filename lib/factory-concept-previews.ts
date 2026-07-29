/**
 * Compose real website + portal preview drafts from Factory experience_concepts.
 * Persists puck + portal-shell metadata on the Factory project context (draft only).
 */
import type { Data } from '@measured/puck';
import { publicPortalLoginUrl } from '@/lib/ctp-portal-host';
import {
  conceptToProvisionFields,
  detectConceptLens,
  type FactoryCreativeDirectionData,
  type FactoryExperienceConcept,
} from '@/lib/factory-concept-to-director';
import { listArtifacts, type Artifact } from '@/lib/factory-artifact';
import {
  appendProjectContextOutput,
  loadProjectContext,
  projectContextFromProject,
  type ProjectContext,
} from '@/lib/factory-project-context';
import {
  getFactoryProject,
  saveFactoryProject,
  type FactoryProject,
} from '@/lib/factory-project-store';
import { composeDirectedWebsite, puckContainsFeatureCards } from '@/lib/layout-composer';

export const CONCEPT_PREVIEWS_WORKER = 'concept-previews';

function portalSlugFromClient(project: FactoryProject, override?: string): string {
  if (override?.trim()) return override.trim().toLowerCase();
  const client = project.client.trim().toLowerCase();
  if (client.includes('amanda')) return 'amanda-catherine';
  const raw = (project.client || project.id).trim().toLowerCase();
  const base = raw
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 28);
  const suffix = project.id.replace(/[^a-z0-9]/gi, '').slice(-6).toLowerCase() || 'site';
  return `${base || 'client'}-${suffix}`;
}

export type ConceptPortalShellPreview = {
  tone: string;
  composition: string;
  purpose?: string;
  firstView: string[];
  primaryColor: string;
  accentColor: string;
  themeId: string;
  organizationName: string;
  brandHeadline: string;
  brandSubhead?: string;
  memberWhere?: string;
  memberNext?: string;
};

export type ConceptPreviewDraft = {
  conceptId: string;
  name: string;
  lens: ReturnType<typeof detectConceptLens>;
  recommended: boolean;
  websitePreviewPath: string;
  portalPreviewPath: string;
  compositionSignature: string;
  themeId: string;
  primaryColor: string;
  accentColor: string;
  puckData: Data;
  portalShell: ConceptPortalShellPreview;
  websiteSite: Record<string, unknown>;
};

export type ConceptPreviewsPayload = {
  schemaVersion: 1;
  generatedAt: string;
  projectId: string;
  portalSlug: string;
  recommendedConceptId: string | null;
  selectedConceptId: string | null;
  selectionStatus: string;
  /** Ties this preview pack to a specific experience_concepts artifact for idempotency. */
  sourceConceptsArtifactId?: string;
  previews: ConceptPreviewDraft[];
};

function latestArtifact(context: ProjectContext, kind: string): Artifact | null {
  const rows = listArtifacts(context, kind as never);
  return rows.length ? rows[rows.length - 1]! : null;
}

export function readExperienceConceptsArtifact(
  context: ProjectContext,
): Artifact | null {
  return latestArtifact(context, 'experience_concepts');
}

export function readCreativeDirection(
  context: ProjectContext,
): FactoryCreativeDirectionData | null {
  const art = latestArtifact(context, 'creative_direction');
  if (!art?.data || typeof art.data !== 'object') return null;
  return art.data as FactoryCreativeDirectionData;
}

export function listConceptPreviewsFromContext(
  context: ProjectContext,
): ConceptPreviewsPayload | null {
  const outputs = [...(context.outputs || [])]
    .filter((o) => o.worker === CONCEPT_PREVIEWS_WORKER && o.kind === 'production')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const last = outputs[outputs.length - 1];
  if (!last?.payload || typeof last.payload !== 'object') return null;
  const payload = last.payload as ConceptPreviewsPayload;
  if (payload.schemaVersion !== 1 || !Array.isArray(payload.previews)) return null;
  return payload;
}

export function getConceptPreviewDraft(
  context: ProjectContext,
  conceptId: string,
): ConceptPreviewDraft | null {
  const bundle = listConceptPreviewsFromContext(context);
  if (!bundle) return null;
  return bundle.previews.find((p) => p.conceptId === conceptId) || null;
}

function portalSlugForProject(project: FactoryProject, override?: string): string {
  return portalSlugFromClient(project, override);
}

/**
 * Pure compose for three (or N) concepts — no I/O.
 */
export function composeConceptPreviews(input: {
  projectId: string;
  portalSlug: string;
  concepts: FactoryExperienceConcept[];
  creativeDirection?: FactoryCreativeDirectionData | null;
  recommendedConceptId?: string | null;
  selectedConceptId?: string | null;
  selectionStatus?: string;
  generatedAt?: string;
}): ConceptPreviewsPayload {
  const at = input.generatedAt || new Date().toISOString();
  const portalLoginHref = publicPortalLoginUrl(input.portalSlug);
  const sitePath = `/sites/${input.portalSlug}`;

  const previews: ConceptPreviewDraft[] = input.concepts.map((concept) => {
    const fields = conceptToProvisionFields({
      concept,
      creativeDirection: input.creativeDirection,
      portalSlug: input.portalSlug,
      portalLoginHref,
      sitePath,
    });
    const composed = composeDirectedWebsite({
      organization: fields.organization,
      portalLoginHref,
      sitePath,
      primaryColor: fields.primaryColor,
      accentColor: fields.accentColor,
    });

    if (puckContainsFeatureCards(composed.puckData)) {
      throw new Error(
        `Concept ${concept.id} compose emitted EAFeatures (forbidden).`,
      );
    }

    const themedPuck: Data = {
      ...composed.puckData,
      root: {
        ...(composed.puckData.root || {}),
        props: {
          ...((composed.puckData.root as { props?: Record<string, unknown> } | undefined)
            ?.props || {}),
          themeId: fields.themeId,
          factoryConceptId: concept.id,
          factoryConceptName: concept.name,
          compositionSignature: composed.composed.compositionSignature,
          storyClassification: composed.director.classification,
          creativeDirection: composed.director.creativeDirection,
          websiteSite: composed.websiteSite,
        },
      } as Data['root'],
    };

    const continuity = input.creativeDirection?.portalContinuity;

    return {
      conceptId: concept.id,
      name: concept.name,
      lens: fields.lens,
      recommended: concept.id === input.recommendedConceptId,
      websitePreviewPath: `/preview/factory/${encodeURIComponent(input.projectId)}/${encodeURIComponent(concept.id)}`,
      portalPreviewPath: `/preview/factory/${encodeURIComponent(input.projectId)}/${encodeURIComponent(concept.id)}/portal`,
      compositionSignature: composed.composed.compositionSignature,
      themeId: fields.themeId,
      primaryColor: fields.primaryColor,
      accentColor: fields.accentColor,
      puckData: themedPuck,
      portalShell: {
        tone: concept.portal?.tone || 'Calm executive continuity from the public story',
        composition:
          concept.portal?.composition ||
          'Single next-best-action with narrative progress',
        purpose: continuity?.purpose,
        firstView: Array.isArray(continuity?.firstView) ? continuity!.firstView! : [],
        primaryColor: fields.primaryColor,
        accentColor: fields.accentColor,
        themeId: fields.themeId,
        organizationName: fields.organization.organizationName,
        brandHeadline: fields.organization.brandHeadline || fields.organization.organizationName,
        brandSubhead: fields.organization.brandSubhead,
        memberWhere: fields.organization.member?.whereYouAre,
        memberNext: fields.organization.member?.whatNext,
      },
      websiteSite: composed.websiteSite,
    };
  });

  return {
    schemaVersion: 1,
    generatedAt: at,
    projectId: input.projectId,
    portalSlug: input.portalSlug,
    recommendedConceptId: input.recommendedConceptId || null,
    selectedConceptId: input.selectedConceptId || null,
    selectionStatus: input.selectionStatus || 'awaiting_review',
    previews,
  };
}

export type GenerateConceptPreviewsResult =
  | { ok: true; payload: ConceptPreviewsPayload; project: FactoryProject }
  | { ok: false; error: string };

/**
 * Load experience_concepts, compose three directed previews, append to project context.
 */
export async function generateAndPersistConceptPreviews(
  projectId: string,
  options?: { portalSlug?: string; sourceConceptsArtifactId?: string },
): Promise<GenerateConceptPreviewsResult> {
  const project = await getFactoryProject(projectId);
  if (!project) return { ok: false, error: 'Factory project not found.' };

  const context = projectContextFromProject(project);
  const conceptsArt = readExperienceConceptsArtifact(context);
  if (!conceptsArt?.data || typeof conceptsArt.data !== 'object') {
    return {
      ok: false,
      error:
        'No experience_concepts artifact yet. Run Factory through production/website build first.',
    };
  }

  const data = conceptsArt.data as {
    concepts?: FactoryExperienceConcept[];
    recommendedConceptId?: string | null;
    selectedConceptId?: string | null;
    selectionStatus?: string;
  };
  const concepts = Array.isArray(data.concepts) ? data.concepts : [];
  if (concepts.length === 0) {
    return { ok: false, error: 'experience_concepts artifact has no concepts.' };
  }

  const portalSlug = portalSlugForProject(project, options?.portalSlug);
  const creativeDirection = readCreativeDirection(context);

  let payload: ConceptPreviewsPayload;
  try {
    payload = composeConceptPreviews({
      projectId,
      portalSlug,
      concepts,
      creativeDirection,
      recommendedConceptId: data.recommendedConceptId,
      selectedConceptId: data.selectedConceptId,
      selectionStatus: data.selectionStatus,
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Concept preview compose failed.',
    };
  }

  payload = {
    ...payload,
    sourceConceptsArtifactId: options?.sourceConceptsArtifactId || conceptsArt.id,
  };

  const appended = await appendProjectContextOutput(projectId, {
    kind: 'production',
    worker: CONCEPT_PREVIEWS_WORKER,
    payload: payload as unknown as Record<string, unknown>,
    detail: `Composed ${payload.previews.length} directed concept previews`,
  });
  if (!appended) {
    return { ok: false, error: 'Failed to persist concept previews on project context.' };
  }

  return { ok: true, payload, project: appended.project };
}

export async function loadConceptPreviewsPayload(
  projectId: string,
): Promise<ConceptPreviewsPayload | null> {
  const context = await loadProjectContext(projectId);
  if (!context) return null;
  return listConceptPreviewsFromContext(context);
}

/**
 * Patch selection fields onto the latest experience_concepts artifact + latest previews payload.
 */
export async function persistConceptSelection(input: {
  projectId: string;
  selectedConceptId: string;
  selectionStatus?: string;
}): Promise<
  | { ok: true; project: FactoryProject; selectedConceptId: string; selectionStatus: string }
  | { ok: false; error: string }
> {
  const project = await getFactoryProject(input.projectId);
  if (!project) return { ok: false, error: 'Factory project not found.' };

  const context = projectContextFromProject(project);
  const conceptsArt = readExperienceConceptsArtifact(context);
  if (!conceptsArt) {
    return { ok: false, error: 'No experience_concepts artifact to update.' };
  }

  const conceptIds = Array.isArray((conceptsArt.data as { concepts?: { id: string }[] })?.concepts)
    ? ((conceptsArt.data as { concepts: { id: string }[] }).concepts.map((c) => c.id) as string[])
    : [];
  if (!conceptIds.includes(input.selectedConceptId)) {
    return { ok: false, error: 'selectedConceptId is not in experience_concepts.' };
  }

  const selectionStatus = input.selectionStatus || 'selected';
  const at = new Date().toISOString();

  const artifacts = (context.artifacts || []).map((art) => {
    if (art.id !== conceptsArt.id) return art;
    return {
      ...art,
      data: {
        ...art.data,
        selectedConceptId: input.selectedConceptId,
        selectionStatus,
      },
    };
  });

  const existing = listConceptPreviewsFromContext(context);
  let outputs = context.outputs || [];
  if (existing) {
    const patched: ConceptPreviewsPayload = {
      ...existing,
      selectedConceptId: input.selectedConceptId,
      selectionStatus,
    };
    outputs = [
      ...outputs,
      {
        id: `out-concept-select-${Date.now().toString(36)}`,
        kind: 'production',
        worker: CONCEPT_PREVIEWS_WORKER,
        createdAt: at,
        payload: patched as unknown as Record<string, unknown>,
      },
    ];
  }

  const next: FactoryProject = {
    ...project,
    context: {
      ...context,
      artifacts,
      outputs,
      updatedAt: at,
    },
    updatedAt: at,
    activity: [
      ...(project.activity || []),
      {
        at,
        from: project.pipelineStatus,
        to: project.pipelineStatus,
        worker: 'concept-selection',
        detail: `Selected concept ${input.selectedConceptId} (${selectionStatus})`,
      },
    ],
  };

  const saved = await saveFactoryProject(next);
  if (!saved.ok) {
    return { ok: false, error: saved.error || 'Failed to save concept selection.' };
  }
  return {
    ok: true,
    project: next,
    selectedConceptId: input.selectedConceptId,
    selectionStatus,
  };
}
