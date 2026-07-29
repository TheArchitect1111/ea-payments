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
import {
  buildContentPackageFromProject,
  CONTENT_PACKAGE_WORKER,
  readContentPackageFromContext,
  type ContentPackage,
} from '@/lib/factory-content-package';
import { evaluateConceptQualityGate } from '@/lib/factory-concept-quality-gate';
import {
  readExperienceCreationBundleFromProject,
  type ContentCreativePack,
} from '@/lib/experience-creation';
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

/** Temporary environment imagery — never a fabricated likeness; blocked from publication. */
function temporaryHeroImageUrl(pack: ContentPackage | null | undefined): string {
  const blob = `${pack?.name || ''} ${(pack?.organizations || []).join(' ')} ${(pack?.currentWork || []).join(' ')} ${pack?.biography || ''} ${pack?.centralStory || ''}`.toLowerCase();
  if (/liaison|3hc|home\s*health|hospital|patient|clinic|care|nurse/i.test(blob)) {
    return 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=80';
  }
  return 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80';
}

function resolveHeroImageUrl(
  pack: ContentPackage | null | undefined,
  eceUrl?: string,
): string {
  return eceUrl || temporaryHeroImageUrl(pack);
}

function contentPackageFromCreativePack(
  base: ContentPackage,
  creative: ContentCreativePack,
): ContentPackage {
  const mapPremise = (index: number, key: keyof ContentPackage['lenses']) => {
    const premise = creative.premises[index];
    if (!premise) return base.lenses[key];
    return {
      ...base.lenses[key],
      heroHeadline: premise.heroHeadline,
      heroSupporting: premise.heroSupporting,
      aboutTitle: creative.sectionHeadlines[0] || base.lenses[key].aboutTitle,
      aboutBody: creative.biography,
      sectionHeadlines: creative.sectionHeadlines,
      sectionBodies: creative.sectionBodies,
      ctaLabel: creative.callsToAction[0] || base.lenses[key].ctaLabel,
      portalPurpose: creative.portalPurpose,
    };
  };
  return {
    ...base,
    name: creative.subjectIdentity || base.name,
    positioning: creative.positioning || base.positioning,
    centralStory: creative.coreStory || base.centralStory,
    biography: creative.biography || base.biography,
    audience: creative.audience || base.audience,
    claims: creative.claimToSourceMap.map((c) => ({
      text: c.claim,
      sourceUrl: c.sourceUrls[0],
      status: 'verified' as const,
    })),
    lenses: {
      cinematic: mapPremise(0, 'cinematic'),
      editorial: mapPremise(1, 'editorial'),
      intimate: mapPremise(2, 'intimate'),
    },
    quality: {
      ...base.quality,
      ready: creative.validation.ok && base.quality.ready,
      missing: creative.validation.ok ? base.quality.missing : creative.validation.reasons,
    },
  };
}

function enrichConceptsFromContentPackage(
  concepts: FactoryExperienceConcept[],
  pack: ContentPackage,
): FactoryExperienceConcept[] {
  return concepts.map((concept) => {
    const lens = detectConceptLens(concept);
    const lensCopy = pack.lenses[lens];
    return {
      ...concept,
      organizationName: pack.name,
      story: {
        sentence: lensCopy.heroSupporting,
        audience: pack.audience,
        transformation: lensCopy.aboutBody.slice(0, 280),
        proofSignals: [
          ...pack.accomplishments,
          ...pack.milestones,
          ...pack.claims.map((c) => c.text),
        ].slice(0, 6),
      },
      portal: {
        ...concept.portal,
        tone: concept.portal?.tone || lensCopy.portalPurpose,
      },
    };
  });
}

