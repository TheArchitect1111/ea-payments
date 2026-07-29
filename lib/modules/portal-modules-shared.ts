/**
 * Client-safe portal module types, display metadata, and pure helpers.
 * Do not import next/headers, cookies, sessions, or data adapters here.
 * Module registry remains `@/lib/modules/registry` — not duplicated.
 */
import type { ModuleId, NavGroup } from '@/lib/modules/registry';
import {
  portalActiveTabForModule,
  portalNavIconForModule,
  type PortalNavIconName,
} from '@/lib/chassis/portal-nav-mapping';
import type {
  CapabilityContext,
  DashboardCapabilityGroup,
} from '@/lib/experience-registry';

export type PortalHubModule = {
  href: string;
  tag: string;
  title: string;
  description: string;
  moduleId: ModuleId;
  capabilityId: string;
  variant?: 'pulse' | 'amplifi' | 'simplifi' | 'default';
  demoOnly?: boolean;
};

export type PortalNavTab = {
  id: 'home' | 'pulse' | 'simplifi' | 'amplifi' | 'updates' | 'connect';
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
  /** Canonical Capability Framework ids for entitled modules. */
  platformCapabilityIds: string[];
  hubModules: PortalHubModule[];
  navTabs: PortalNavTab[];
  shellNavGroups: ShellNavGroup[];
  /** Capability Map rows for entitled modules (nav + Orbie + dashboard source). */
  enabledCapabilities: CapabilityContext[];
  /** Dashboard zone groupings derived from the capability registry. */
  dashboardGroups: DashboardCapabilityGroup[];
};

/** Serializable sidebar nav — passed from server PortalShell to client PortalSidebar. */
export type PortalSidebarNavItem = {
  /** Module id or synthetic admin nav key (used as React key + active match). */
  moduleId: ModuleId | string;
  label: string;
  href: string;
  icon: PortalNavIconName;
  activeTab: string;
};

export type PortalSidebarNavGroup = {
  id: NavGroup;
  label: string;
  items: PortalSidebarNavItem[];
};

/** Pure transform — safe for any runtime that already has shell nav groups. */
export function toPortalSidebarNavGroups(groups: ShellNavGroup[]): PortalSidebarNavGroup[] {
  return groups.map((group) => ({
    id: group.id,
    label: group.label,
    items: group.items.map((item) => ({
      moduleId: item.moduleId,
      label: item.label,
      href: item.href,
      icon: portalNavIconForModule(item.moduleId),
      activeTab: portalActiveTabForModule(item.moduleId),
    })),
  }));
}
