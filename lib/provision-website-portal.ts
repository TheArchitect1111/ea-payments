/**
 * Auto-provision a published starter website for Website + Portal Starter purchases.
 */
import type { Data } from '@measured/puck';
import {
  getExperiencePage,
  listExperiencePages,
  saveExperiencePage,
  verifyExperiencePageDurable,
} from '@/lib/experience-builder/page-store';
import { previewPathForPage, type ExperiencePage } from '@/lib/experience-builder/types';
import { airtableConfigured } from '@/lib/data/airtable-client';
import { publicPortalLoginUrl } from '@/lib/ctp-portal-host';
import { ensureOrganizationForPortal, findOrganizationByPortalSlug } from '@/lib/organizations';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';
import { syntheticOrgId } from '@/lib/platform-store';

export type WebsitePortalProvisionInput = {
  portalSlug: string;
  businessName: string;
  organizationName?: string;
  /** Persisted Organizations record id (not synthetic org_*). */
  organizationId?: string;
  tagline?: string;
  industry?: string;
  email?: string;
  /** When true, refresh/create Home page even if one already exists. */
  force?: boolean;
};

export type WebsitePortalProvisionResult = {
  ok: boolean;
  pageId?: string;
  siteUrl?: string;
  previewPath?: string;
  error?: string;
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

export function buildStarterWebsitePuckData(input: WebsitePortalProvisionInput): Data {
  const brand = input.organizationName?.trim() || input.businessName.trim() || 'Your Business';
  const tagline =
    input.tagline?.trim() ||
    'A clear offer, a trusted next step, and a client portal that keeps work moving.';
  const industry = input.industry?.trim();
  const portalLogin = publicPortalLoginUrl();
  const sitePath = sitePathForSlug(input.portalSlug);

  return {
    root: { props: { title: brand } },
    content: [
      {
        type: 'EAHero',
        props: {
          id: 'hero-1',
          eyebrow: industry || 'Now live',
          title: brand,
          subtitle: tagline,
          ctaLabel: 'Get started',
          ctaHref: '#contact',
        },
      },
      {
        type: 'EATextSection',
        props: {
          id: 'about-1',
          label: 'About',
          title: `Welcome to ${brand}`,
          body: industry
            ? `${brand} helps people in ${industry} move from interest to action with a clear offer and guided next steps.`
            : `${brand} helps people move from interest to action with a clear offer, proof, and a simple next step.`,
        },
      },
      {
        type: 'EAFeatures',
        props: {
          id: 'features-1',
          label: 'What you get',
          title: 'Clarity, trust, and a place to work together',
          featureOneTitle: 'Clear offer',
          featureOneBody: 'Visitors understand who you serve and what becomes possible.',
          featureTwoTitle: 'Client portal',
          featureTwoBody: 'Updates, resources, and messages live in one secure workspace.',
          featureThreeTitle: 'Guided next step',
          featureThreeBody: 'One primary action so people know exactly what to do next.',
        },
      },
      {
        type: 'EACtaBand',
        props: {
          id: 'cta-1',
          title: 'Ready to continue?',
          body: 'Visit your live site anytime, or sign in to the client portal to manage updates and resources.',
          primaryLabel: 'Open client portal',
          primaryHref: portalLogin,
          secondaryLabel: 'View this site',
          secondaryHref: sitePath,
        },
      },
    ],
    zones: {},
  };
}

export async function findPublishedSitePage(portalSlug: string): Promise<ExperiencePage | null> {
  const slug = portalSlug.trim().toLowerCase();
  const orgCandidates = [syntheticOrgId(slug), slug];
  try {
    const org = await findOrganizationByPortalSlug(slug);
    if (org?.id) orgCandidates.unshift(org.id);
  } catch {
    // optional org lookup
  }

  for (const orgId of [...new Set(orgCandidates)]) {
    try {
      const pages = await listExperiencePages(orgId, slug);
      const published = pages.filter((page) => page.status === 'published');
      if (published.length === 0) continue;
      const home = published.find(
        (page) => page.title.toLowerCase() === 'home' || page.id.includes('-home-'),
      );
      return home || published[0];
    } catch {
      // try next org candidate
    }
  }
  return null;
}

async function resolvePersistedOrgId(input: WebsitePortalProvisionInput, slug: string): Promise<string | null> {
  const candidates = [input.organizationId, (await findOrganizationByPortalSlug(slug).catch(() => null))?.id];
  for (const id of candidates) {
    if (id && !id.startsWith('org_')) return id;
  }
  try {
    const { orgId } = await ensureOrganizationForPortal({
      portalSlug: slug,
      name: input.businessName,
      organizationName: input.organizationName || input.businessName,
    });
    if (orgId && !orgId.startsWith('org_')) return orgId;
  } catch {
    return null;
  }
  return null;
}

export async function provisionWebsitePortalSite(
  input: WebsitePortalProvisionInput,
): Promise<WebsitePortalProvisionResult> {
  const slug = input.portalSlug.trim().toLowerCase();
  if (!slug) {
    return { ok: false, error: 'Missing portal slug' };
  }

  try {
    const organizationId = await resolvePersistedOrgId(input, slug);
    if (!organizationId) {
      return {
        ok: false,
        error:
          'Experience Builder requires a persisted organization ID. Ensure Organizations table provisioning succeeded for this portal slug.',
      };
    }

    const existing = await findPublishedSitePage(slug);
    if (existing && !input.force) {
      return {
        ok: true,
        pageId: existing.id,
        siteUrl: siteUrlForSlug(slug),
        previewPath: existing.previewPath || previewPathForPage(slug, existing.id),
      };
    }

    const now = new Date().toISOString();
    const id = existing?.id || `exp-home-${slug}-${Date.now().toString(36)}`;
    const page: ExperiencePage = {
      id,
      organizationId,
      portalSlug: slug,
      title: 'Home',
      status: 'published',
      puckData: buildStarterWebsitePuckData({ ...input, portalSlug: slug }),
      updatedAt: now,
      publishedAt: existing?.publishedAt || now,
      previewPath: previewPathForPage(slug, id),
    };

    await saveExperiencePage(page);
    const saved = await getExperiencePage(id);
    if (!saved) {
      return { ok: false, error: 'Failed to persist website page' };
    }

    if (airtableConfigured()) {
      const durable = await verifyExperiencePageDurable(id);
      if (!durable) {
        return {
          ok: false,
          error:
            'Website page saved to memory but not confirmed in Airtable Creative Studio. Ensure the Creative Studio table exists and Record Type includes Experience.',
        };
      }
    }

    return {
      ok: true,
      pageId: saved.id,
      siteUrl: siteUrlForSlug(slug),
      previewPath: saved.previewPath,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Website provision failed',
    };
  }
}
