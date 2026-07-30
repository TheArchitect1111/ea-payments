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
import { parseDistinguishingDetail } from '@/lib/factory-identity-gate';
import {
  buildContentPackageFromProject,
  CONTENT_PACKAGE_WORKER,
  readContentPackageFromContext,
  type ContentPackage,
} from '@/lib/factory-content-package';
import { evaluateConceptQualityGate } from '@/lib/factory-concept-quality-gate';
import { findForbiddenPublicCopy } from '@/lib/factory-forbidden-copy.mjs';
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
import { CARE_CONTINUUM_SIGNATURE } from '@/lib/layout-composer/grammars/care-continuum-editorial';
import {
  applyRepairedPortalShell,
  applyRepairedPuckData,
  buildPublicCopyBundle,
  enforcePublicCopyQuality,
} from '@/lib/uxg';
import { buildStructuredEvidenceModel } from '@/lib/uxg/evidence-model';

export const CONCEPT_PREVIEWS_WORKER = 'concept-previews';

/** Temporary environment imagery — never a fabricated likeness; blocked from publication. */
function temporaryHeroImageUrl(pack: ContentPackage | null | undefined): string {
  const blob = `${pack?.name || ''} ${(pack?.organizations || []).join(' ')} ${(pack?.currentWork || []).join(' ')} ${pack?.biography || ''} ${pack?.centralStory || ''}`.toLowerCase();
  if (/liaison|hospice|home\s*health|hospital|patient|clinic|care|nurse|palliative/i.test(blob)) {
    return 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=2000&q=80';
  }
  if (/botanical|product|retail|shop|sku|collection|plant/i.test(blob)) {
    return 'https://images.unsplash.com/photo-1466781783362-7c4d8f2d5c5f?auto=format&fit=crop&w=1600&q=80';
  }
  if (/nonprofit|ministry|circle|congregation|community|faith/i.test(blob)) {
    return 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1600&q=80';
  }
  return 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80';
}

