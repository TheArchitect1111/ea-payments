import type { EAPortalTab } from './PortalShell';

export type PortalNavItem = {
  id: EAPortalTab | string;
  label: string;
  href: string;
  icon: 'grid' | 'pulse' | 'simplifi' | 'amplifi' | 'updates' | 'documents' | 'events' | 'resources' | 'messaging' | 'learning' | 'ask';
};

export function portalNavItems(slug: string): { menu: PortalNavItem[]; others: PortalNavItem[] } {
  const base = `/portal/${slug}`;
  return {
    menu: [
      { id: 'home', label: 'Dashboard', href: base, icon: 'grid' },
      { id: 'simplifi', label: 'Simplifi™', href: `${base}/simplifi`, icon: 'simplifi' },
      { id: 'amplifi', label: 'Amplifi™', href: `${base}/amplifi`, icon: 'amplifi' },
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
    ],
  };
}
