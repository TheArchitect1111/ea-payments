/**
 * Experience Creation Engine orchestrator.
 * Produces durable packs, manifests, critic result — then concept compose can consume them.
 * Production missing providers → BLOCKED_PROVIDER (never fake finished creative).
 */
import { createArtifactId, provenanceFromContext } from '@/lib/factory-artifact';
import {
  appendProjectContextOutput,
  projectContextFromProject,
} from '@/lib/factory-project-context';
import { getFactoryProject, type FactoryProject } from '@/lib/factory-project-store';
import { publicPortalLoginUrl } from '@/lib/ctp-portal-host';
import { buildSubjectKnowledgePack } from '@/lib/experience-creation/build-knowledge-pack';
import { buildMediaBrandPack } from '@/lib/experience-creation/build-media-pack';
import { buildContentCreativePack } from '@/lib/experience-creation/build-content-creative-pack';
import { buildExperienceManifests } from '@/lib/experience-creation/build-experience-manifests';
import { evaluateExperienceCritic } from '@/lib/experience-creation/critic';
import { evaluateMultimodalExperienceCritic } from '@/lib/experience-creation/multimodal-critic';
import { assessExperienceProviderReadiness } from '@/lib/experience-creation/provider-readiness';
import type { ExperienceCreationBundle } from '@/lib/experience-creation/types';
import { portalSlugFromClientLike } from '@/lib/experience-creation/portal-slug';
import { isProductionDeploy } from '@/lib/integration-env';

export const EXPERIENCE_CREATION_WORKER = 'experience-creation-engine';

export type RunExperienceCreationResult =
  | { ok: true; bundle: ExperienceCreationBundle; project: FactoryProject }
  | {
      ok: false;
      error: string;
      blockedProvider?: boolean;
      bundle?: ExperienceCreationBundle;
      project: FactoryProject | null;
    };