function creativeDirectionFromContentPackage(
  pack: ContentPackage,
  existing?: FactoryCreativeDirectionData | null,
): FactoryCreativeDirectionData {
  return {
    organizationName: pack.name,
    story: {
      sentence: pack.positioning,
      audience: pack.audience,
      transformation: pack.centralStory.slice(0, 280),
      proofSignals: pack.claims.map((c) => c.text).slice(0, 6),
    },
    homepageStoryBeats: pack.lenses.cinematic.sectionHeadlines,
    portalContinuity: {
      purpose: pack.lenses.cinematic.portalPurpose,
      firstView: pack.lenses.cinematic.sectionHeadlines.slice(0, 3),
    },
    visualDirection: existing?.visualDirection,
    antiPatterns: existing?.antiPatterns,
    experiencePrinciples: existing?.experiencePrinciples,
    publishingSafety: existing?.publishingSafety,
  };
}

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

/** Persistable preview rows — omit fat puck/websiteSite blobs (Airtable Payload JSON limits). */
export function slimConceptPreviewsPayload(
  payload: ConceptPreviewsPayload,
): Record<string, unknown> {
  return {
    schemaVersion: payload.schemaVersion,
    generatedAt: payload.generatedAt,
    projectId: payload.projectId,
    portalSlug: payload.portalSlug,
    recommendedConceptId: payload.recommendedConceptId,
    selectedConceptId: payload.selectedConceptId,
    selectionStatus: payload.selectionStatus,
    sourceConceptsArtifactId: payload.sourceConceptsArtifactId,
    previews: payload.previews.map((p) => ({
      conceptId: p.conceptId,
      name: p.name,
      lens: p.lens,
      recommended: p.recommended,
      websitePreviewPath: p.websitePreviewPath,
      portalPreviewPath: p.portalPreviewPath,
      compositionSignature: p.compositionSignature,
      themeId: p.themeId,
      primaryColor: p.primaryColor,
      accentColor: p.accentColor,
      // Portal shell recomposed on read — omit fat blobs for Airtable Payload JSON limits.
    })),
  };
}

/**
 * Resolve a renderable concept draft for preview routes.
 * Prefers persisted draft; recomposes from experience_concepts when puck/shell missing
 * (cross-instance production durability).
 */
export async function resolveConceptPreviewDraft(
  projectId: string,
  conceptId: string,
): Promise<
  | {
      ok: true;
      draft: ConceptPreviewDraft;
      source: 'persisted' | 'recomposed';
      projectId: string;
      conceptId: string;
    }
  | {
      ok: false;
      reason: string;
      projectId: string;
      conceptId: string;
      hasProject: boolean;
      hasConceptsArtifact: boolean;
      conceptIds: string[];
    }
