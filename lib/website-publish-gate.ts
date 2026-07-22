/**
 * Unified Website Publish Gate — THE only path that may set ExperiencePage status=published.
 *
 * Pipeline (mandatory, every caller):
 *   Compose (Director → Layout Composer) → website_site → Experience Director → Approved? → persist
 *
 * Does not expand Experience Director scoring — reuses evaluateExperienceForDirector + assert gate.
 */
import type { Data } from '@measured/puck';
import { airtableConfigured } from '@/lib/data/airtable-client';
import {
  getExperiencePage,
  listExperiencePages,
  saveExperiencePage,
  verifyExperiencePageDurable,
} from '@/lib/experience-builder/page-store';
import { previewPathForPage, type ExperiencePage } from '@/lib/experience-builder/types';
import { evaluateExperienceForDirector } from '@/lib/factory-experience-director';
import {
  assertExperienceDirectorPublishGate,
  canPublishFromExperienceReview,
  type ExperienceReviewData,
} from '@/lib/factory-experience-review';
import { publicPortalLoginUrl } from '@/lib/ctp-portal-host';
import { composeDirectedWebsite, puckContainsFeatureCards } from '@/lib/layout-composer';
import {
  ensureOrganizationForPortal,
  findOrganizationByPortalSlug,
  updateOrganizationWorkspaceConfig,
} from '@/lib/organizations';
import {
  buildDefaultMemberHome,
  getPortalMemberHome,
  savePortalMemberHome,
} from '@/lib/portal-member-home';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';

export type WebsitePortalProvisionInput = {
  portalSlug: string;
  businessName: string;
  organizationName?: string;
  organizationId?: string;
  clientRecordId?: string;
  tagline?: string;
  headline?: string;
  ctaLabel?: string;
  primaryColor?: string;
  accentColor?: string;
  industry?: string;
  email?: string;
  aboutBody?: string;
  existingWebsiteUrl?: string;
  logoUrl?: string;
  themeId?: string;
  force?: boolean;
  portalLoginHref?: string;
  whoTheyAre?: string;
  mission?: string;
  story?: string;
  whyTheyExist?: string;
  whoTheyHelp?: string;
  whyItMatters?: string;
  whatChanges?: string;
  primaryAudience?: string;
  differentiators?: string[];
  brandVoice?: string;
  member?: {
    whereYouAre?: string;
    whatNext?: string;
    purpose?: string;
    whatSuccessLooksLike?: string;
  };
};

export type WebsitePublishGateResult = {
  ok: boolean;
  pageId?: string;
  siteUrl?: string;
  previewPath?: string;
  error?: string;
  directorReview?: ExperienceReviewData;
  directorGate?: ReturnType<typeof assertExperienceDirectorPublishGate>;
  compositionSignature?: string;
  skippedExisting?: boolean;
};

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || EA_PLATFORM_URL).replace(/\/$/, '');
}

export function sitePathForSlug(portalSlug: string): string {
  return `/sites/${portalSlug}`;
}

export function siteUrlForSlug(portalSlug: string): string {
  return `${baseUrl()}${sitePathForSlug(portalSlug)}`;
}

function buildDefaultAboutBody(input: {
  brand: string;
  industry?: string;
  existingWebsiteUrl?: string;
}): string {
  const base = input.industry
    ? `${input.brand} helps people in ${input.industry} move from interest to action with a clear offer and guided next steps.`
    : `${input.brand} helps people move from interest to action with a clear offer, proof, and a simple next step.`;
  if (input.existingWebsiteUrl) {
    return `${base}\n\nCurrent presence: ${input.existingWebsiteUrl}`;
  }
  return base;
}

async function resolveOrganizationId(
  input: WebsitePortalProvisionInput,
  slug: string,
): Promise<string | null> {
  const provided = input.organizationId?.trim();
  if (provided && !provided.startsWith('org_')) return provided;

  const existing = await findOrganizationByPortalSlug(slug);
  if (existing?.id && !existing.id.startsWith('org_')) return existing.id;

  const ensured = await ensureOrganizationForPortal({
    portalSlug: slug,
    name: input.businessName,
    organizationName: input.organizationName,
    clientRecordId: input.clientRecordId,
  });
  if (ensured.orgId && !ensured.orgId.startsWith('org_')) return ensured.orgId;
  return null;
}

