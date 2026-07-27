/**
 * Session 3 — Wire selected Factory concept into EA website + portal surfaces.
 * Reuses Experience Builder drafts, portal provision, member home, ED publish gate.
 * Does not invent a parallel portal/website stack.
 */
import type { Data } from '@measured/puck';
import { publicPortalLoginUrl, publicPortalUrl } from '@/lib/ctp-portal-host';
import { previewPathForPage, type ExperiencePage } from '@/lib/experience-builder/types';
import {
  listExperiencePages,
  saveExperiencePage,
} from '@/lib/experience-builder/page-store';
import {
  generateAndPersistConceptPreviews,
  getConceptPreviewDraft,
  listConceptPreviewsFromContext,
  readCreativeDirection,
  readExperienceConceptsArtifact,
  type ConceptPreviewDraft,
} from '@/lib/factory-concept-previews';
import { conceptToOrganizationStoryInput } from '@/lib/factory-concept-to-director';
import { projectContextFromProject } from '@/lib/factory-project-context';
import { getFactoryProject } from '@/lib/factory-project-store';
import { portalSlugFromFactoryProject } from '@/lib/factory-publish-website';
import { provisionExperiencePortalTenant } from '@/lib/experience-portal-provision';
import { getExperienceLaunchPreset } from '@/lib/experience-launch-presets';
import {
  ensureOrganizationForPortal,
  findOrganizationByPortalSlug,
} from '@/lib/organizations';
import {
  buildDefaultMemberHome,
  savePortalMemberHome,
} from '@/lib/portal-member-home';
import {
  provisionWebsitePortalSite,
  type WebsitePortalProvisionResult,
} from '@/lib/provision-website-portal';
import { isSiteQuarantined } from '@/lib/site-quarantine';

/** Chassis modules granted by website_portal_starter / Implementation Package. */
export const WIRED_CHASSIS_MODULES = ['simplifi', 'amplifi', 'connect', 'member'] as const;

export type WiredExperienceSurfaces = {
  draftPageId?: string;
  draftPreviewPath?: string;
  websitePreviewPath?: string;
  portalPreviewPath?: string;
  portalLoginUrl?: string;
  portalHomeUrl?: string;
  portalCtpUrl?: string;
  siteUrl?: string;
  publicSiteQuarantined: boolean;
  chassisModules: readonly string[];
  memberHomeSaved: boolean;
  themeId?: string;
  loginCtaPresent: boolean;
};

export type PublishSelectedConceptResult = {
  ok: boolean;
  error?: string;
  portalSlug?: string;
  organizationId?: string;
  selectedConceptId?: string;
  websiteStatus?: 'live' | 'quarantined' | 'draft_only' | 'skipped';
  website?: WebsitePortalProvisionResult;
  portal?: {
    ok: boolean;
    portalSlug?: string;
    orgId?: string;
    error?: string;
    tempCredentials?: unknown;
  };
  surfaces?: WiredExperienceSurfaces;
  directorGate?: WebsitePortalProvisionResult['directorGate'];
  directorReview?: WebsitePortalProvisionResult['directorReview'];
};

function resolvePortalSlug(
  project: { id: string; client: string },
  override?: string,
): string {
  if (override?.trim()) return override.trim().toLowerCase();
  if (project.client.toLowerCase().includes('amanda')) return 'amanda-catherine';
  return portalSlugFromFactoryProject(
    project as Parameters<typeof portalSlugFromFactoryProject>[0],
  );
}

function puckHasPortalLoginCta(puckData: Data, portalLoginHref: string): boolean {
  const hay = JSON.stringify(puckData);
  return (
    hay.includes(portalLoginHref) ||
    hay.includes('/portal/login') ||
    /"primaryHref"\s*:\s*"[^"]*portal/.test(hay)
  );
}

/**
 * Persist selected concept puck as an Experience Builder draft (not published).
 * Safe while public /sites/{slug} remains quarantined.
 */
export async function saveSelectedConceptDraftPage(input: {
  organizationId: string;
  portalSlug: string;
  draft: ConceptPreviewDraft;
  projectId: string;
}): Promise<{ pageId: string; previewPath: string }> {
  const slug = input.portalSlug.trim().toLowerCase();
  const existing = await listExperiencePages(input.organizationId, slug);
  const prior = existing.find(
    (page) =>
      page.status === 'draft' &&
      String(
        (page.puckData.root as { props?: Record<string, unknown> } | undefined)?.props
          ?.factoryConceptId || '',
      ) === input.draft.conceptId,
  );

  const now = new Date().toISOString();
  const id = prior?.id || `exp-concept-${slug}-${input.draft.conceptId}`.slice(0, 64);
  const themed: Data = {
    ...input.draft.puckData,
    root: {
      ...(input.draft.puckData.root || {}),
      props: {
        ...((input.draft.puckData.root as { props?: Record<string, unknown> } | undefined)
          ?.props || {}),
        themeId: input.draft.themeId,
        factoryConceptId: input.draft.conceptId,
        factoryConceptName: input.draft.name,
        factoryProjectId: input.projectId,
        title: input.draft.name,
      },
    } as Data['root'],
  };

  const page: ExperiencePage = {
    id,
    organizationId: input.organizationId,
    portalSlug: slug,
    title: `Home · ${input.draft.name}`,
    status: 'draft',
    puckData: themed,
    updatedAt: now,
    previewPath: previewPathForPage(slug, id),
  };

  const saved = await saveExperiencePage(page);
  return {
    pageId: saved.id,
    previewPath: saved.previewPath || previewPathForPage(slug, saved.id),
  };
}