function resolveHeroImageUrl(
  pack: ContentPackage | null | undefined,
  eceUrl?: string,
): string {
  // Do not prefer ECE portrait candidates for healthcare until subject likeness is verified.
  const blob = `${pack?.name || ''} ${(pack?.organizations || []).join(' ')} ${pack?.biography || ''}`.toLowerCase();
  if (/liaison|hospice|home\s*health|palliative|clinical/i.test(blob)) {
    return temporaryHeroImageUrl(pack);
  }
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
  heroImageUrl?: string;
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
  copyQuality?: {
    ok: boolean;
    repaired: boolean;
    issueCount: number;
    examples: string[];
  };
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
      // Compact portal shell for list UIs; website puck is recomposed on read.
      portalShell: p.portalShell,
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
  const existingSig =
    typeof (existing?.puckData?.root as { props?: { compositionSignature?: string } } | undefined)
      ?.props?.compositionSignature === 'string'
      ? (existing!.puckData!.root as { props: { compositionSignature: string } }).props
          .compositionSignature
      : existing?.compositionSignature || '';
  // Healthcare: Concept A must be care-continuum; B/C must not collapse onto it.
  const isHealthcare = /hospice|home\s*health|clinical\s*liaison|care\s*coordination|palliative/i.test(
    `${project.client} ${project.notes || ''} ${existing?.name || ''}`,
  );
  const isConceptA = /concept-a\b/i.test(conceptId);
  const needsCareRecompose =
    isHealthcare &&
    Boolean(existingSig) &&
    ((isConceptA && existingSig !== CARE_CONTINUUM_SIGNATURE) ||
      (!isConceptA && existingSig === CARE_CONTINUUM_SIGNATURE));

  if (existing?.puckData && existing.portalShell && !needsCareRecompose) {
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
      projectNotes: project.notes,
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
  projectNotes?: string;
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
      projectNotes: input.projectNotes,
    });
    const composed = composeDirectedWebsite({
      organization: fields.organization,
      portalLoginHref,
      sitePath,
      primaryColor: fields.primaryColor,
      accentColor: fields.accentColor,
      returnHref: returnToConceptsHref,
      conceptLens: fields.lens,
    });

    const isCareContinuum =
      composed.composed.compositionSignature === CARE_CONTINUUM_SIGNATURE;

    if (!isCareContinuum && puckContainsFeatureCards(composed.puckData)) {
      throw new Error(
        `Concept ${concept.id} compose emitted EAFeatures (forbidden).`,
      );
    }

    const rootProps = (composed.puckData.root as { props?: Record<string, unknown> } | undefined)
      ?.props || {};
    const themeId =
      (typeof rootProps.themeId === 'string' && rootProps.themeId) || fields.themeId;

    const themedPuck: Data = {
      ...composed.puckData,
      root: {
        ...(composed.puckData.root || {}),
        props: {
          ...rootProps,
          themeId,
          factoryConceptId: concept.id,
          factoryConceptName: concept.name,
          compositionSignature: composed.composed.compositionSignature,
          storyClassification: composed.director.classification,
          // Never stamp director creativeDirection into public root for care continuum.
          ...(isCareContinuum
            ? { grammar: 'care-continuum-editorial' }
            : {
                creativeDirection: composed.director.creativeDirection,
                websiteSite: composed.websiteSite,
              }),
          websiteSite: composed.websiteSite,
        },
      } as unknown as Data['root'],
    };

    const continuity = creativeDirection?.portalContinuity;
    const lens = fields.lens;
    const lensPurpose = pack?.lenses?.[lens]?.portalPurpose;
    const portalFromGrammar = composed.portalShellExtras;

    let portalShell: Record<string, unknown> = portalFromGrammar
      ? {
          ...portalFromGrammar,
          heroImageUrl: portalFromGrammar.heroImageUrl || input.heroImageUrl,
        }
      : {
          tone: 'Private continuity after the public introduction',
          composition:
            concept.portal?.composition ||
            'Tools, progress, messages, and documents with one next action',
          purpose:
            lensPurpose ||
            continuity?.purpose ||
            `Private tools, progress, messages, and documents for ${fields.organization.organizationName} — not a restatement of the public page.`,
          firstView: Array.isArray(continuity?.firstView)
            ? continuity!.firstView!
            : ['Messages', 'Progress', 'Resources', 'Documents', 'Next step'],
          primaryColor: fields.primaryColor,
          accentColor: fields.accentColor,
          themeId,
          organizationName: fields.organization.organizationName,
          brandHeadline:
            fields.organization.brandHeadline || fields.organization.organizationName,
          brandSubhead:
            lensPurpose ||
            `Continue inside the private workspace — tools, progress, and documents.`,
          memberWhere:
            fields.organization.member?.whereYouAre ||
            'You are inside the private continuation of this relationship.',
          memberNext:
            fields.organization.member?.whatNext ||
            'Open tools, check progress, or send a message when ready.',
          heroImageUrl: input.heroImageUrl,
        };

    // Ensure portal purpose never mirrors website hero/about verbatim.
    if (
      typeof portalShell.purpose === 'string' &&
      typeof portalShell.brandSubhead === 'string' &&
      portalShell.purpose === fields.organization.brandSubhead
    ) {
      portalShell = {
        ...portalShell,
        purpose: `Private tools, progress, messages, and documents that continue the relationship — not a restatement of the public page.`,
      };
    }

    let puckData = themedPuck;
    const evidence = buildStructuredEvidenceModel({
      subjectIdentity: pack?.name || fields.organization.organizationName,
      distinguishingDetail: parseDistinguishingDetail(input.projectNotes || '') || undefined,
      organizations: pack?.organizations,
      biography: pack?.biography,
      claims: pack?.claims,
      sources: pack?.sources,
      currentWork: pack?.currentWork,
      milestones: pack?.milestones,
    });
    const bundle = buildPublicCopyBundle({ puckData, portalShell });
    const enforced = enforcePublicCopyQuality(bundle, evidence);
    if (enforced.repaired) {
      puckData = applyRepairedPuckData(puckData, enforced.bundle.fields);
      portalShell = applyRepairedPortalShell(portalShell, enforced.bundle.fields);
    }

    return {
      conceptId: concept.id,
      name: concept.name,
      lens: fields.lens,
      recommended: concept.id === input.recommendedConceptId,
      websitePreviewPath: `/preview/factory/${encodeURIComponent(input.projectId)}/${encodeURIComponent(concept.id)}`,
      portalPreviewPath: `/preview/factory/${encodeURIComponent(input.projectId)}/${encodeURIComponent(concept.id)}/portal`,
      compositionSignature: composed.composed.compositionSignature,
      themeId,
      primaryColor: (portalShell.primaryColor as string) || fields.primaryColor,
      accentColor: (portalShell.accentColor as string) || fields.accentColor,
      puckData,
      portalShell: portalShell as ConceptPortalShellPreview,
      websiteSite: composed.websiteSite,
      copyQuality: {
        ok: enforced.result.ok,
        repaired: enforced.repaired,
        issueCount: enforced.result.issues.length,
        examples: enforced.examples,
      },
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

  // Prefer a ready pack already on context (research / seed) over rebuilding stubs.
  // Never keep a "ready" pack that still contains forbidden public slogans.
  const existingPack = readContentPackageFromContext(context);
  const existingClean =
    Boolean(existingPack?.quality?.ready) && findForbiddenPublicCopy(existingPack).ok;
  const contentPackageBase = existingClean
    ? existingPack!
    : buildContentPackageFromProject(project);
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
      projectNotes: project.notes,
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
  // Cap context growth so Airtable Payload JSON stays within limits after recover retries.
  const projectForPersist = await getFactoryProject(projectId);
  if (projectForPersist?.context?.outputs && projectForPersist.context.outputs.length > 48) {
    const kept = [...projectForPersist.context.outputs].slice(-40);
    await saveFactoryProject({
      ...projectForPersist,
      context: { ...projectForPersist.context, outputs: kept, updatedAt: new Date().toISOString() },
      updatedAt: new Date().toISOString(),
    });
  }
  const appended = await appendProjectContextOutput(projectId, {
    kind: 'production',
    worker: CONCEPT_PREVIEWS_WORKER,
    payload: slim,
    detail: `Composed ${payload.previews.length} directed concept previews`,
  });
  if (!appended) {
    console.warn('[factory-concept-previews] slim preview metadata persist failed; drafts remain recomposable on read', {
      projectId,
    });
    // Still return composed payload — preview routes rehydrate from experience_concepts.
    return { ok: true, payload, project: (await getFactoryProject(projectId)) || project };
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