> {
  const project = await getFactoryProject(projectId);
  if (!project) {
    console.error('[factory-concept-previews] preview lookup miss', {
      projectId,
      conceptId,
      source: 'factory-project-store',
      reason: 'project_not_found',
    });
    return {
      ok: false,
      reason: 'Factory project was not found in durable storage.',
      projectId,
      conceptId,
      hasProject: false,
      hasConceptsArtifact: false,
      conceptIds: [],
    };
  }

  const context = projectContextFromProject(project);
  const existing = getConceptPreviewDraft(context, conceptId);
  if (existing?.puckData && existing.portalShell) {
    return {
      ok: true,
      draft: existing,
      source: 'persisted',
      projectId,
      conceptId,
    };
  }

  const conceptsArt = readExperienceConceptsArtifact(context);
  const data = conceptsArt?.data as
    | {
        concepts?: FactoryExperienceConcept[];
        recommendedConceptId?: string | null;
        selectedConceptId?: string | null;
        selectionStatus?: string;
      }
    | undefined;
  const concepts = Array.isArray(data?.concepts) ? data!.concepts! : [];
  const conceptIds = concepts.map((c) => c.id);
  if (!conceptsArt || concepts.length === 0) {
    console.error('[factory-concept-previews] preview lookup miss', {
      projectId,
      conceptId,
      source: 'experience_concepts',
      reason: 'concepts_artifact_missing',
    });
    return {
      ok: false,
      reason: 'Concept designs are not ready yet. Wait for concept generation to finish.',
      projectId,
      conceptId,
      hasProject: true,
      hasConceptsArtifact: false,
      conceptIds,
    };
  }

  const match = concepts.find((c) => c.id === conceptId);
  if (!match) {
    console.error('[factory-concept-previews] preview lookup miss', {
      projectId,
      conceptId,
      source: 'experience_concepts',
      reason: 'concept_id_not_in_artifact',
      conceptIds,
    });
    return {
      ok: false,
      reason: `Concept "${conceptId}" is not in this project’s concept set.`,
      projectId,
      conceptId,
      hasProject: true,
      hasConceptsArtifact: true,
      conceptIds,
    };
  }

  try {
    const portalSlug =
      listConceptPreviewsFromContext(context)?.portalSlug || portalSlugForProject(project);
    const contentPackage =
      readContentPackageFromContext(context) || buildContentPackageFromProject(project);
    const eceBundle = readExperienceCreationBundleFromProject(project);
    const composed = composeConceptPreviews({
      projectId,
      portalSlug,
      concepts,
      creativeDirection: readCreativeDirection(context),
      contentPackage: eceBundle?.content
        ? contentPackageFromCreativePack(contentPackage, eceBundle.content)
        : contentPackage,
      heroImageUrl: resolveHeroImageUrl(
        contentPackage,
        eceBundle?.media.assets.find((a) => a.previewEligible)?.url,
      ),
      recommendedConceptId: data?.recommendedConceptId,
      selectedConceptId: data?.selectedConceptId,
      selectionStatus: data?.selectionStatus,
    });
    const draft = composed.previews.find((p) => p.conceptId === conceptId);
    if (!draft?.puckData || !draft.portalShell) {
      throw new Error('Recompose did not produce a renderable draft.');
    }
    console.info('[factory-concept-previews] preview recomposed on read', {
      projectId,
      conceptId,
      source: 'recomposed',
    });
    return {
      ok: true,
      draft,
      source: 'recomposed',
      projectId,
      conceptId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Concept preview recompose failed.';
    console.error('[factory-concept-previews] preview recompose failed', {
      projectId,
      conceptId,
      reason: message,
    });
    return {
      ok: false,
      reason: message,
      projectId,
      conceptId,
      hasProject: true,
      hasConceptsArtifact: true,
      conceptIds,
    };
  }
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
  contentPackage?: ContentPackage | null;
  heroImageUrl?: string;
  recommendedConceptId?: string | null;
  selectedConceptId?: string | null;
  selectionStatus?: string;
  generatedAt?: string;
}): ConceptPreviewsPayload {
  const at = input.generatedAt || new Date().toISOString();
  const portalLoginHref = publicPortalLoginUrl(input.portalSlug);
  // Never link Factory previews to unpublished /sites/** — return to Quick Launch review.
  const returnToConceptsHref = `/admin/ea-factory/quick-launch?projectId=${encodeURIComponent(input.projectId)}`;
  const sitePath = returnToConceptsHref;
  const pack = input.contentPackage || null;
  const concepts = pack
    ? enrichConceptsFromContentPackage(input.concepts, pack)
    : input.concepts;
  const creativeDirection = pack
    ? creativeDirectionFromContentPackage(pack, input.creativeDirection)
    : input.creativeDirection;

  const previews: ConceptPreviewDraft[] = concepts.map((concept) => {
    const fields = conceptToProvisionFields({
      concept,
      creativeDirection,
      portalSlug: input.portalSlug,
      portalLoginHref,
      sitePath,
      contentPackage: pack,
      heroImageUrl: input.heroImageUrl,
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

    const continuity = creativeDirection?.portalContinuity;
    const lens = fields.lens;
    const lensPurpose = pack?.lenses?.[lens]?.portalPurpose;

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
        purpose: lensPurpose || continuity?.purpose,
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

  const contentPackageBase = buildContentPackageFromProject(project);
  const eceBundle = readExperienceCreationBundleFromProject(project);
  const contentPackage = eceBundle?.content
    ? contentPackageFromCreativePack(contentPackageBase, eceBundle.content)
    : contentPackageBase;
  await appendProjectContextOutput(projectId, {
    kind: 'production',
    worker: CONTENT_PACKAGE_WORKER,
    payload: contentPackage,
    detail: contentPackage.quality.ready
      ? `Content package ready (${contentPackage.quality.factCount} facts)`
      : `Content package incomplete: ${contentPackage.quality.missing.join('; ') || 'missing evidence'}`,
  });

  const portalSlug = portalSlugForProject(project, options?.portalSlug);
  const creativeDirection = readCreativeDirection(context);

  let payload: ConceptPreviewsPayload;
  try {
    payload = composeConceptPreviews({
      projectId,
      portalSlug,
      concepts,
      creativeDirection,
      contentPackage,
      heroImageUrl: resolveHeroImageUrl(
        contentPackage,
        eceBundle?.media.assets.find((a) => a.previewEligible)?.url,
      ),
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

  const gate = evaluateConceptQualityGate({
    contentPackage,
    previews: payload,
  });
  if (!gate.ok) {
    console.warn('[factory-concept-previews] quality gate blocked review', {
      projectId,
      reasons: gate.reasons,
    });
    await appendProjectContextOutput(projectId, {
      kind: 'production',
      worker: 'concept-quality-gate',
      payload: {
        ok: false,
        reasons: gate.reasons,
        evaluatedAt: new Date().toISOString(),
      },
      detail: `Concept quality gate blocked: ${gate.reasons[0] || 'incomplete'}`,
    });
    return {
      ok: false,
      error: `Concept quality gate blocked Ready for review: ${gate.reasons.join(' ')}`,
    };
  }

  payload = {
    ...payload,
    sourceConceptsArtifactId: options?.sourceConceptsArtifactId || conceptsArt.id,
  };

  const slim = slimConceptPreviewsPayload(payload);
  const appended = await appendProjectContextOutput(projectId, {
    kind: 'production',
    worker: CONCEPT_PREVIEWS_WORKER,
    payload: slim,
    detail: `Composed ${payload.previews.length} directed concept previews`,
  });
  if (!appended) {
    return {
      ok: false,
      error:
        'Failed to persist concept preview metadata durably. Previews will not be shown until storage succeeds.',
    };
  }

  await appendProjectContextOutput(projectId, {
    kind: 'production',
    worker: 'concept-quality-gate',
    payload: {
      ok: true,
      reasons: [],
      evaluatedAt: new Date().toISOString(),
    },
    detail: 'Concept quality gate passed',
  });

  // Production: require Airtable durability before advertising preview URLs.
  const { airtableConfigured } = await import('@/lib/data/airtable-client');
  const { isProductionDeploy } = await import('@/lib/integration-env');
  if (isProductionDeploy() && airtableConfigured()) {
    const { verifyFactoryProjectDurable } = await import('@/lib/factory-project-store');
    const durable = await verifyFactoryProjectDurable(projectId);
    if (!durable) {
      console.error('[factory-concept-previews] durable verify failed after persist', {
        projectId,
      });
      return {
        ok: false,
        error:
          'Concept previews were generated but could not be verified in durable storage. Retry concept generation.',
      };
    }
    // Confirm experience_concepts still readable after clearing memory.
    const reloaded = await getFactoryProject(projectId);
    const reloadedConcepts = reloaded?.context
      ? readExperienceConceptsArtifact(projectContextFromProject(reloaded))
      : null;
    if (!reloadedConcepts) {
      return {
        ok: false,
        error:
          'Project reloaded without experience_concepts after save. Preview links withheld.',
      };
    }
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