/**
 * Wire selected concept → portal tenant + draft site + optional ED-gated publish.
 */
export async function publishSelectedFactoryConcept(input: {
  projectId: string;
  portalSlug?: string;
  activatePortal?: boolean;
  forceWebsite?: boolean;
  saveDraft?: boolean;
}): Promise<PublishSelectedConceptResult> {
  const project = await getFactoryProject(input.projectId);
  if (!project) return { ok: false, error: 'Factory project not found.' };

  let context = projectContextFromProject(project);
  const conceptsArt = readExperienceConceptsArtifact(context);
  if (!conceptsArt) {
    return { ok: false, error: 'No experience_concepts artifact on this project.' };
  }

  const conceptData = conceptsArt.data as {
    selectedConceptId?: string | null;
    selectionStatus?: string;
    concepts?: Array<{ id: string; name: string }>;
  };

  const selectedConceptId = conceptData.selectedConceptId?.trim();
  if (!selectedConceptId) {
    return {
      ok: false,
      error: 'No concept selected. Choose a concept before publish (selection gate).',
    };
  }
  const status = (conceptData.selectionStatus || '').toLowerCase();
  if (status === 'awaiting_review' || !status) {
    return {
      ok: false,
      error: `Concept selectionStatus is "${conceptData.selectionStatus || 'awaiting_review'}". Select a concept first.`,
    };
  }

  let previews = listConceptPreviewsFromContext(context);
  if (!previews?.previews?.length) {
    const generated = await generateAndPersistConceptPreviews(input.projectId, {
      portalSlug: input.portalSlug,
    });
    if (!generated.ok) {
      return { ok: false, error: generated.error };
    }
    context = projectContextFromProject(generated.project);
    previews = generated.payload;
  }

  const draft = getConceptPreviewDraft(context, selectedConceptId);
  if (!draft) {
    return {
      ok: false,
      error: `Selected concept ${selectedConceptId} has no composed preview. Generate previews first.`,
    };
  }

  let portalSlug = resolvePortalSlug(project, input.portalSlug || previews?.portalSlug);
  const creative = readCreativeDirection(context);
  const concept =
    (conceptData.concepts || []).find((c) => c.id === selectedConceptId) ||
    ({ id: selectedConceptId, name: draft.name } as { id: string; name: string });

  const preset =
    portalSlug === 'amanda-catherine'
      ? getExperienceLaunchPreset('amanda-catherine-editorial')
      : undefined;

  let portalResult: PublishSelectedConceptResult['portal'];
  let organizationId: string | undefined;

  if (input.activatePortal !== false) {
    const email =
      preset?.provision.email?.trim() ||
      `portal+${portalSlug.replace(/[^a-z0-9]/gi, '')}@efficiencyarchitects.online`;
    const portal = await provisionExperiencePortalTenant({
      clientName: orgNameFrom(draft, concept, creative) || draft.portalShell.organizationName,
      organization:
        orgNameFrom(draft, concept, creative) || draft.portalShell.organizationName,
      email,
      themeId: draft.themeId,
      workspaceName: `${draft.portalShell.organizationName} Experience`,
      primaryColor: draft.primaryColor,
      accentColor: draft.accentColor,
    });
    portalResult = {
      ok: portal.ok,
      portalSlug: portal.portalSlug,
      orgId: portal.orgId,
      error: portal.error,
      tempCredentials: portal.tempCredentials,
    };
    if (!portal.ok || !portal.portalSlug || !portal.orgId) {
      return {
        ok: false,
        error: portal.error || 'Portal tenant activation failed.',
        portalSlug,
        selectedConceptId,
        portal: portalResult,
      };
    }
    // Prefer the live provisioned slug (idempotent reuse for Amanda email).
    portalSlug = portal.portalSlug;
    organizationId = portal.orgId;
  } else {
    const existing = await findOrganizationByPortalSlug(portalSlug);
    if (existing?.id && !existing.id.startsWith('org_')) {
      organizationId = existing.id;
    } else {
      const ensured = await ensureOrganizationForPortal({
        portalSlug,
        name: draft.portalShell.organizationName,
        organizationName: draft.portalShell.organizationName,
      });
      if (ensured.orgId.startsWith('org_')) {
        return {
          ok: false,
          error:
            'Could not create a durable organization for this site. Check Airtable Organizations, then retry.',
          portalSlug,
          selectedConceptId,
        };
      }
      organizationId = ensured.orgId;
    }
  }

  const portalLoginHref = publicPortalLoginUrl(portalSlug);
  const orgStory = conceptToOrganizationStoryInput({
    concept: concept as never,
    creativeDirection: creative,
    portalSlug,
    portalLoginHref,
    sitePath: `/sites/${portalSlug}`,
  });

  let memberHomeSaved = false;
  try {
    await savePortalMemberHome({
      ...buildDefaultMemberHome({
        portalSlug,
        organizationId: organizationId!,
        organizationName: orgStory.organizationName,
      }),
      purpose: orgStory.member?.purpose || draft.portalShell.brandHeadline,
      talkingPoint: orgStory.member?.whereYouAre || draft.portalShell.memberWhere || '',
      businessValue: orgStory.member?.whatSuccessLooksLike || draft.portalShell.memberNext || '',
      tiles: ['Updates', 'Resources', 'Progress', 'Ask'],
      source: 'default',
    });
    memberHomeSaved = true;
  } catch (err) {
    console.error('[factory-wire] member home save failed:', err);
  }

  let draftPageId: string | undefined;
  let draftPreviewPath: string | undefined;
  if (input.saveDraft !== false) {
    try {
      const saved = await saveSelectedConceptDraftPage({
        organizationId: organizationId!,
        portalSlug,
        draft,
        projectId: input.projectId,
      });
      draftPageId = saved.pageId;
      draftPreviewPath = saved.previewPath;
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error
            ? `Draft site save failed: ${err.message}`
            : 'Draft site save failed.',
        portalSlug,
        organizationId,
        selectedConceptId,
        portal: portalResult,
      };
    }
  }

  const surfacesBase: WiredExperienceSurfaces = {
    draftPageId,
    draftPreviewPath,
    websitePreviewPath: draft.websitePreviewPath,
    portalPreviewPath: draft.portalPreviewPath,
    portalLoginUrl: portalLoginHref,
    portalHomeUrl: publicPortalUrl(portalSlug),
    portalCtpUrl: publicPortalUrl(portalSlug, 'ctp'),
    publicSiteQuarantined: isSiteQuarantined(portalSlug),
    chassisModules: WIRED_CHASSIS_MODULES,
    memberHomeSaved,
    themeId: draft.themeId,
    loginCtaPresent: puckHasPortalLoginCta(draft.puckData, portalLoginHref),
  };

  const quarantined = isSiteQuarantined(portalSlug);
  if (quarantined) {
    return {
      ok: true,
      portalSlug,
      organizationId,
      selectedConceptId,
      websiteStatus: 'draft_only',
      portal: portalResult,
      surfaces: surfacesBase,
      website: {
        ok: true,
        pageId: draftPageId,
        previewPath: draftPreviewPath,
        error:
          'Public /sites remains quarantined. Draft Experience page + portal chassis are wired for review. Set EA_AMANDA_SITE_LIVE=1 after cert to publish live.',
      },
    };
  }

  const website = await provisionWebsitePortalSite({
    portalSlug,
    businessName: orgStory.organizationName,
    organizationName: orgStory.organizationName,
    organizationId,
    headline: orgStory.brandHeadline,
    tagline: orgStory.brandSubhead,
    ctaLabel: orgStory.brandCta,
    primaryColor: draft.primaryColor,
    accentColor: draft.accentColor,
    themeId: draft.themeId,
    industry: orgStory.industry,
    whoTheyAre: orgStory.whoTheyAre,
    mission: orgStory.mission,
    story: orgStory.story,
    whyTheyExist: orgStory.whyTheyExist,
    whoTheyHelp: orgStory.whoTheyHelp,
    whyItMatters: orgStory.whyItMatters,
    whatChanges: orgStory.whatChanges,
    primaryAudience: orgStory.primaryAudience,
    differentiators: orgStory.differentiators,
    brandVoice: orgStory.brandVoice,
    member: orgStory.member,
    force: input.forceWebsite !== false,
  });

  if (!website.ok) {
    return {
      ok: false,
      error: website.error || 'Website publish through Experience Director gate failed.',
      portalSlug,
      organizationId,
      selectedConceptId,
      websiteStatus: 'skipped',
      website,
      portal: portalResult,
      surfaces: surfacesBase,
      directorGate: website.directorGate,
      directorReview: website.directorReview,
    };
  }

  return {
    ok: true,
    portalSlug,
    organizationId,
    selectedConceptId,
    websiteStatus: 'live',
    website,
    portal: portalResult,
    surfaces: {
      ...surfacesBase,
      siteUrl: website.siteUrl,
      publicSiteQuarantined: false,
    },
    directorGate: website.directorGate,
    directorReview: website.directorReview,
  };
}

function orgNameFrom(
  draft: ConceptPreviewDraft,
  concept: { name?: string },
  creative: { organizationName?: string | null } | null,
): string {
  return (
    creative?.organizationName?.trim() ||
    draft.portalShell.organizationName ||
    concept.name ||
    'Client'
  );
}

/** @deprecated Prefer publishSelectedFactoryConcept — kept for import stability. */
export { publishSelectedFactoryConcept as wireSelectedFactoryConcept };
