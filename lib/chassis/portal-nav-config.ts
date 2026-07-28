import type { EAPortalTab } from './PortalShell';

/**
 * @deprecated Phase 1 Universal Portal — orphan static nav.
 * Live nav comes from entitlements (`resolvePortalModuleAccess`) or IndustryPack
 * when UNIVERSAL_NAV_PACKS is enabled. Do not import for PortalShell.
 * @see docs/plans/EA-UNIVERSAL-PORTAL-PHASE-1-BLUEPRINT.md (A-029)
 */
export type PortalNavItem = {
  id: EAPortalTab | string;
  label: string;
  href: string;
  icon:
    | 'grid'
    | 'pulse'
    | 'simplifi'
    | 'amplifi'
    | 'connect'
    | 'updates'
    | 'documents'
    | 'events'
    | 'resources'
    | 'messaging'
    | 'learning'
    | 'ask';
};

/** @deprecated See file header — not used by live PortalShell. */
export function portalNavItems(slug: string): { menu: PortalNavItem[]; others: PortalNavItem[] } {
  const base = `/portal/${slug}`;
  return {
    menu: [
      { id: 'home', label: 'Dashboard', href: base, icon: 'grid' },
      { id: 'simplifi', label: 'Simplifi™', href: `${base}/simplifi`, icon: 'simplifi' },
      { id: 'amplifi', label: 'Amplifi™', href: `${base}/amplifi`, icon: 'amplifi' },
      { id: 'connect', label: 'Connect™', href: `${base}/connect`, icon: 'connect' },
      { id: 'pulse', label: 'Pulse™', href: `${base}/pulse`, icon: 'pulse' },
      { id: 'updates', label: 'Update Hub™', href: `${base}/updates`, icon: 'updates' },
    ],
    others: [
      { id: 'documents', label: 'Documents', href: `${base}/documents`, icon: 'documents' },
      { id: 'events', label: 'Events', href: `${base}/events`, icon: 'events' },
      { id: 'resources', label: 'Resources', href: `${base}/resources`, icon: 'resources' },
      { id: 'messaging', label: 'Messages', href: `${base}/messaging`, icon: 'messaging' },
      { id: 'learning', label: 'Learning', href: `${base}/learning`, icon: 'learning' },
      { id: 'ask', label: 'Ask EA', href: `${base}/ask`, icon: 'ask' },
      { id: 'settings', label: 'Settings', href: `${base}/settings`, icon: 'documents' },
    ],
  };
}
