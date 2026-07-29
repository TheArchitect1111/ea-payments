/**
 * Server-only portal module access — cookies, session, RBAC, entitlements.
 * Client components must import types/helpers from `@/lib/modules/portal-modules-shared`.
 */
import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { PortalClientRecord } from '@/lib/airtable';
import { getClientByPortalSlug } from '@/lib/airtable';
import {
  activeModuleIdsFromEntitlements,
  listEntitlementsForOrg,
} from '@/lib/entitlements';
import { resolveEntitlementPackageKey } from '@/lib/modules/entitlement-package-key';
import type { ModuleDefinition, ModuleId } from '@/lib/modules/registry';
import {
  MODULE_REGISTRY,
  defaultModulesForPackage,
  getModuleDefinition,
  moduleHref,
} from '@/lib/modules/registry';
import { roleAtLeast, normalizeRole, type PlatformRole } from '@/lib/rbac';
import {
  getCapabilityByModuleId,
  groupDashboardCapabilities,
  listCapabilitiesForModules,
} from '@/lib/experience-registry';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';
import { EA_PORTAL_COOKIE, verifySession, type EAPortalSession } from '@/lib/ea-portal-auth';
import { syntheticOrgId } from '@/lib/platform-store';
import { mapModuleIdsToCapabilityIds } from '@/lib/platform/capability-bootstrap';
import {
  ensurePackageEntitlements,
  isDemoPortalSlug,
} from '@/lib/modules/ensure-package-entitlements';
import {
  NAV_GROUP_LABELS,
  NAV_GROUP_ORDER,
  toPortalSidebarNavGroups,
  type PortalHubModule,
  type PortalModuleAccess,
  type PortalNavTab,
  type PortalSidebarNavGroup,
  type ShellNavGroup,
  type ShellNavItem,
} from '@/lib/modules/portal-modules-shared';

export {
  ensurePackageEntitlements,
  isDemoPortalSlug,
};

export {
  NAV_GROUP_LABELS,
  NAV_GROUP_ORDER,
  toPortalSidebarNavGroups,
  type PortalHubModule,
  type PortalModuleAccess,
  type PortalNavTab,
  type PortalSidebarNavGroup,
  type PortalSidebarNavItem,
  type ShellNavGroup,
  type ShellNavItem,
} from '@/lib/modules/portal-modules-shared';

function roleCanAccessModule(role: PlatformRole, module: ModuleDefinition): boolean {
  return roleAtLeast(role, module.requiredRole);
}

function toHubModule(slug: string, module: ModuleDefinition, capabilityId: string): PortalHubModule {
  return {
    href: moduleHref(slug, module),
    tag: module.tag,
    title: module.title,
    description: module.description,
    moduleId: module.id,
    capabilityId,
    variant: module.variant,
    demoOnly: module.demoOnly,
  };
}

export async function resolveEnabledModuleIds(input: {
  orgId?: string;
  slug: string;
  packagePurchased?: string;
  commerceOfferId?: string;
  role?: PlatformRole;
}): Promise<Set<ModuleId>> {
  const orgId = input.orgId ?? syntheticOrgId(input.slug);
  const isDemo = isDemoPortalSlug(input.slug);

  const stored = await listEntitlementsForOrg(orgId);
  if (stored.length > 0) {
    return activeModuleIdsFromEntitlements(stored);
  }

  if (process.env.NODE_ENV === 'production' && !isDemo) {
    return new Set<ModuleId>();
  }

  const packageKey = resolveEntitlementPackageKey(input);
  return new Set(
    defaultModulesForPackage(packageKey, {
      isDemo,
      tenantPreset: 'ea-client',
    }),
  );
}

export async function resolvePortalModuleAccess(input: {
  orgId?: string;
  slug: string;
  packagePurchased?: string;
  commerceOfferId?: string;
  role?: PlatformRole;
}): Promise<PortalModuleAccess> {
  const orgId = input.orgId ?? syntheticOrgId(input.slug);
  const role = normalizeRole(input.role ?? 'guest');
  const enabledModuleIds = await resolveEnabledModuleIds(input);

  const hubModules: PortalHubModule[] = [];
  const navTabs: PortalNavTab[] = [];
  const shellItems: ShellNavItem[] = [];
  const entitledCapabilities = listCapabilitiesForModules(enabledModuleIds);

  for (const modDef of MODULE_REGISTRY) {
    if (!enabledModuleIds.has(modDef.id)) continue;
    if (!roleCanAccessModule(role, modDef)) continue;

    const capability = getCapabilityByModuleId(modDef.id);
    if (!capability) continue;

    if (capability.showOnDashboardHub) {
      hubModules.push(toHubModule(input.slug, modDef, capability.id));
    }

    if (capability.showInSidebar) {
      shellItems.push({
        moduleId: modDef.id,
        label: capability.displayLabel,
        href: moduleHref(input.slug, modDef),
        navGroup: capability.navGroup,
      });
    }

    if (capability.showInPillNav && capability.navTabId) {
      navTabs.push({
        id: capability.navTabId,
        label: capability.displayLabel,
        href: moduleHref(input.slug, modDef),
      });
    }
  }

  const shellNavGroups: ShellNavGroup[] = NAV_GROUP_ORDER.map((groupId) => ({
    id: groupId,
    label: NAV_GROUP_LABELS[groupId],
    items: shellItems.filter((item) => item.navGroup === groupId),
  })).filter((group) => group.items.length > 0);

  const enabledCapabilities = entitledCapabilities
    .filter((cap) => {
      const mod = getModuleDefinition(cap.moduleId);
      return mod && roleCanAccessModule(role, mod);
    })
    .map((cap) => ({
      capabilityId: cap.id,
      moduleId: cap.moduleId,
      customerGoal: cap.customerGoal,
      plainLanguage: cap.plainLanguage,
      displayLabel: cap.displayLabel,
      eaCapability: cap.eaCapability,
      route: moduleHref(input.slug, getModuleDefinition(cap.moduleId)!),
      dashboardZone: cap.dashboardZone,
      orbPolicy: cap.orbPolicy,
      poweredBy: cap.poweredBy,
    }));

  const dashboardGroups = groupDashboardCapabilities(
    entitledCapabilities.filter((cap) => {
      const mod = getModuleDefinition(cap.moduleId);
      return mod && roleCanAccessModule(role, mod);
    }),
  ).map((group) => ({
    ...group,
    capabilities: group.capabilities.map((capCtx) => {
      const mod = getModuleDefinition(capCtx.moduleId);
      return mod ? { ...capCtx, route: moduleHref(input.slug, mod) } : capCtx;
    }),
  }));

  return {
    orgId,
    enabledModuleIds,
    platformCapabilityIds: mapModuleIdsToCapabilityIds([...enabledModuleIds]),
    hubModules,
    navTabs,
    shellNavGroups,
    enabledCapabilities,
    dashboardGroups,
  };
}

