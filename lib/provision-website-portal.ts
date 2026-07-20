/**
 * Auto-provision a published starter website for Website + Portal Starter purchases
 * and Factory “Publish Future Website”.
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
import { EA_PLATFORM_URL } from '@/lib/platform-urls';
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

export type WebsitePortalProvisionInput = {
  portalSlug: string;
  businessName: string;
  organizationName?: string;
  /** Persisted org id (Airtable). Required for durable publish when Airtable is configured. */
  organizationId?: string;
  clientRecordId?: string;
  tagline?: string;
  /** Hero title override (defaults to brand name). */
  headline?: string;
  ctaLabel?: string;
  primaryColor?: string;
  accentColor?: string;
  industry?: string;
  email?: string;
  /** Optional About section body (notes / presence context). */
  aboutBody?: string;
  /** Their current site or presence link — mentioned in About when aboutBody is absent. */
  existingWebsiteUrl?: string;
  /** Logo/photo URL — stored for callers; About may mention presence without EAHero schema changes. */
  logoUrl?: string;
  /** When true, refresh/create Home page even if one already exists. */
  force?: boolean;
  /** Override Open client portal CTA (defaults to publicPortalLoginUrl). */
  portalLoginHref?: string;
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

export function buildStarterWebsitePuckData(input: WebsitePortalProvisionInput): Data {
  const brand = input.organizationName?.trim() || input.businessName.trim() || 'Your Business';
  const headline = input.headline?.trim() || brand;
  const tagline =
    input.tagline?.trim() ||
    'A clear offer, a trusted next step, and a client portal that keeps work moving.';
  const industry = input.industry?.trim();
  const existingWebsiteUrl = input.existingWebsiteUrl?.trim() || undefined;
  const aboutBody =
    input.aboutBody?.trim() ||
    buildDefaultAboutBody({ brand, industry, existingWebsiteUrl });
  const portalLogin = input.portalLoginHref || publicPortalLoginUrl();
  const sitePath = sitePathForSlug(input.portalSlug);
  const ctaLabel = input.ctaLabel?.trim() || 'Get started';
  const primaryColor = input.primaryColor?.trim() || undefined;
  const accentColor = input.accentColor?.trim() || undefined;

  return {
    root: {
      props: {
        title: brand,
        ...(primaryColor ? { primaryColor } : {}),
        ...(accentColor ? { accentColor } : {}),
      },
    },
    content: [
      {
        type: 'EAHero',
        props: {
          id: 'hero-1',
          eyebrow: industry || 'Now live',
          title: headline,
          subtitle: tagline,
          ctaLabel,
          ctaHref: '#contact',
        },
      },
      {
        type: 'EATextSection',
        props: {
          id: 'about-1',
          label: 'About',
          title: `Welcome to ${brand}`,
          body: aboutBody,
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

async function resolveOrganizationId(input: WebsitePortalProvisionInput, slug: string): Promise<string | null> {
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

/** Apply OIB/site brand tokens onto Organizations so PortalShell skins. */
export async function syncOrganizationPortalSkin(
  organizationId: string,
  input: {
    primaryColor?: string;
    accentColor?: string;
    logoUrl?: string;
    workspaceName?: string;
  },
): Promise<void> {
  if (!organizationId || organizationId.startsWith('org_')) return;
  const primary = input.primaryColor?.trim();
  const accent = input.accentColor?.trim();
  const logo = input.logoUrl?.trim();
  const workspaceName = input.workspaceName?.trim();
  if (!primary && !accent && !logo && !workspaceName) return;

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
    console.error('[provision-website-portal] member home seed failed:', err);
  }
}

export async function provisionWebsitePortalSite(
  input: WebsitePortalProvisionInput,
): Promise<WebsitePortalProvisionResult> {
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