export async function runExperienceCreationEngine(
  projectId: string,
  options?: { allowDeterministicFixture?: boolean; requireMultimodalCritic?: boolean },
): Promise<RunExperienceCreationResult> {
  const project = await getFactoryProject(projectId);
  if (!project) return { ok: false, error: 'Factory project not found.', project: null };

  const readiness = assessExperienceProviderReadiness({
    allowDeterministicFixture: options?.allowDeterministicFixture,
  });

  if (!readiness.canGeneratePacks && !options?.allowDeterministicFixture) {
    await appendProjectContextOutput(projectId, {
      kind: 'production',
      worker: EXPERIENCE_CREATION_WORKER,
      payload: {
        ok: false,
        status: 'BLOCKED_PROVIDER',
        readiness,
        generatedAt: new Date().toISOString(),
      },
      detail: `BLOCKED_PROVIDER: ${readiness.reasons[0] || 'required providers unavailable'}`,
    });
  }

  const knowledge = await buildSubjectKnowledgePack(project);
  if (
    !options?.allowDeterministicFixture &&
    !readiness.research.ready &&
    isProductionDeploy()
  ) {
    return {
      ok: false,
      blockedProvider: true,
      error: `BLOCKED_PROVIDER: ${readiness.reasons[0] || 'research provider unavailable'}`,
      project,
    };
  }

  const media = await buildMediaBrandPack(project, knowledge);
  const content = await buildContentCreativePack(knowledge, media, {
    allowDeterministicFixture: options?.allowDeterministicFixture,
  });

  if (!content.validation.ok && /BLOCKED_PROVIDER/i.test(content.validation.reasons.join(' '))) {
    const portalSlug = portalSlugFromClientLike(project);
    const manifests = buildExperienceManifests({
      knowledge,
      media,
      content,
      projectId,
      returnToConceptsHref: `/admin/ea-factory/quick-launch?projectId=${encodeURIComponent(projectId)}`,
      portalLoginHref: publicPortalLoginUrl(portalSlug),
    });
    const critic = {
      ok: false,
      scores: {},
      reasons: content.validation.reasons,
      repairHistory: [],
    };
    const bundle: ExperienceCreationBundle = { knowledge, media, content, manifests, critic };
    await persistBundle(projectId, project, bundle, readiness);
    return {
      ok: false,
      blockedProvider: true,
      error: content.validation.reasons.join(' '),
      bundle,
      project,
    };
  }

  const portalSlug = portalSlugFromClientLike(project);
  const returnToConceptsHref = `/admin/ea-factory/quick-launch?projectId=${encodeURIComponent(projectId)}`;
  const portalLoginHref = publicPortalLoginUrl(portalSlug);

  let manifests = buildExperienceManifests({
    knowledge,
    media,
    content,
    projectId,
    returnToConceptsHref,
    portalLoginHref,
  });

  const requireMm = Boolean(options?.requireMultimodalCritic);
  let critic = requireMm
    ? await evaluateMultimodalExperienceCritic({
        knowledge,
        media,
        content,
        manifests,
        requireMultimodal: true,
      })
    : evaluateExperienceCritic({ knowledge, media, content, manifests });

  // Structural packs may pass; certification GO still requires multimodal elsewhere.
  if (!requireMm && isProductionDeploy() && !readiness.canCertify) {
    critic = {
      ...critic,
      repairHistory: [
        ...critic.repairHistory,
        'Packs generated; multimodal certification still required before GO (vision provider or screenshots).',
      ],
    };
  }

  const repairHistory = [...critic.repairHistory];

  if (!critic.ok && critic.reasons.some((r) => /similar|leakage|Forbidden/i.test(r))) {
    repairHistory.push('Repair pass: rebuilding content pack from evidence via creative provider.');
    const repairedContent = await buildContentCreativePack(
      { ...knowledge, warnings: [...knowledge.warnings, 'repair-pass'] },
      media,
      { allowDeterministicFixture: options?.allowDeterministicFixture },
    );
    if (repairedContent.validation.ok) {
      const facts = knowledge.claims.map((c) => c.text);
      repairedContent.premises = repairedContent.premises.map((p, i) => ({
        ...p,
        heroHeadline:
          i === 0
            ? repairedContent.premises[0]!.heroHeadline
            : i === 1
              ? `A profile of ${knowledge.verifiedIdentity.name}`
              : `Meet ${knowledge.verifiedIdentity.name}`,
        heroSupporting: facts[i] || p.heroSupporting,
      }));
      manifests = buildExperienceManifests({
        knowledge,
        media,
        content: repairedContent,
        projectId,
        returnToConceptsHref,
        portalLoginHref,
      });
      critic = requireMm
        ? await evaluateMultimodalExperienceCritic({
            knowledge,
            media,
            content: repairedContent,
            manifests,
            requireMultimodal: true,
          })
        : evaluateExperienceCritic({
            knowledge,
            media,
            content: repairedContent,
            manifests,
          });
      critic.repairHistory = repairHistory;
      const bundle: ExperienceCreationBundle = {
        knowledge,
        media,
        content: repairedContent,
        manifests,
        critic,
      };
      await persistBundle(projectId, project, bundle, readiness);
      if (!critic.ok) {
        return {
          ok: false,
          error: `Experience critic blocked concepts: ${critic.reasons.join(' ')}`,
          bundle,
          project,
        };
      }
      return { ok: true, bundle, project: (await getFactoryProject(projectId)) || project };
    }
  }

  const bundle: ExperienceCreationBundle = {
    knowledge,
    media,
    content,
    manifests,
    critic: { ...critic, repairHistory },
  };
  await persistBundle(projectId, project, bundle, readiness);

  if (!readiness.canGeneratePacks && !options?.allowDeterministicFixture) {
    return {
      ok: false,
      blockedProvider: true,
      error: `BLOCKED_PROVIDER: ${readiness.reasons[0] || 'required providers unavailable'}`,
      bundle,
      project,
    };
  }

  if (!knowledge.validation.ok) {
    return {
      ok: false,
      error: `Knowledge pack incomplete: ${knowledge.validation.reasons.join(' ')}`,
      bundle,
      project,
    };
  }
  if (!critic.ok) {
    return {
      ok: false,
      error: `Experience critic blocked concepts: ${critic.reasons.join(' ')}`,
      bundle,
      project,
    };
  }

  return { ok: true, bundle, project: (await getFactoryProject(projectId)) || project };
}