function omitModuleFromAccess(access: PortalModuleAccess, moduleId: ModuleId): PortalModuleAccess {
  const enabledModuleIds = new Set(access.enabledModuleIds);
  enabledModuleIds.delete(moduleId);

  return {
    orgId: access.orgId,
    enabledModuleIds,
    platformCapabilityIds: mapModuleIdsToCapabilityIds([...enabledModuleIds]),
    hubModules: access.hubModules.filter((m) => m.moduleId !== moduleId),
    navTabs: access.navTabs,
    shellNavGroups: access.shellNavGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.moduleId !== moduleId),
      }))
      .filter((group) => group.items.length > 0),
    enabledCapabilities: access.enabledCapabilities.filter((c) => c.moduleId !== moduleId),
    dashboardGroups: access.dashboardGroups
      .map((group) => ({
        ...group,
        capabilities: group.capabilities.filter((c) => c.moduleId !== moduleId),
      }))
      .filter((group) => group.capabilities.length > 0),
  };
}

/** Hide CTP in portal surfaces when entitled but no submission exists for this user. */
export async function applyCtpPortalModuleFilter(
  access: PortalModuleAccess,
  input: { portalSlug: string; email?: string },
): Promise<PortalModuleAccess> {
  if (!access.enabledModuleIds.has('ctp')) {
    return access;
  }

  const submission = await getCtpSubmissionForPortal({
    portalSlug: input.portalSlug,
    email: input.email,
  });

  if (submission) {
    return access;
  }

  return omitModuleFromAccess(access, 'ctp');
}

/** Dynamic sidebar nav for the current portal session (entitlements + RBAC + CTP submission). */
export async function resolvePortalSidebarNav(slug: string): Promise<PortalSidebarNavGroup[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session || session.slug !== slug) {
    return [];
  }

  const client = await getClientByPortalSlug(slug);
  if (!client) {
    return [];
  }

  const access = await resolvePortalModuleAccess({
    orgId: session.orgId,
    slug,
    packagePurchased: client.packagePurchased,
    commerceOfferId: client.commerceOfferId,
    role: session.role,
  });

  const filtered = await applyCtpPortalModuleFilter(access, {
    portalSlug: slug,
    email: session.email ?? client.email,
  });

  return toPortalSidebarNavGroups(filtered.shellNavGroups);
}

export async function isModuleEnabled(input: {
  orgId?: string;
  slug: string;
  moduleId: ModuleId;
  packagePurchased?: string;
  commerceOfferId?: string;
  role?: PlatformRole;
}): Promise<boolean> {
  const enabled = await resolveEnabledModuleIds(input);
  if (!enabled.has(input.moduleId)) return false;

  const modDef = getModuleDefinition(input.moduleId);
  if (!modDef) return false;

  return roleCanAccessModule(normalizeRole(input.role ?? 'guest'), modDef);
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
    commerceOfferId: client.commerceOfferId,
    role: session.role,
  });
}

function portalLoginRedirect(nextPath: string): never {
  const next = encodeURIComponent(nextPath);
  redirect(`/portal/login?next=${next}`);
}

function portalModulePath(slug: string, moduleId: ModuleId): string {
  const moduleDef = getModuleDefinition(moduleId);
  if (moduleDef) return moduleHref(slug, moduleDef);
  if (moduleId === 'dashboard') return `/portal/${slug}`;
  return `/portal/${slug}/${moduleId}`;
}

export async function requirePortalModule(
  slug: string,
  moduleId: ModuleId,
): Promise<{ session: EAPortalSession; client: PortalClientRecord; access: PortalModuleAccess }> {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const intendedPath = portalModulePath(slug, moduleId);

  if (!token) portalLoginRedirect(intendedPath);

  const session = await verifySession(token);
  if (!session) portalLoginRedirect(intendedPath);
  if (session.slug !== slug) redirect(`/portal/${session.slug}`);

  const client = await getClientByPortalSlug(slug);
  if (!client) portalLoginRedirect(intendedPath);

  const access = await resolvePortalModuleAccess({
    orgId: session.orgId,
    slug,
    packagePurchased: client.packagePurchased,
    commerceOfferId: client.commerceOfferId,
    role: session.role,
  });

  if (!access.enabledModuleIds.has(moduleId)) {
    // CTP intake clients still reach their branded workspace if entitlements lag.
    if (moduleId === 'ctp') {
      const submission = await getCtpSubmissionForPortal({
        portalSlug: slug,
        email: session.email ?? client.email,
      });
      if (submission) {
        return { session, client, access };
      }
    }
    redirect(`/portal/${slug}`);
  }

  return { session, client, access };
}
