/**
 * Live portal chrome ? entitlement nav + workspace shell theme/terminology.
 */
import { cookies } from 'next/headers';
import { getClientByPortalSlug } from '@/lib/airtable';
import { EA_PORTAL_COOKIE } from '@/lib/chassis/ea-portal';
import { verifySession } from '@/lib/ea-portal-auth';
import {
  applyCtpPortalModuleFilter,
  resolvePortalModuleAccess,
  toPortalSidebarNavGroups,
  type PortalSidebarNavGroup,
} from '@/lib/modules/portal-modules';
import {
  findOrganizationByPortalSlug,
  getOrganizationById,
  type Organization,
} from '@/lib/organizations';
import {
  resolveWorkspaceConfigFromOrg,
  resolveWorkspaceShellForPortal,
  type WorkspaceShell,
} from './workspace-bridge';

export type PortalWorkspaceWidget = {
  id: string;
  title: string;
  capabilityId: string;
  zone?: string;
};

/** Serializable props for PortalLayout / sidebar / header / assistant / dashboard. */
export type PortalWorkspaceChrome = {
  platformClientId: string;
  cssVars: Record<string, string>;
  brandName: string;
  workspaceName: string;
  logoSrc: string;
  logoAlt: string;
  memberLabel: string;
  homeLabel: string;
  promoTitle: string;
  promoCopy: string;
  aiContext: string;
  personalityId: string;
  personalityName: string;
  sectionOrder: string[];
  dashboardSections: string[];
  primaryActions: string[];
  emptyStateLanguage: string;
  focusLabel: string;
  attentionLabel: string;
  startLabel: string;
  widgets: PortalWorkspaceWidget[];
  shellNavGroups: PortalSidebarNavGroup[];
};

const EA_DEFAULT_CHROME: Omit<PortalWorkspaceChrome, 'shellNavGroups'> = {
  platformClientId: 'ea',
  cssVars: {},
  brandName: 'Efficiency Architects',
  workspaceName: 'Client Portal',
  logoSrc: '/ea-logo.png',
  logoAlt: 'Efficiency Architects',
  memberLabel: 'Portal member',
  homeLabel: 'Dashboard',
  promoTitle: 'Your operating rhythm',
  promoCopy: 'Pulse, Simplifi, Magnifi, and Amplifi ? unified in one portal.',
  aiContext: '',
  personalityId: 'executive',
  personalityName: 'Executive',
  sectionOrder: [
    'todaysFocus',
    'decisionsRequired',
    'executiveBriefing',
    'recentWork',
    'workspaceDock',
  ],
  dashboardSections: [
    'todaysFocus',
    'recentWork',
    'decisionsRequired',
    'executiveBriefing',
    'workspaceDock',
  ],
  primaryActions: ['Review recommendation', 'Open briefing', 'Approve next move'],
  emptyStateLanguage: 'No executive decisions need attention right now.',
  focusLabel: "Today's Focus",
  attentionLabel: 'Decisions Required',
  startLabel: 'Continue Building',
  widgets: [],
};

function chromeFromShell(
  platformClientId: string,
  shell: WorkspaceShell,
  shellNavGroups: PortalSidebarNavGroup[],
): PortalWorkspaceChrome {
  const logo = shell.theme.logo?.trim();
  return {
    platformClientId,
    cssVars: shell.cssVars,
    brandName: shell.name,
    workspaceName: shell.workspaceName,
    logoSrc: logo || '/ea-logo.png',
    logoAlt: shell.theme.logoAlt || shell.name,
    memberLabel: shell.terminology.members || 'Portal member',
    homeLabel: shell.terminology.home || 'Dashboard',
    promoTitle: shell.terminology.startPrompt ? 'Start here' : 'Your operating rhythm',
    promoCopy:
      shell.terminology.startPrompt ||
      shell.emptyStateLanguage ||
      EA_DEFAULT_CHROME.promoCopy,
    aiContext: shell.aiContext,
    personalityId: shell.personality.id,
    personalityName: shell.personality.name,
    sectionOrder: shell.sectionOrder?.length
      ? shell.sectionOrder
      : EA_DEFAULT_CHROME.sectionOrder,
    dashboardSections: shell.dashboardSections?.length
      ? shell.dashboardSections
      : EA_DEFAULT_CHROME.dashboardSections,
    primaryActions: shell.primaryActions?.length
      ? shell.primaryActions
      : EA_DEFAULT_CHROME.primaryActions,
    emptyStateLanguage:
      shell.emptyStateLanguage || EA_DEFAULT_CHROME.emptyStateLanguage,
    focusLabel: shell.terminology.focus || EA_DEFAULT_CHROME.focusLabel,
    attentionLabel: shell.terminology.attention || EA_DEFAULT_CHROME.attentionLabel,
    startLabel: shell.terminology.start || EA_DEFAULT_CHROME.startLabel,
    widgets: (shell.surface.widgets ?? []).map((w) => ({
      id: w.id,
      title: w.title,
      capabilityId: w.capabilityId,
      zone: w.zone,
    })),
    shellNavGroups,
  };
}

/** Resolve nav + workspace chrome for the current portal session (one pass). */
export async function resolvePortalWorkspaceChrome(
  slug: string,
): Promise<PortalWorkspaceChrome> {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session || session.slug !== slug) {
    return { ...EA_DEFAULT_CHROME, shellNavGroups: [] };
  }

  const client = await getClientByPortalSlug(slug);
  if (!client) {
    return { ...EA_DEFAULT_CHROME, shellNavGroups: [] };
  }

  const access = await resolvePortalModuleAccess({
    orgId: session.orgId,
    slug,
    packagePurchased: client.packagePurchased,
    role: session.role,
  });

  const filtered = await applyCtpPortalModuleFilter(access, {
    portalSlug: slug,
    email: session.email ?? client.email,
  });

  const shellNavGroups = toPortalSidebarNavGroups(filtered.shellNavGroups);
  const orgId = session.orgId ?? access.orgId;

  let organization: Organization | null = null;
  if (orgId && !orgId.startsWith('org_')) {
    organization = await getOrganizationById(orgId);
  }
  if (!organization) {
    organization = await findOrganizationByPortalSlug(slug);
  }

  const overrides = resolveWorkspaceConfigFromOrg(organization, slug, orgId);
  const shell = resolveWorkspaceShellForPortal({
    slug,
    orgId,
    enabledModuleIds: access.enabledModuleIds,
    organization,
    platformClientId: overrides.platformClientId,
    themeId: overrides.themeId,
    personalityId: overrides.personalityId,
    workspaceName: overrides.workspaceName,
    brandName: overrides.brandName,
    themeOverlay: overrides.themeOverlay,
  });

  return chromeFromShell(overrides.platformClientId, shell, shellNavGroups);
}