async function syncOrganizationPortalSkin(
  organizationId: string,
  input: {
    primaryColor?: string;
    accentColor?: string;
    logoUrl?: string;
    workspaceName?: string;
    themeId?: string;
  },
): Promise<void> {
  if (!organizationId || organizationId.startsWith('org_')) return;
  const primary = input.primaryColor?.trim();
  const accent = input.accentColor?.trim();
  const logo = input.logoUrl?.trim();
  const workspaceName = input.workspaceName?.trim();
  const themeId = input.themeId?.trim();
  if (!primary && !accent && !logo && !workspaceName && !themeId) return;

  const brandColors =
    primary || accent
      ? JSON.stringify({
          ...(primary ? { primary } : {}),
          ...(accent ? { accent } : {}),
        })
      : undefined;

  await updateOrganizationWorkspaceConfig(organizationId, {
    ...(brandColors ? { brandColors } : {}),
    ...(logo ? { logo } : {}),
    ...(workspaceName ? { workspaceName } : {}),
    ...(themeId ? { themeId } : {}),
  });
}

async function ensureDefaultMemberHome(input: {
  portalSlug: string;
  organizationId: string;
  organizationName: string;
}): Promise<void> {
  try {
    const existing = await getPortalMemberHome(input.portalSlug, input.organizationId);
    if (existing) return;
    await savePortalMemberHome(
      buildDefaultMemberHome({
        portalSlug: input.portalSlug,
        organizationId: input.organizationId,
        organizationName: input.organizationName,
      }),
    );
  } catch (err) {
    console.error('[website-publish-gate] member home seed failed:', err);
  }
}

export async function findPublishedSitePage(portalSlug: string): Promise<ExperiencePage | null> {
  const slug = portalSlug.trim().toLowerCase();
  if (!slug) return null;

  const org = await findOrganizationByPortalSlug(slug);
  if (!org?.id || org.id.startsWith('org_')) return null;

  const pages = await listExperiencePages(org.id, slug);
  const published = pages.filter((page) => page.status === 'published');
  if (published.length === 0) return null;
  const home = published.find(
    (page) => page.title.toLowerCase() === 'home' || page.id.includes('-home-'),
  );
  return home || published[0];
}

function packFromProvisionInput(
  input: WebsitePortalProvisionInput,
  brand: string,
): Record<string, unknown> {
  return {
    industry: input.industry,
    opportunityBrief: {
      organization: brand,
      industry: input.industry,
      whoTheyAre: input.whoTheyAre || input.aboutBody,
      mission: input.mission || input.whyTheyExist,
      audience: input.primaryAudience || input.whoTheyHelp,
      whoTheyHelp: input.whoTheyHelp || input.primaryAudience,
      whyItMatters: input.whyItMatters,
      stakes: input.whyItMatters,
      whatChanges: input.whatChanges,
      outcomes: input.whatChanges,
      brand: {
        headline: input.headline || brand,
        voice: input.brandVoice || input.tagline,
        primary: input.primaryColor,
        accent: input.accentColor,
      },
      member: input.member || {
        whereYouAre: `Connected to ${brand} workspace.`,
        whatNext: 'Continue with the next guided step.',
        purpose: input.mission || input.whoTheyAre || brand,
        whatSuccessLooksLike: input.whatChanges || 'Clear progress and a trusted next step.',
      },
    },
  };
}

function attachDirectorMeta(
  puckData: Data,
  meta: {
    classification: unknown;
    creativeDirection: unknown;
    scenePlan: unknown;
    compositionSignature: string;
    directorReview: ExperienceReviewData;
    websiteSite?: Record<string, unknown>;
  },
): Data {
  const rootProps = {
    ...((puckData.root as { props?: Record<string, unknown> } | undefined)?.props || {}),
    storyClassification: meta.classification,
    creativeDirection: meta.creativeDirection,
    scenePlan: meta.scenePlan,
    compositionSignature: meta.compositionSignature,
    ...(meta.websiteSite ? { websiteSite: meta.websiteSite } : {}),
    experienceDirectorReview: {
      approvalStatus: meta.directorReview.approvalStatus,
      scores: meta.directorReview.scores,
      evaluatedAt: meta.directorReview.evaluatedAt,
      blueprintRef: meta.directorReview.blueprintRef,
    },
  };
  return {
    ...puckData,
    root: {
      ...(puckData.root || {}),
      props: rootProps,
    } as Data['root'],
  };
}

/**
 * Sole implementation that may publish a directed Website + Portal homepage.
 * Rejects when Experience Director is not Approved (overall ≥80 required by deriveApprovalStatus).
 */
