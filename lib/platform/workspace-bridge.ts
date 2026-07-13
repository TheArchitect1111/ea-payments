/**
 * Workspace Engine bridge ? assemble client shells without domain hard-coding.
 */
import { enableKeysToCapabilityIds } from '@ea/capability-registry';
import { getWorkspacePersonality } from '@ea/personality-engine';
import { getWorkspaceTheme } from '@ea/theme-engine';
import { assembleWorkspaceShell, type WorkspaceShell } from '@ea/workspace-engine';
import type { ModuleId } from '@/lib/modules/registry';
import type { Organization } from '@/lib/organizations';
import {
  getPlatformCapabilityRegistry,
  mapModuleIdsToCapabilityIds,
} from './capability-bootstrap';
import {
  getPlatformClientConfig,
  listPlatformClients,
  PLATFORM_CLIENT_CONFIGS,
  type PlatformClientConfig,
} from './client-configs';

export function assembleWorkspaceForClient(clientId: string): WorkspaceShell | null {
  const client = getPlatformClientConfig(clientId);
  if (!client) return null;
  return assembleWorkspaceFromPlatformClient(client);
}

export function assembleWorkspaceFromPlatformClient(
  client: PlatformClientConfig,
): WorkspaceShell {
  return assembleWorkspaceShell(
    {
      organizationId: client.organizationId,
      name: client.name,
      workspaceName: client.workspaceName,
      themeId: client.themeId,
      personalityId: client.personalityId,
      enabledCapabilityIds: enableKeysToCapabilityIds(client.enabledModuleKeys),
      plannedCapabilityIds: enableKeysToCapabilityIds(client.plannedModuleKeys),
      terminology: client.terminology,
      aiProfile: client.personalityId,
    },
    { registry: getPlatformCapabilityRegistry() },
  );
}

/**
 * Map a live portal slug/org to a platform client preset (heuristic fallback).
 */
export function resolvePlatformClientIdForPortal(
  slug: string,
  orgId?: string,
): string {
  const s = (slug || '').toLowerCase();
  const o = (orgId || '').toLowerCase().replace(/^org_/, '');

  if (o && PLATFORM_CLIENT_CONFIGS[o]) return o;

  if (s.includes('cpr') || o.includes('cpr')) return 'cpr';
  if (s.includes('etfm') || o.includes('etfm')) return 'etfm';
  if (s.includes('3hc') || o.includes('3hc')) return '3hc';
  if (
    s.includes('rumball') ||
    s.includes('bob-rumball') ||
    s.startsWith('bob') ||
    o.includes('rumball') ||
    o.includes('bob')
  ) {
    return 'bob-rumball';
  }

  return 'ea';
}

export type PortalWorkspaceOverrides = {
  platformClientId: string;
  themeId: string;
  personalityId: string;
  workspaceName: string;
  brandName?: string;
  logo?: string;
  themeOverlay?: {
    primaryColor?: string;
    accentColor?: string;
    logo?: string;
  };
};

/** Parse Organizations.Brand Colors as JSON or "primary,accent" hex list. */
export function parseOrganizationBrandColors(raw?: string): {
  primaryColor?: string;
  accentColor?: string;
} {
  if (!raw?.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return {
      primaryColor: parsed.primary || parsed.primaryColor || undefined,
      accentColor: parsed.accent || parsed.accentColor || undefined,
    };
  } catch {
    const parts = raw
      .split(/[,;]/)
      .map((p) => p.trim())
      .filter(Boolean);
    return {
      primaryColor: parts[0],
      accentColor: parts[1],
    };
  }
}

function knownThemeId(id?: string): string | undefined {
  if (!id?.trim()) return undefined;
  const key = id.trim();
  const theme = getWorkspaceTheme(key);
  if (theme.id === key || theme.organizationId === key) return theme.id;
  return undefined;
}

function knownPersonalityId(id?: string): string | undefined {
  if (!id?.trim()) return undefined;
  const personality = getWorkspacePersonality(id.trim());
  // getWorkspacePersonality always returns a personality; accept only exact id match
  return personality.id === id.trim() ? personality.id : undefined;
}

