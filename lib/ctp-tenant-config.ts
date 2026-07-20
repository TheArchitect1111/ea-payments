/**
 * Configuration-driven tenant blueprint built from a completed CTP submission.
 * Portal and website engines stay generic — they consume this config as input only.
 */
import type { CtpSubmission } from '@/lib/ctp-submissions';
import { publicPortalLoginUrl, publicPortalUrl } from '@/lib/ctp-portal-host';
import { designStudioPath } from '@/lib/ctp-opportunity-routes';
import { sitePathForSlug, siteUrlForSlug } from '@/lib/provision-website-portal';

export type BrandOnboardingPath =
  | 'existing_brand'
  | 'brand_discovery'
  | 'inspiration'
  | 'creative_freedom';

/** Single client configuration used to provision org/workspace/website/portal. */
export type TenantClientConfig = {
  version: 1;
  source: 'ctp';
  ctpSubmissionId: string;
  organization: {
    name: string;
    contactName: string;
    email: string;
  };
  project: {
    id: string;
    proposalId: string;
    label: string;
  };
  workspace: {
    portalSlug: string;
    homePath: string;
    loginUrl: string;
    portalUrl: string;
  };
  website: {
    required: boolean;
    sitePath: string;
    siteUrl: string;
    tagline?: string;
    industry?: string;
  };
  branding: {
    brandOnboardingPath?: BrandOnboardingPath | string;
    colors?: string;
    fonts?: string;
    voice?: string;
    feel?: string;
  };
  modules: {
    /** Entitlement / package keys — engines resolve capabilities from these. */
    packagePurchased: string;
    commerceOfferId?: string;
    enabledModuleKeys: string[];
  };
  theme: {
    themeId: string;
    personalityId: string;
  };
  ai: {
    context: string;
  };
  integrations: {
    calendlyUrl?: string;
    supportEmail: string;
  };
  permissions: {
    portalAccess: 'Active';
    role: 'client';
  };
  createdAt: string;
};

function discoveryString(
  answers: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const value = answers?.[key];
  if (typeof value === 'string' && value.trim()) return value.trim();
  return undefined;
}

function wantsWebsite(submission: CtpSubmission): boolean {
  if (submission.clientTypeClassification?.websiteRequired) return true;
  return submission.clientType === 'website' || submission.clientType === 'website_portal';
}

function defaultModules(submission: CtpSubmission): string[] {
  const keys = ['ctp', 'documents', 'messaging', 'update-hub'];
  if (wantsWebsite(submission) || submission.clientType === 'website_portal') {
    keys.push('landing');
  }
  return keys;
}

/**
 * Build a durable tenant config from CTP + optional portalSlug.
 * Does not create records — pure mapping for the production provisioner.
 */
export function buildTenantClientConfigFromCtp(
  submission: CtpSubmission,
  portalSlug: string,
): TenantClientConfig {
  const slug = portalSlug.trim().toLowerCase();
  const answers = submission.discoveryAnswers;
  const brandPath = discoveryString(answers, 'brandOnboardingPath');
  const packagePurchased =
    submission.clientType === 'website_portal'
      ? 'Website + Portal Starter'
      : 'Consider The Possibilities™';

  const homePath = designStudioPath(slug);
  const tagline =
    discoveryString(answers, 'success_definition') ||
    discoveryString(answers, 'offer_summary') ||
    discoveryString(answers, 'landing_goal');
  const industry =
    discoveryString(answers, 'industry') || discoveryString(answers, 'organization_type');

  const aiBits = [
    `Organization: ${submission.businessName}`,
    `Contact: ${submission.contactName}`,
    tagline ? `Tagline: ${tagline}` : null,
    industry ? `Industry: ${industry}` : null,
    brandPath ? `Brand onboarding path: ${brandPath}` : null,
    discoveryString(answers, 'brand_feel')
      ? `Brand feel: ${discoveryString(answers, 'brand_feel')}`
      : null,
  ].filter(Boolean);

  return {
    version: 1,
    source: 'ctp',
    ctpSubmissionId: submission.id,
    organization: {
      name: submission.businessName,
      contactName: submission.contactName,
      email: submission.email,
    },
    project: {
      id: submission.id,
      proposalId: submission.proposalId || '',
      label: `CTP — ${submission.businessName}`,
    },
    workspace: {
      portalSlug: slug,
      homePath,
      loginUrl: publicPortalLoginUrl(),
      portalUrl: publicPortalUrl(slug, 'ctp'),
    },
    website: {
      required: wantsWebsite(submission),
      sitePath: sitePathForSlug(slug),
      siteUrl: siteUrlForSlug(slug),
      tagline,
      industry,
    },
    branding: {
      brandOnboardingPath: brandPath,
      colors: discoveryString(answers, 'brand_colors'),
      fonts: discoveryString(answers, 'brand_fonts'),
      voice: discoveryString(answers, 'brand_voice'),
      feel: discoveryString(answers, 'brand_feel'),
    },
    modules: {
      packagePurchased,
      commerceOfferId:
        submission.clientType === 'website_portal' ? 'website_portal_starter' : undefined,
      enabledModuleKeys: defaultModules(submission),
    },
    theme: {
      themeId: 'ea-default-theme',
      personalityId: 'executive',
    },
    ai: {
      context: aiBits.join('\n'),
    },
    integrations: {
      supportEmail: process.env.SUPPORT_EMAIL ?? 'freedom@efficiencyarchitects.online',
    },
    permissions: {
      portalAccess: 'Active',
      role: 'client',
    },
    createdAt: new Date().toISOString(),
  };
}

/** Read persisted TenantClientConfig from discoveryAnswers, if present. */
export function tenantConfigFromDiscovery(
  answers: Record<string, unknown> | undefined,
): TenantClientConfig | null {
  const raw = answers?.tenantClientConfig;
  if (!raw || typeof raw !== 'object') return null;
  const cfg = raw as TenantClientConfig;
  if (cfg.version !== 1 || cfg.source !== 'ctp') return null;
  return cfg;
}
