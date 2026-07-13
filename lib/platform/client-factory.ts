/**
 * Reproduce a portal instance from a PlatformClientConfig preset.
 * Creates Organization + workspace fields + hub module entitlements.
 */
import { getMapRowByEnableKey } from '@ea/capability-registry';
import {
  createOrganization,
  findOrganizationByPortalSlug,
  updateOrganizationWorkspaceConfig,
  type Organization,
} from '@/lib/organizations';
import { setModulesEnabledBulk } from '@/lib/entitlements';
import { MODULE_IDS, type ModuleId } from '@/lib/modules/registry';
import { platformStoreConfigured } from '@/lib/platform-store';
import {
  getPlatformClientConfig,
  listPlatformClients,
  type PlatformClientConfig,
} from '@/lib/platform/client-configs';

const MODULE_ID_SET = new Set<string>(MODULE_IDS);

export type ClientFactoryInput = {
  /** Display name for the new organization */
  name: string;
  /** Portal URL slug — unique */
  portalSlug: string;
  /** Preset: ea | cpr | etfm | 3hc | bob-rumball */
  platformClientId: string;
  /** Optional overrides (defaults from preset) */
  themeId?: string;
  personalityId?: string;
  workspaceName?: string;
  industry?: string;
  mission?: string;
};

export type ClientFactoryResult = {
  ok: true;
  organization: Organization;
  platformClientId: string;
  portalUrl: string;
  workspacePreviewUrl: string;
  reproducePreviewUrl: string;
  landingPreviewUrl: string;
  publicSiteUrl: string;
  entitlements: {
    requestedEnableKeys: string[];
    mappedModuleIds: ModuleId[];
    skippedEnableKeys: string[];
    enabled: ModuleId[];
    failed: ModuleId[];
  };
  preset: Pick<
    PlatformClientConfig,
    'id' | 'name' | 'workspaceName' | 'themeId' | 'personalityId' | 'enabledModuleKeys'
  >;
};

export type ClientFactoryError = {
  ok: false;
  error: string;
  code:
    | 'store_unavailable'
    | 'invalid_input'
    | 'unknown_preset'
    | 'slug_taken'
    | 'create_failed'
    | 'workspace_failed';
};

function slugify(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

/** Map workspace enableKeys → hub MODULE_IDS (skips unmapped / non-hub keys). */
export function enableKeysToHubModuleIds(enableKeys: string[]): {
  moduleIds: ModuleId[];
  skipped: string[];
} {
  const seen = new Set<ModuleId>();
  const skipped: string[] = [];

  for (const key of enableKeys) {
    const row = getMapRowByEnableKey(key);
    const moduleId = row?.moduleId;
    if (!moduleId || !MODULE_ID_SET.has(moduleId)) {
      skipped.push(key);
      continue;
    }
    seen.add(moduleId as ModuleId);
  }

  // Every portal needs a home surface
  seen.add('dashboard');

  return { moduleIds: [...seen], skipped };
}

export async function reproduceClientFromPreset(
  input: ClientFactoryInput,
): Promise<ClientFactoryResult | ClientFactoryError> {
  if (!platformStoreConfigured()) {
    return {
      ok: false,
      error: 'Platform store (Airtable) is not configured.',
      code: 'store_unavailable',
    };
  }

  const name = input.name?.trim();
  const portalSlug = slugify(input.portalSlug || name || '');
  const platformClientId = input.platformClientId?.trim();

  if (!name || !portalSlug || !platformClientId) {
    return {
      ok: false,
      error: 'name, portalSlug, and platformClientId are required.',
      code: 'invalid_input',
    };
  }

  const preset = getPlatformClientConfig(platformClientId);
  if (!preset) {
    return {
      ok: false,
      error: `Unknown platform client preset: ${platformClientId}`,
      code: 'unknown_preset',
    };
  }

  const existing = await findOrganizationByPortalSlug(portalSlug);
  if (existing) {
    return {
      ok: false,
      error: `Portal slug "${portalSlug}" is already used by ${existing.name}.`,
      code: 'slug_taken',
    };
  }

  const created = await createOrganization({
    name,
    slug: portalSlug,
    portalSlug,
    industry: input.industry?.trim() || undefined,
    mission: input.mission?.trim() || undefined,
  });

  if (!created) {
    return {
      ok: false,
      error: 'Failed to create organization record.',
      code: 'create_failed',
    };
  }

  const themeId = input.themeId?.trim() || preset.themeId;
  const personalityId = input.personalityId?.trim() || preset.personalityId;
  const workspaceName = input.workspaceName?.trim() || preset.workspaceName;

  const withWorkspace = await updateOrganizationWorkspaceConfig(created.id, {
    platformClientId: preset.id,
    themeId,
    personalityId,
    workspaceName,
  });

  if (!withWorkspace) {
    return {
      ok: false,
      error: 'Organization created but workspace fields failed to save.',
      code: 'workspace_failed',
    };
  }

  const { moduleIds, skipped } = enableKeysToHubModuleIds(preset.enabledModuleKeys);
  const entitlementResult = await setModulesEnabledBulk(
    withWorkspace.id,
    moduleIds,
    true,
    'manual',
  );

  return {
    ok: true,
    organization: withWorkspace,
    platformClientId: preset.id,
    portalUrl: `/portal/${portalSlug}`,
    workspacePreviewUrl: `/admin/workspace-preview?client=${encodeURIComponent(preset.id)}`,
    reproducePreviewUrl: `/admin/reproduce-preview?client=${encodeURIComponent(preset.id)}`,
    landingPreviewUrl: `/admin/reproduce-preview?client=${encodeURIComponent(preset.id)}#landing`,
    publicSiteUrl: `/site/${encodeURIComponent(portalSlug)}`,
    entitlements: {
      requestedEnableKeys: [...preset.enabledModuleKeys],
      mappedModuleIds: moduleIds,
      skippedEnableKeys: skipped,
      enabled: entitlementResult.ok,
      failed: entitlementResult.failed,
    },
    preset: {
      id: preset.id,
      name: preset.name,
      workspaceName: preset.workspaceName,
      themeId: preset.themeId,
      personalityId: preset.personalityId,
      enabledModuleKeys: preset.enabledModuleKeys,
    },
  };
}

export function listClientFactoryPresets(): Array<{
  id: string;
  name: string;
  workspaceName: string;
  personalityId: string;
  themeId: string;
  enabledModuleKeys: string[];
  mappedModuleIds: ModuleId[];
  skippedEnableKeys: string[];
}> {
  return listPlatformClients().map((c) => {
    const mapped = enableKeysToHubModuleIds(c.enabledModuleKeys);
    return {
      id: c.id,
      name: c.name,
      workspaceName: c.workspaceName,
      personalityId: c.personalityId,
      themeId: c.themeId,
      enabledModuleKeys: c.enabledModuleKeys,
      mappedModuleIds: mapped.moduleIds,
      skippedEnableKeys: mapped.skipped,
    };
  });
}
