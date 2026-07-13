/**
 * Map PlatformClientConfig → landing-chassis LandingPageConfig.
 * Resolves presets and live org portal slugs (Airtable overrides).
 */
import type { LandingPageConfig } from '@/lib/landing-chassis/types';
import {
  getWorkspacePersonality,
  normalizeWorkspacePersonality,
} from '@ea/personality-engine';
import {
  getWorkspaceTheme,
  normalizeWorkspaceTheme,
} from '@ea/theme-engine';
import { findOrganizationByPortalSlug } from '@/lib/organizations';
import {
  getPlatformClientConfig,
  listPlatformClients,
  type PlatformClientConfig,
} from './client-configs';
import { assembleWebsiteForClient } from './website-bridge';
import {
  resolvePlatformClientIdForPortal,
  resolveWorkspaceConfigFromOrg,
} from './workspace-bridge';
import { getContentPackForClient } from './content-packs';

export type LandingSiteOverrides = {
  brandName?: string;
  workspaceName?: string;
  themeId?: string;
  personalityId?: string;
  logo?: string;
  /** Portal login / CTA path */
  portalSlug?: string;
  primaryColor?: string;
  accentColor?: string;
  heroHeadline?: string;
  heroLede?: string;
  ctaLabel?: string;
  seoTitle?: string;
  seoDescription?: string;
};

export type ResolvedPublicSite = {
  slug: string;
  platformClientId: string;
  source: 'preset' | 'organization' | 'heuristic';
  organizationId?: string;
  organizationName?: string;
  contentPackId?: string;
  contentPackLabel?: string;
  config: LandingPageConfig;
  /** Preset id for admin reproduce preview links */
  reproduceClientId: string;
};

