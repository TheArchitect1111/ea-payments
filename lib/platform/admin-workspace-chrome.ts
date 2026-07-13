/**
 * Admin Mission Control chrome — same PortalLayout as client portals,
 * driven by the EA ClientConfig + admin nav groups.
 */
import type { PortalSidebarNavGroup, PortalSidebarNavItem } from '@/lib/modules/portal-modules';
import type { PortalNavIconName } from '@/lib/chassis/portal-nav-mapping';
import { BUILDER_NAV, EXECUTIVE_NAV } from '@/lib/admin-operating-mode';
import { assembleWorkspaceForClient } from './workspace-bridge';
import type { PortalWorkspaceChrome } from './portal-workspace';

function iconForLabel(label: string): PortalNavIconName {
  const l = label.toLowerCase();
  if (l.includes('home') || l.includes('agent')) return 'grid';
  if (l.includes('opportunit') || l.includes('simplifi')) return 'simplifi';
  if (l.includes('content') || l.includes('update')) return 'updates';
  if (l.includes('creative') || l.includes('amplifi')) return 'amplifi';
  if (l.includes('train') || l.includes('learn')) return 'learning';
  if (l.includes('resource') || l.includes('protocol') || l.includes('repo')) return 'resources';
  if (l.includes('insight') || l.includes('pulse')) return 'pulse';
  if (l.includes('connect') || l.includes('partner')) return 'connect';
  if (l.includes('client') || l.includes('deliver')) return 'documents';
  if (l.includes('ask') || l.includes('admin')) return 'ask';
  return 'grid';
}

function navToItems(
  links: ReadonlyArray<{ href: string; label: string }>,
  prefix: string,
): PortalSidebarNavItem[] {
  const seen = new Set<string>();
  const items: PortalSidebarNavItem[] = [];
  for (const link of links) {
    const key = `${link.href}:${link.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      moduleId: `${prefix}-${link.label.toLowerCase().replace(/\s+/g, '-')}`,
      label: link.label,
      href: link.href,
      icon: iconForLabel(link.label),
      activeTab: link.href === '/admin/master' ? 'home' : link.href,
    });
  }
  return items;
}

/** Resolve TailAdmin workspace chrome for authenticated /admin surfaces. */
export function resolveAdminWorkspaceChrome(): PortalWorkspaceChrome {
  const shell = assembleWorkspaceForClient('ea');
  const cssVars = shell?.cssVars ?? {};
  const personality = shell?.personality;
  const theme = shell?.theme;

  const shellNavGroups: PortalSidebarNavGroup[] = [
    {
      id: 'core',
      label: 'Operate',
      items: navToItems(EXECUTIVE_NAV, 'exec'),
    },
    {
      id: 'growth',
      label: 'Build',
      items: navToItems(BUILDER_NAV, 'build'),
    },
    {
      id: 'platform',
      label: 'Account',
      items: [
        {
          moduleId: 'admin-sign-out',
          label: 'Sign Out',
          href: '/api/admin/logout',
          icon: 'ask',
          activeTab: 'sign-out',
        },
      ],
    },
  ];

  return {
    platformClientId: 'ea',
    cssVars,
    brandName: shell?.name || 'Efficiency Architects',
    workspaceName: shell?.workspaceName || 'EA Command Center',
    logoSrc: '/ea-logo.png',
    logoAlt: theme?.logoAlt || 'Efficiency Architects',
    memberLabel: shell?.terminology.members || 'Admin',
    homeLabel: shell?.terminology.home || 'Mission Control',
    promoTitle: 'Mission Control',
    promoCopy:
      shell?.terminology.startPrompt ||
      'What would you like to accomplish today?',
    aiContext: shell?.aiContext || '',
    personalityId: personality?.id || 'executive',
    personalityName: personality?.name || 'Executive',
    sectionOrder: shell?.sectionOrder?.length
      ? shell.sectionOrder
      : ['todaysFocus', 'decisionsRequired', 'executiveBriefing', 'recentWork', 'workspaceDock'],
    dashboardSections: shell?.dashboardSections?.length
      ? shell.dashboardSections
      : ['todaysFocus', 'recentWork', 'decisionsRequired', 'executiveBriefing', 'workspaceDock'],
    primaryActions: shell?.primaryActions?.length
      ? shell.primaryActions
      : ['Review opportunities', 'Continue building', 'Open delivery'],
    emptyStateLanguage:
      shell?.emptyStateLanguage || 'No executive decisions need attention right now.',
    focusLabel: shell?.terminology.focus || "Today's Focus",
    attentionLabel: shell?.terminology.attention || 'Decisions Required',
    startLabel: shell?.terminology.start || 'Continue Building',
    widgets: (shell?.surface.widgets ?? []).map((w) => ({
      id: w.id,
      title: w.title,
      capabilityId: w.capabilityId,
      zone: w.zone,
    })),
    shellNavGroups,
  };
}