function knownPlatformClientId(id?: string): string | undefined {
  if (!id?.trim()) return undefined;
  return getPlatformClientConfig(id.trim()) ? id.trim() : undefined;
}

/**
 * Resolve workspace config: Airtable org fields ? slug heuristics ? ea default.
 */
export function resolveWorkspaceConfigFromOrg(
  org: Organization | null | undefined,
  slug: string,
  orgId?: string,
): PortalWorkspaceOverrides {
  const platformClientId =
    knownPlatformClientId(org?.platformClientId) ||
    resolvePlatformClientIdForPortal(slug, orgId);

  const preset =
    getPlatformClientConfig(platformClientId) ?? getPlatformClientConfig('ea')!;

  const themeId = knownThemeId(org?.themeId) || preset.themeId;
  const personalityId =
    knownPersonalityId(org?.personalityId) || preset.personalityId;
  const workspaceName = org?.workspaceName?.trim() || preset.workspaceName;
  const brandColors = parseOrganizationBrandColors(org?.brandColors);
  const logo = org?.logo?.trim() || undefined;

  return {
    platformClientId,
    themeId,
    personalityId,
    workspaceName,
    brandName: org?.name?.trim() || preset.name,
    logo,
    themeOverlay: {
      ...(brandColors.primaryColor ? { primaryColor: brandColors.primaryColor } : {}),
      ...(brandColors.accentColor ? { accentColor: brandColors.accentColor } : {}),
      ...(logo ? { logo } : {}),
    },
  };
}

/**
 * Assemble a workspace shell for a live portal session.
 * Capabilities from live entitlements; theme/personality from org overrides + preset.
 */
export function resolveWorkspaceShellForPortal(input: {
  slug: string;
  orgId: string;
  enabledModuleIds: Iterable<ModuleId | string>;
  platformClientId?: string;
  organization?: Organization | null;
  themeId?: string;
  personalityId?: string;
  workspaceName?: string;
  brandName?: string;
  themeOverlay?: PortalWorkspaceOverrides['themeOverlay'];
}): WorkspaceShell {
  const fromOrg = resolveWorkspaceConfigFromOrg(
    input.organization,
    input.slug,
    input.orgId,
  );

  const platformClientId =
    knownPlatformClientId(input.platformClientId) || fromOrg.platformClientId;
  const client =
    getPlatformClientConfig(platformClientId) ?? getPlatformClientConfig('ea')!;
  const moduleIds = [...input.enabledModuleIds] as ModuleId[];

  const themeId = knownThemeId(input.themeId) || fromOrg.themeId;
  const personalityId =
    knownPersonalityId(input.personalityId) || fromOrg.personalityId;
  const workspaceName =
    input.workspaceName?.trim() || fromOrg.workspaceName || client.workspaceName;
  const brandName = input.brandName?.trim() || fromOrg.brandName || client.name;
  const themeOverlay = {
    ...fromOrg.themeOverlay,
    ...input.themeOverlay,
  };

  return assembleWorkspaceShell(
    {
      organizationId: input.orgId,
      name: brandName,
      workspaceName,
      themeId,
      theme: themeOverlay,
      personalityId,
      enabledCapabilityIds: mapModuleIdsToCapabilityIds(moduleIds),
      plannedCapabilityIds: enableKeysToCapabilityIds(client.plannedModuleKeys),
      terminology: client.terminology,
      aiProfile: personalityId,
    },
    { registry: getPlatformCapabilityRegistry() },
  );
}

export function listWorkspaceShellSummaries() {
  return listPlatformClients().map((client) => {
    const shell = assembleWorkspaceFromPlatformClient(client);
    return {
      id: client.id,
      organizationId: shell.organizationId,
      name: shell.name,
      workspaceName: shell.workspaceName,
      themeId: shell.theme.id,
      personalityId: shell.personality.id,
      terminologyHome: shell.terminology.home,
      enabledCapabilityCount: shell.surface.enabledCapabilityIds.length,
      missingCapabilityCount: shell.surface.missingCapabilityIds.length,
      navCount: shell.surface.navigation.length,
      widgetCount: shell.surface.widgets.length,
      sectionOrder: shell.sectionOrder,
      primaryActions: shell.primaryActions,
    };
  });
}

export type { WorkspaceShell };
