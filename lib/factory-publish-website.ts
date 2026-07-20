/**
 * Factory / OIB → live /sites/{slug} publish bridge.
 * Reuses provisionWebsitePortalSite — no new page engine.
 * Experience Director must Approve before publish.
 */
import { buildFactoryConceptPackAsync } from '@/lib/factory-concept-pack';
import { getLatestExperienceReviewFromProject } from '@/lib/factory-experience-director';
import {
  assertExperienceDirectorPublishGate,
  type ExperienceDirectorApprovalStatus,
} from '@/lib/factory-experience-review';
import { getFactoryProject, type FactoryProject } from '@/lib/factory-project-store';
import { ensureOrganizationForPortal } from '@/lib/organizations';
import {
  buildMemberHomeFromOpportunityBrief,
  savePortalMemberHome,
} from '@/lib/portal-member-home';
import {
  provisionWebsitePortalSite,
  type WebsitePortalProvisionResult,
} from '@/lib/provision-website-portal';

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export type WebsitePublishGateInput = {
  businessName: string;
  headline: string;
  primaryColor: string;
  accentColor: string;
};

export type WebsitePublishGateResult = {
  ok: boolean;
  missing: string[];
};

export function assertWebsitePublishGate(input: WebsitePublishGateInput): WebsitePublishGateResult {
  const missing: string[] = [];
  if (!input.businessName.trim()) missing.push('business name');
  if (!input.headline.trim()) missing.push('headline');
  if (!HEX.test(input.primaryColor.trim())) missing.push('primary color');
  if (!HEX.test(input.accentColor.trim())) missing.push('accent color');
  return { ok: missing.length === 0, missing };
}

export function portalSlugFromFactoryProject(project: FactoryProject, override?: string): string {
  const raw = (override || project.client || project.id).trim().toLowerCase();
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

export type PublishFactoryWebsiteResult = WebsitePortalProvisionResult & {
  portalSlug?: string;
  gate?: WebsitePublishGateResult;
  directorGate?: {
    ok: boolean;
    approvalStatus?: ExperienceDirectorApprovalStatus | 'Missing';
    error?: string;
  };
};

/**
 * Load OIB/concept brand from a Factory project and publish (or refresh) /sites/{slug}.
 * Blocked unless latest Experience Review is Approved.
 */
export async function publishFactoryWebsite(input: {
  projectId: string;
  portalSlug?: string;
  force?: boolean;
}): Promise<PublishFactoryWebsiteResult> {
  const project = await getFactoryProject(input.projectId);
  if (!project) {
    return { ok: false, error: 'Factory project not found.' };
  }

  const latestReview = getLatestExperienceReviewFromProject(project);
  const directorGate = assertExperienceDirectorPublishGate(latestReview?.review ?? null);
  if (!directorGate.ok) {
    return {
      ok: false,
      error: directorGate.error,
      directorGate: {
        ok: false,
        approvalStatus: directorGate.approvalStatus,
        error: directorGate.error,
      },
    };
  }

  const pack = await buildFactoryConceptPackAsync(project);
  const brand = pack.opportunityBrief?.brand;
  const businessName =
    pack.opportunityBrief?.organization?.trim() ||
    pack.clientName?.trim() ||
    project.client.trim() ||
    'Client';
  const headline = brand?.headline?.trim() || pack.landing?.headline?.trim() || businessName;
  const subhead = brand?.subhead?.trim() || pack.landing?.subhead?.trim() || undefined;
  const primaryColor = brand?.primary?.trim() || '#1B2B4D';
  const accentColor = brand?.accent?.trim() || '#C9A844';
  const ctaLabel = brand?.cta?.trim() || pack.landing?.cta?.trim() || 'Get started';

  const gate = assertWebsitePublishGate({
    businessName,
    headline,
    primaryColor,
    accentColor,
  });
  if (!gate.ok) {
    return {
      ok: false,
      error: `Publish gate failed — missing: ${gate.missing.join(', ')}`,
      gate,
      directorGate: { ok: true, approvalStatus: 'Approved' },
    };
  }

  const portalSlug = portalSlugFromFactoryProject(project, input.portalSlug);
  const { orgId } = await ensureOrganizationForPortal({
    portalSlug,
    name: businessName,
    organizationName: businessName,
  });

  if (orgId.startsWith('org_')) {
    return {
      ok: false,
      error:
        'Could not create a durable organization for this site. Check Airtable Organizations, then retry.',
      portalSlug,
      gate,
      directorGate: { ok: true, approvalStatus: 'Approved' },
    };
  }

  const result = await provisionWebsitePortalSite({
    portalSlug,
    businessName,
    organizationName: businessName,
    organizationId: orgId,
    tagline: subhead,
    headline,
    ctaLabel,
    primaryColor,
    accentColor,
    industry: pack.opportunityBrief?.industry || project.industry,
    logoUrl: brand?.logoUrl,
    aboutBody: pack.opportunityBrief?.whoTheyAre || pack.opportunityBrief?.website?.purpose,
    existingWebsiteUrl: project.url,
    force: input.force !== false,
  });

  if (result.ok && pack.opportunityBrief?.member) {
    try {
      await savePortalMemberHome(
        buildMemberHomeFromOpportunityBrief({
          portalSlug,
          organizationId: orgId,
          organizationName: businessName,
          brief: pack.opportunityBrief,
        }),
      );
    } catch (err) {
      console.error('[factory-publish-website] member home save failed:', err);
    }
  }

  return {
    ...result,
    portalSlug,
    gate,
    directorGate: { ok: true, approvalStatus: 'Approved' },
  };
}
