import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { PortalClientRecord } from '@/lib/airtable';
import { getClientByPortalSlug } from '@/lib/airtable';
import {
  activeModuleIdsFromEntitlements,
  listEntitlementsForOrg,
  syncPackageEntitlements,
} from '@/lib/entitlements';
import type { ModuleDefinition, ModuleId, NavGroup } from '@/lib/modules/registry';
import {
  MODULE_REGISTRY,
  defaultModulesForPackage,
  getModuleDefinition,
  moduleHref,
} from '@/lib/modules/registry';
import { roleAtLeast, normalizeRole, type PlatformRole } from '@/lib/rbac';
import { EA_PORTAL_COOKIE, verifySession, type EAPortalSession } from '@/lib/ea-portal-auth';
import { syntheticOrgId } from '@/lib/platform-store';

const DEMO_SLUGS = new Set(['demo-client']);

export function isDemoPortalSlug(slug: string): boolean {
  return DEMO_SLUGS.has(slug);
}

export type PortalHubModule = {
  href: string;
  tag: string;
  title: string;
  description: string;
  moduleId: ModuleId;
  variant?: 'pulse' | 'amplifi' | 'simplifi' | 'default';
  demoOnly?: boolean;
};

export type PortalNavTab = {
  id: 'home' | 'pulse' | 'simplifi' | 'amplifi' | 'updates';
  label: string;
  href: string;
};

export type ShellNavItem = {
  moduleId: ModuleId;
  label: string;
  href: string;
  navGroup: NavGroup;
};

export type ShellNavGroup = {
  id: NavGroup;
  label: string;
  items: ShellNavItem[];
};

export const NAV_GROUP_ORDER: NavGroup[] = ['core', 'growth', 'operations', 'platform'];

export const NAV_GROUP_LABELS: Record<NavGroup, string> = {
  core: 'Core',
  growth: 'Growth',
  operations: 'Operations',
  platform: 'Platform',
};

export type PortalModuleAccess = {
  orgId: string;
  enabledModuleIds: Set<ModuleId>;
  hubModules: PortalHubModule[];
  navTabs: PortalNavTab[];
  shellNavGroups: ShellNavGroup[];
};


function roleCanAccessModule(role: PlatformRole, module: ModuleDefinition): boolean {
  return roleAtLeast(role, module.requiredRole);
}

function toHubModule(slug: string, module: ModuleDefinition): PortalHubModule {
  return {
    href: moduleHref(slug, module),
    tag: module.tag,
    title: module.title,
    description: module.description,
    moduleId: module.id,
    variant: module.variant,
    demoOnly: module.demoOnly,
  };
}

export async function resolveEnabledModuleIds(input: {
  orgId?: string;
  slug: string;
  packagePurchased?: string;
  role?: PlatformRole;
}): Promise<Set<ModuleId>> {
  const orgId = input.orgId ?? syntheticOrgId(input.slug);
  const isDemo = isDemoPortalSlug(input.slug);

  const stored = await listEntitlementsForOrg(orgId);
  if (stored.length > 0) {
    return activeModuleIdsFromEntitlements(stored);
  }

  return new Set(
    defaultModulesForPackage(input.packagePurchased ?? 'Capacity Assessment', {
      isDemo,
      tenantPreset: 'ea-client',
    }),
  );
}

export async function resolvePortalModuleAccess(input: {
  orgId?: string;
  slug: string;
  packagePurchased?: string;
  role?: PlatformRole;
}): Promise<PortalModuleAccess> {
  const orgId = input.orgId ?? syntheticOrgId(input.slug);
  const role = normalizeRole(input.role ?? 'owner');
  const enabledModuleIds = await resolveEnabledModuleIds(input);

  const hubModules: PortalHubModule[] = [];
  const navTabs: PortalNavTab[] = [];
  const shellItems: ShellNavItem[] = [];

  for (const module of MODULE_REGISTRY) {
    if (!enabledModuleIds.has(module.id)) continue;
    if (!roleCanAccessModule(role, module)) continue;

    hubModules.push(toHubModule(input.slug, module));
    shellItems.push({
      moduleId: module.id,
      label: module.navLabel ?? module.name,
      href: moduleHref(input.slug, module),
      navGroup: module.navGroup,
    });

    if (module.showInNav && module.navTabId && module.navLabel) {
      navTabs.push({
        id: module.navTabId,
        label: module.navLabel,
        href: moduleHref(input.slug, module),
      });
    }
  }

  const shellNavGroups: ShellNavGroup[] = NAV_GROUP_ORDER.map((groupId) => ({
    id: groupId,
    label: NAV_GROUP_LABELS[groupId],
    items: shellItems.filter((item) => item.navGroup === groupId),
  })).filter((group) => group.items.length > 0);

  return { orgId, enabledModuleIds, hubModules, navTabs, shellNavGroups };
}

export async function isModuleEnabled(input: {
  orgId?: string;
  slug: string;
  moduleId: ModuleId;
  packagePurchased?: string;
  role?: PlatformRole;
}): Promise<boolean> {
  const enabled = await resolveEnabledModuleIds(input);
  if (!enabled.has(input.moduleId)) return false;

  const module = getModuleDefinition(input.moduleId);
  if (!module) return false;

  return roleCanAccessModule(normalizeRole(input.role ?? 'owner'), module);
}

/** Ensure package entitlements are persisted when org tables exist. */
export async function ensurePackageEntitlements(input: {
  orgId: string;
  packagePurchased: string;
  slug: string;
}): Promise<void> {
  if (input.orgId.startsWith('org_')) return;

  const existing = await listEntitlementsForOrg(input.orgId);
  if (existing.some((e) => e.source === 'package')) return;

  const moduleIds = defaultModulesForPackage(input.packagePurchased, {
    isDemo: isDemoPortalSlug(input.slug),
  });
  await syncPackageEntitlements(input.orgId, moduleIds);
}

export async function getPortalModuleAccessForSlug(slug: string): Promise<PortalModuleAccess | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session || session.slug !== slug) return null;

  const client = await getClientByPortalSlug(slug);
  if (!client) return null;

  return resolvePortalModuleAccess({
    orgId: session.orgId,
    slug,
    packagePurchased: client.packagePurchased,
    role: session.role,
  });
}

export async function requirePortalModule(
  slug: string,
  moduleId: ModuleId,
): Promise<{ session: EAPortalSession; client: PortalClientRecord; access: PortalModuleAccess }> {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  if (!token) redirect('/portal/login');

  const session = await verifySession(token);
  if (!session) redirect('/portal/login');
  if (session.slug !== slug) redirect(`/portal/${session.slug}`);

  const client = await getClientByPortalSlug(slug);
  if (!client) redirect('/portal/login');

  const access = await resolvePortalModuleAccess({
    orgId: session.orgId,
    slug,
    packagePurchased: client.packagePurchased,
    role: session.role,
  });

  if (!access.enabledModuleIds.has(moduleId)) {
    redirect(`/portal/${slug}`);
  }

  return { session, client, access };
}