export async function publishWebsiteThroughDirectorGate(
  input: WebsitePortalProvisionInput,
): Promise<WebsitePublishGateResult> {
  const slug = input.portalSlug.trim().toLowerCase();
  if (!slug) {
    return { ok: false, error: 'Missing portal slug' };
  }

  try {
    const organizationId = await resolveOrganizationId(input, slug);
    if (!organizationId) {
      return {
        ok: false,
        error:
          'Website publish requires a durable organization. Check Airtable Organizations for this portal slug.',
      };
    }

    const businessName =
      input.organizationName?.trim() || input.businessName.trim() || 'Your Business';

    await syncOrganizationPortalSkin(organizationId, {
      primaryColor: input.primaryColor,
      accentColor: input.accentColor,
      logoUrl: input.logoUrl,
      workspaceName: businessName,
      themeId: input.themeId,
    });
    await ensureDefaultMemberHome({
      portalSlug: slug,
      organizationId,
      organizationName: businessName,
    });

    const existing = await findPublishedSitePage(slug);
    if (existing && !input.force) {
      return {
        ok: true,
        pageId: existing.id,
        siteUrl: siteUrlForSlug(slug),
        previewPath: existing.previewPath || previewPathForPage(slug, existing.id),
        skippedExisting: true,
      };
    }

    const portalLogin = input.portalLoginHref || publicPortalLoginUrl(slug);
    const sitePath = sitePathForSlug(slug);
    const industry = input.industry?.trim();
    const existingWebsiteUrl = input.existingWebsiteUrl?.trim() || undefined;
    const aboutBody =
      input.aboutBody?.trim() ||
      buildDefaultAboutBody({ brand: businessName, industry, existingWebsiteUrl });

    const composed = composeDirectedWebsite({
      organization: {
        organizationName: businessName,
        industry,
        primaryAudience: input.primaryAudience || input.whoTheyHelp,
        whoTheyAre: input.whoTheyAre || aboutBody,
        mission: input.mission || input.whyTheyExist,
        story: input.story,
        whyTheyExist: input.whyTheyExist || input.mission,
        whoTheyHelp: input.whoTheyHelp || input.primaryAudience,
        whyItMatters: input.whyItMatters,
        whatChanges: input.whatChanges,
        differentiators: input.differentiators,
        brandHeadline: input.headline?.trim() || businessName,
        brandSubhead: input.tagline?.trim(),
        brandCta: input.ctaLabel?.trim(),
        brandVoice: input.brandVoice,
        primaryColor: input.primaryColor?.trim(),
        accentColor: input.accentColor?.trim(),
        portalLoginHref: portalLogin,
        sitePath,
        member: input.member,
      },
      portalLoginHref: portalLogin,
      sitePath,
      primaryColor: input.primaryColor?.trim(),
      accentColor: input.accentColor?.trim(),
    });

    if (puckContainsFeatureCards(composed.puckData)) {
      return {
        ok: false,
        error: 'Publish rejected — Layout Composer emitted EAFeatures (forbidden).',
      };
    }

    const pack = packFromProvisionInput(
      { ...input, aboutBody, portalSlug: slug },
      businessName,
    );
    const directorReview = evaluateExperienceForDirector({
      projectId: `publish:${slug}`,
      blueprintRef: `website_site:${slug}:${composed.composed.compositionSignature}`,
      site: composed.websiteSite,
      pack,
    });
    const directorGate = assertExperienceDirectorPublishGate(directorReview);
    if (!directorGate.ok || !canPublishFromExperienceReview(directorReview)) {
      return {
        ok: false,
        error:
          directorGate.error ||
          `Experience Director status is ${directorReview.approvalStatus} (overall ${directorReview.scores.overall}). Publish blocked.`,
        directorReview,
        directorGate,
        compositionSignature: composed.composed.compositionSignature,
      };
    }

    const puckData = attachDirectorMeta(composed.puckData, {
      classification: composed.director.classification,
      creativeDirection: composed.director.creativeDirection,
      scenePlan: composed.composed.scenes.map((item) => ({
        role: item.role,
        compositionId: item.compositionId,
        job: item.scene.job,
      })),
      compositionSignature: composed.composed.compositionSignature,
      directorReview,
      websiteSite: composed.websiteSite,
    });
    const themedPuckData: Data = {
      ...puckData,
      root: {
        ...(puckData.root || {}),
        props: {
          ...((puckData.root as { props?: Record<string, unknown> } | undefined)?.props || {}),
          themeId: input.themeId?.trim() || 'ea-default-theme',
        },
      } as Data['root'],
    };

    const now = new Date().toISOString();
    const id = existing?.id || `exp-home-${slug}-${Date.now().toString(36)}`;
    const page: ExperiencePage = {
      id,
      organizationId,
      portalSlug: slug,
      title: 'Home',
      status: 'published',
      puckData: themedPuckData,
      updatedAt: now,
      publishedAt: existing?.publishedAt || now,
      previewPath: previewPathForPage(slug, id),
    };

    await saveExperiencePage(page);
    const saved = await getExperiencePage(id);
    if (!saved) {
      return { ok: false, error: 'Failed to persist website page', directorReview, directorGate };
    }

    if (airtableConfigured()) {
      const durable = await verifyExperiencePageDurable(id);
      if (!durable) {
        return {
          ok: false,
          error:
            'Website page saved to memory but not confirmed in Airtable Creative Studio. Ensure the Creative Studio table exists and Record Type includes Experience.',
          directorReview,
          directorGate,
        };
      }
    }

    return {
      ok: true,
      pageId: saved.id,
      siteUrl: siteUrlForSlug(slug),
      previewPath: saved.previewPath,
      directorReview,
      directorGate,
      compositionSignature: composed.composed.compositionSignature,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Website publish gate failed',
    };
  }
}