function gradientDataUri(from: string, to: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function splitBrandName(name: string): { nameLine1: string; nameLine2: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return { nameLine1: name, nameLine2: '' };
  return { nameLine1: parts[0]!, nameLine2: parts.slice(1).join(' ') };
}

function membersWord(client: PlatformClientConfig, terminology: Record<string, string>): string {
  return terminology.members || client.terminology.members || 'Members';
}

/** Build a publishable LandingPageConfig from a platform client preset (+ optional live overrides). */
export function buildLandingPageConfigForClient(
  clientId: string,
  overrides: LandingSiteOverrides = {},
): LandingPageConfig | null {
  const client = getPlatformClientConfig(clientId);
  if (!client) return null;

  const assembled = assembleWebsiteForClient(clientId, {
    heroHeadline: overrides.heroHeadline,
    heroLede: overrides.heroLede,
    ctaLabel: overrides.ctaLabel,
    seoTitle: overrides.seoTitle,
    seoDescription: overrides.seoDescription,
  });
  if (!assembled) return null;

  const themeId = overrides.themeId || client.themeId;
  const personalityId = overrides.personalityId || client.personalityId;
  const theme = normalizeWorkspaceTheme(getWorkspaceTheme(themeId));
  const personality = normalizeWorkspacePersonality(getWorkspacePersonality(personalityId));
  const terminology = assembled.terminology;
  const copy = {
    ...assembled.copy,
    brandName: overrides.brandName?.trim() || assembled.copy.brandName,
    workspaceName: overrides.workspaceName?.trim() || assembled.copy.workspaceName,
    heroHeadline: overrides.heroHeadline || assembled.copy.heroHeadline,
    heroLede: overrides.heroLede || assembled.copy.heroLede,
    ctaLabel: overrides.ctaLabel || assembled.copy.ctaLabel,
    seoTitle: overrides.seoTitle || assembled.copy.seoTitle,
    seoDescription: overrides.seoDescription || assembled.copy.seoDescription,
  };

  const brandName = copy.brandName;
  const workspaceName = copy.workspaceName;
  const members = membersWord(client, terminology);
  const brand = splitBrandName(brandName);
  const primary = overrides.primaryColor || theme.primaryColor;
  const accent = overrides.accentColor || theme.accentColor;
  const heroImage = gradientDataUri(primary, accent);
  const portalSlug = overrides.portalSlug?.trim() || client.id;
  const applyHref = `/portal/${portalSlug}`;
  const logo = overrides.logo?.trim() || '/ea-logo.png';
  const cta = copy.ctaLabel;

  const enabledKinds = new Set(
    assembled.sections.filter((s) => s.kind !== 'brand').map((s) => s.kind),
  );

  const config: LandingPageConfig = {
    brand: {
      nameLine1: brand.nameLine1,
      nameLine2: brand.nameLine2 || workspaceName,
      tagline: workspaceName,
      logo,
    },
    colors: {
      primary,
      primaryBright: accent,
      black: theme.textColor || '#0C0C0A',
      dark: theme.backgroundColor || '#08090B',
      offWhite: theme.surfaceColor || '#F7F7F7',
      white: '#FFFFFF',
    },
    links: {
      apply: applyHref,
      video: '#process',
      schedule: '/contact',
    },
    nav: [
      { label: 'Home', href: '#top' },
      ...(enabledKinds.has('features') || enabledKinds.has('content')
        ? [{ label: 'About', href: '#difference' }]
        : []),
      { label: members, href: applyHref },
      { label: 'Contact', href: '/contact' },
    ],
    possibility: {
      headline: copy.heroHeadline,
      subheadline: copy.heroLede,
      supporting: copy.startPrompt || terminology.startPrompt || `Built for ${members.toLowerCase()}.`,
      image: heroImage,
      applyLabel: cta,
      videoLabel: 'See how it works',
    },
    socialProof: {
      heading: `What ${members.toLowerCase()} say`,
      items: [
        {
          quote: `${workspaceName} finally feels like it was built for us.`,
          name: `${members.slice(0, -1) || 'Member'} story`,
          role: brandName,
          photo: logo,
        },
        {
          quote: personality.name
            ? `The ${personality.name.toLowerCase()} experience keeps decisions clear.`
            : 'Clear decisions. Less noise.',
          name: 'Operator',
          role: workspaceName,
          photo: logo,
        },
        {
          quote: copy.heroLede,
          name: 'Team lead',
          role: members,
          photo: logo,
        },
      ],
    },
    challenge: {
      heading: 'The challenge',
      intro: `Most ${members.toLowerCase()} juggle tools that were never designed to work together.`,
      painPoints: [
        'Scattered updates across email, chats, and documents',
        'No single branded home for the people you serve',
        'Portals and landings that drift apart from each other',
      ],
    },
    difference: {
      heading: 'The difference',
      subheading: `One ClientConfig reproduces both the ${workspaceName} portal and this landing.`,
      cards: [
        {
          title: 'Theme + personality',
          description: `${themeId} · ${personality.name} — applied to portal and marketing surfaces.`,
        },
        {
          title: 'Capability-aware',
          description: 'Enabled modules and entitlements stay aligned with what the landing promises.',
        },
        {
          title: 'Reproducible',
          description: 'Spin up the next client from the same factory without rebuilding the chassis.',
        },
        {
          title: `Built for ${members.toLowerCase()}`,
          description: terminology.startPrompt || copy.heroLede,
        },
      ],
    },
    process: {
      heading: 'How it works',
      subheading: 'Configuration in. Portal and landing out.',
      steps: [
        {
          label: 'Choose a preset',
          description: `Start from ${brandName} configuration — theme, personality, capabilities.`,
          icon: 'apply',
        },
        {
          label: 'Assemble surfaces',
          description: 'Website engine + workspace engine share the same ClientConfig envelope.',
          icon: 'manage',
        },
        {
          label: 'Publish',
          description: 'Live portal and this landing page — ready for your next client.',
          icon: 'send',
        },
      ],
    },
    portal: {
      heading: workspaceName,
      subheading: `A ${personality.name.toLowerCase()} workspace for ${members.toLowerCase()}.`,
      features: [
        {
          title: terminology.home || 'Home',
          description: 'Branded command surface with personality-aware copy.',
          icon: 'manage',
        },
        {
          title: terminology.focus || 'Focus',
          description: 'Primary actions and attention lanes from the workspace personality.',
          icon: 'trackicon',
        },
        {
          title: 'Updates',
          description: 'Advisor activity and messaging when those capabilities are enabled.',
          icon: 'updates',
        },
      ],
      dashboardImage: heroImage,
    },
    results: {
      heading: 'Results that compound',
      subheading: 'Same chassis. Different brand. Faster launches.',
      stats: [
        { value: String(assembled.sections.length), label: 'Landing sections' },
        { value: '1', label: 'ClientConfig' },
        { value: '2', label: 'Surfaces (portal + site)' },
      ],
      proofs: [
        { image: heroImage, caption: `${brandName} landing` },
        { image: logo, caption: workspaceName },
      ],
      profileCta: cta,
      profileHref: applyHref,
    },
    founder: {
      heading: `Meet ${brand.nameLine1}`,
      role: workspaceName,
      story:
        copy.seoDescription ||
        `${brandName} runs on the EA reproduction engine — portals and landings from configuration.`,
      image: logo,
    },
    finalCta: {
      heading: copy.heroHeadline,
      subheading: copy.heroLede,
      applyLabel: cta,
      scheduleLabel: 'Talk to us',
    },
    footer: {
      about: copy.seoDescription || `${brandName} — ${workspaceName}`,
      quickLinks: [
        { label: 'Portal', href: applyHref },
        { label: 'Home', href: '#top' },
        { label: 'Contact', href: '/contact' },
      ],
      resources: [
        { label: 'Portal login', href: applyHref },
        { label: 'Contact', href: '/contact' },
      ],
      email: 'hello@efficiencyarchitects.com',
      instagramLabel: brandName,
      location: 'Efficiency Architects',
      copyright: `© ${new Date().getFullYear()} ${brandName}. Assembled from ClientConfig.`,
    },
  };

  const disabled = new Set(client.landing?.disabledSectionIds ?? []);
  if (disabled.has('landing.socialProof')) {
    config.socialProof.items = [];
  }

  const pack = getContentPackForClient(clientId);
  if (pack) {
    return pack.apply(config, {
      brandName,
      workspaceName,
      portalSlug,
      members,
      logo,
    });
  }

  return config;
}

function withPackMeta(
  site: Omit<ResolvedPublicSite, 'contentPackId' | 'contentPackLabel'>,
): ResolvedPublicSite {
  const pack = getContentPackForClient(site.platformClientId);
  return {
    ...site,
    contentPackId: pack?.id,
    contentPackLabel: pack?.label,
  };
}

/**
 * Resolve a public site by URL slug:
 * 1. Exact platform preset id (ea, cpr, …)
 * 2. Live Organization by Portal Slug (Airtable overrides)
 * 3. Slug heuristics → nearest preset
 */
export async function resolvePublicSiteBySlug(
  rawSlug: string,
): Promise<ResolvedPublicSite | null> {
  const slug = rawSlug.trim().toLowerCase();
  if (!slug) return null;

  const presetDirect = getPlatformClientConfig(slug);
  if (presetDirect) {
    const config = buildLandingPageConfigForClient(slug, { portalSlug: slug });
    if (!config) return null;
    return withPackMeta({
      slug,
      platformClientId: slug,
      source: 'preset',
      config,
      reproduceClientId: slug,
    });
  }

  const org = await findOrganizationByPortalSlug(slug);
  if (org) {
    const resolved = resolveWorkspaceConfigFromOrg(org, slug, org.id);
    const preset = getPlatformClientConfig(resolved.platformClientId);
    const config = buildLandingPageConfigForClient(resolved.platformClientId, {
      brandName: resolved.brandName || org.name,
      workspaceName: resolved.workspaceName,
      themeId: resolved.themeId,
      personalityId: resolved.personalityId,
      logo: resolved.logo,
      portalSlug: slug,
      primaryColor: resolved.themeOverlay?.primaryColor,
      accentColor: resolved.themeOverlay?.accentColor,
      heroHeadline:
        preset?.landing?.heroHeadline?.replace(preset.name, org.name) ||
        `Welcome to ${org.name}`,
      heroLede: `Your ${resolved.workspaceName} — portal and landing from one ClientConfig.`,
      seoTitle: `${org.name} | ${resolved.workspaceName}`,
      seoDescription: `${org.name} portal and landing assembled from ClientConfig.`,
    });
    if (!config) return null;
    return withPackMeta({
      slug,
      platformClientId: resolved.platformClientId,
      source: 'organization',
      organizationId: org.id,
      organizationName: org.name,
      config,
      reproduceClientId: resolved.platformClientId,
    });
  }

  const heuristicId = resolvePlatformClientIdForPortal(slug);
  const config = buildLandingPageConfigForClient(heuristicId, {
    portalSlug: slug,
    brandName: slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
  });
  if (!config) return null;
  return withPackMeta({
    slug,
    platformClientId: heuristicId,
    source: 'heuristic',
    config,
    reproduceClientId: heuristicId,
  });
}

export function publicSitePathForSlug(slug: string): string {
  return `/site/${encodeURIComponent(slug)}`;
}

/** @deprecated Prefer publicSitePathForSlug */
export function publicSitePathForClient(clientId: string): string {
  return publicSitePathForSlug(clientId);
}

export function listPublicSiteClients(): Array<{ id: string; name: string; path: string }> {
  return listPlatformClients().map((c) => ({
    id: c.id,
    name: c.name,
    path: publicSitePathForSlug(c.id),
  }));
}