async function persistBundle(
  projectId: string,
  project: FactoryProject,
  bundle: ExperienceCreationBundle,
  readiness?: ReturnType<typeof assessExperienceProviderReadiness>,
) {
  const context = project.context ? projectContextFromProject(project) : null;
  const at = new Date().toISOString();

  await appendProjectContextOutput(projectId, {
    kind: 'production',
    worker: EXPERIENCE_CREATION_WORKER,
    payload: {
      ok: bundle.critic.ok && bundle.knowledge.validation.ok,
      generatedAt: at,
      critic: bundle.critic,
      readiness: readiness || null,
      knowledgeSummary: {
        facts: bundle.knowledge.claims.length,
        citations: bundle.knowledge.citations.length,
        validation: bundle.knowledge.validation,
      },
      mediaSummary: {
        assets: bundle.media.assets.length,
        typographyLed: bundle.media.intentionalTypographyLed,
        openverse: bundle.media.assets.filter((a) => a.mediaProvider === 'openverse').length,
        rejected: bundle.media.assets.filter((a) => a.usageStatus === 'rejected').length,
      },
      premiseNames: bundle.manifests.map((m) => m.premiseName),
      compositions: bundle.manifests.map((m) =>
        m.pageStructure.map((s) => s.composition).join('→'),
      ),
    },
    detail: bundle.critic.ok
      ? 'Experience Creation Engine packs ready'
      : `Experience Creation Engine blocked: ${bundle.critic.reasons[0] || 'incomplete'}`,
  });

  await appendProjectContextOutput(projectId, {
    kind: 'production',
    worker: 'subject-knowledge-pack',
    payload: bundle.knowledge,
    detail: `Knowledge pack (${bundle.knowledge.claims.length} claims)`,
  });
  await appendProjectContextOutput(projectId, {
    kind: 'production',
    worker: 'media-brand-pack',
    payload: bundle.media,
    detail: `Media pack (${bundle.media.assets.length} assets)`,
  });
  await appendProjectContextOutput(projectId, {
    kind: 'production',
    worker: 'content-creative-pack',
    payload: bundle.content,
    detail: `Content creative pack (${bundle.content.premises.length} premises)`,
  });
  await appendProjectContextOutput(projectId, {
    kind: 'production',
    worker: 'experience-manifests',
    payload: { manifests: bundle.manifests },
    detail: `Experience manifests (${bundle.manifests.length})`,
  });

  if (context) {
    void createArtifactId;
    void provenanceFromContext;
  }
}

export function readExperienceCreationBundleFromProject(
  project: FactoryProject,
): ExperienceCreationBundle | null {
  const outputs = project.context?.outputs || [];
  const knowledge = [...outputs]
    .filter((o) => o.worker === 'subject-knowledge-pack')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .at(-1)?.payload as ExperienceCreationBundle['knowledge'] | undefined;
  const media = [...outputs]
    .filter((o) => o.worker === 'media-brand-pack')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .at(-1)?.payload as ExperienceCreationBundle['media'] | undefined;
  const content = [...outputs]
    .filter((o) => o.worker === 'content-creative-pack')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .at(-1)?.payload as ExperienceCreationBundle['content'] | undefined;
  const manifestsPayload = [...outputs]
    .filter((o) => o.worker === 'experience-manifests')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .at(-1)?.payload as { manifests?: ExperienceCreationBundle['manifests'] } | undefined;
  const criticOut = [...outputs]
    .filter((o) => o.worker === EXPERIENCE_CREATION_WORKER)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .at(-1)?.payload as { critic?: ExperienceCreationBundle['critic'] } | undefined;

  if (!knowledge || !media || !content || !manifestsPayload?.manifests) return null;
  return {
    knowledge,
    media,
    content,
    manifests: manifestsPayload.manifests,
    critic: criticOut?.critic || {
      ok: false,
      scores: {},
      reasons: ['Critic result missing'],
      repairHistory: [],
    },
  };
}