/**
 * Experience Builder republish — same ED gate; uses stored website_site meta when present.
 */
export async function publishExistingExperiencePageThroughDirectorGate(input: {
  pageId: string;
  organizationId: string;
  portalSlug: string;
}): Promise<WebsitePublishGateResult> {
  const page = await getExperiencePage(input.pageId, input.organizationId);
  if (!page || page.portalSlug !== input.portalSlug) {
    return { ok: false, error: 'Portal access denied for this page.' };
  }

  const rootProps =
    (page.puckData.root as { props?: Record<string, unknown> } | undefined)?.props || {};
  const brand = String(rootProps.title || page.title || input.portalSlug);
  const websiteSite =
    rootProps.websiteSite && typeof rootProps.websiteSite === 'object'
      ? (rootProps.websiteSite as Record<string, unknown>)
      : null;

  // Prefer re-running directed compose from stored classification inputs when thin.
  if (!websiteSite) {
    return publishWebsiteThroughDirectorGate({
      portalSlug: input.portalSlug,
      businessName: brand,
      organizationName: brand,
      organizationId: input.organizationId,
      force: true,
      headline: typeof rootProps.primaryArchetype === 'string' ? brand : brand,
    });
  }

  const pack = {
    industry: String((websiteSite.organization as { industry?: string } | undefined)?.industry || ''),
    opportunityBrief: {
      organization: brand,
      industry: (websiteSite.organization as { industry?: string } | undefined)?.industry,
      whoTheyAre: (websiteSite.story as { whoTheyAre?: string } | undefined)?.whoTheyAre,
      mission: (websiteSite.story as { whyTheyExist?: string } | undefined)?.whyTheyExist,
      whoTheyHelp: (websiteSite.story as { whoTheyHelp?: string } | undefined)?.whoTheyHelp,
      whyItMatters: (websiteSite.story as { whyItMatters?: string } | undefined)?.whyItMatters,
      whatChanges: (websiteSite.story as { whatChanges?: string } | undefined)?.whatChanges,
      brand: websiteSite.brand,
      member: (websiteSite.portal as { memberHome?: Record<string, unknown> } | undefined)?.memberHome,
    },
  };

  const directorReview = evaluateExperienceForDirector({
    projectId: `publish-existing:${input.pageId}`,
    blueprintRef: String(rootProps.compositionSignature || input.pageId),
    site: websiteSite,
    pack,
  });
  const directorGate = assertExperienceDirectorPublishGate(directorReview);
  if (!directorGate.ok) {
    return {
      ok: false,
      error: directorGate.error,
      directorReview,
      directorGate,
    };
  }

  const now = new Date().toISOString();
  const updated = await saveExperiencePage({
    ...page,
    status: 'published',
    publishedAt: page.publishedAt || now,
    updatedAt: now,
    puckData: attachDirectorMeta(page.puckData, {
      classification: rootProps.storyClassification,
      creativeDirection: rootProps.creativeDirection,
      scenePlan: rootProps.scenePlan,
      compositionSignature: String(rootProps.compositionSignature || ''),
      directorReview,
    }),
  });

  return {
    ok: true,
    pageId: updated.id,
    siteUrl: siteUrlForSlug(input.portalSlug),
    previewPath: updated.previewPath,
    directorReview,
    directorGate,
  };
}
