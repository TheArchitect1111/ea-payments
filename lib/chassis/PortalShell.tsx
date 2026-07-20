import type { ReactNode } from 'react';
import { headers } from 'next/headers';

import { PortalLayout } from './PortalLayout';
import { NAVY, GOLD } from '@/lib/design-system';
import {
  resolvePortalWorkspaceChrome,
  type PortalWorkspaceChrome,
} from '@/lib/platform/portal-workspace';
import {
  buildClientExperienceNav,
  resolveClientNavActive,
  shouldUseClientExperienceShell,
  type ClientExperienceNavId,
} from '@/lib/ctp-client-nav';

export type EAPortalTab =
  | 'home'
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
  | 'ask'
  | 'ctp'
  | 'member'
  | 'landing';

type Props = {
  slug: string;
  active: EAPortalTab;
  firstName?: string;
  pageTitle?: string;
  /** Pre-resolved chrome — skips a second resolve when the page already loaded it. */
  chrome?: PortalWorkspaceChrome;
  /**
   * `workspace` = Executive sidebar.
   * `experience` = full-bleed cinematic (no chrome).
   * `client` = Client Experience nav shell.
   * CTP-bound portals coerce to `client` so Executive nav never appears.
   */
  presentation?: 'workspace' | 'experience' | 'client';
  /** Override active Client Experience nav item when known. */
  clientNavActive?: ClientExperienceNavId;
  children: ReactNode;
};

const FALLBACK_TITLES: Record<EAPortalTab, string> = {
  home: 'Dashboard',
  pulse: 'Pulse',
  simplifi: 'Simplifi',
  amplifi: 'Amplifi',
  connect: 'EA Connect',
  updates: 'Update Hub',
  documents: 'Documents',
  events: 'Events',
  resources: 'Resources',
  messaging: 'Messages',
  learning: 'Learning',
  ask: 'Ask EA',
  ctp: 'Your Journey',
  member: 'Member Experience',
  landing: 'Landing Pages',
};

function titleFromNav(chrome: PortalWorkspaceChrome, active: EAPortalTab): string | undefined {
  for (const group of chrome.shellNavGroups) {
    for (const item of group.items) {
      if (item.activeTab === active || item.moduleId === active) {
        return item.label;
      }
    }
  }
  return undefined;
}

/** EA client portal shell — Executive workspace or Client Experience. */
export async function PortalShell({
  slug,
  active,
  firstName,
  pageTitle,
  chrome: chromeProp,
  presentation = 'workspace',
  clientNavActive: clientNavActiveProp,
  children,
}: Props) {
  const chrome = chromeProp ?? (await resolvePortalWorkspaceChrome(slug));
  const useClientShell = await shouldUseClientExperienceShell(slug);
  const effectivePresentation = useClientShell
    ? 'client'
    : presentation === 'experience'
      ? 'experience'
      : presentation;

  const headerList = await headers();
  const pathname =
    headerList.get('x-pathname') ||
    headerList.get('x-invoke-path') ||
    headerList.get('next-url') ||
    '';
  const clientNavItems = buildClientExperienceNav(slug);
  const clientNavActive =
    clientNavActiveProp || resolveClientNavActive(pathname, slug);

  const clientTitle =
    clientNavItems.find((item) => item.id === clientNavActive)?.label ?? 'Your Journey';

  const resolvedTitle =
    pageTitle ??
    (effectivePresentation === 'client'
      ? clientTitle
      : (active === 'home' ? chrome.homeLabel : undefined) ??
        titleFromNav(chrome, active) ??
        FALLBACK_TITLES[active] ??
        'Dashboard');

  return (
    <PortalLayout
      slug={slug}
      active={active}
      firstName={firstName}
      pageTitle={resolvedTitle}
      shellNavGroups={effectivePresentation === 'client' ? [] : chrome.shellNavGroups}
      cssVars={chrome.cssVars}
      brandName={chrome.brandName}
      workspaceName={
        effectivePresentation === 'client' ? 'Client Experience' : chrome.workspaceName
      }
      logoSrc={chrome.logoSrc}
      logoAlt={chrome.logoAlt}
      memberLabel={chrome.memberLabel}
      promoTitle={chrome.promoTitle}
      promoCopy={chrome.promoCopy}
      personalityName={chrome.personalityName}
      personalityId={chrome.personalityId}
      homeLabel={effectivePresentation === 'client' ? 'Your Journey' : chrome.homeLabel}
      presentation={effectivePresentation}
      clientNavItems={clientNavItems}
      clientNavActive={clientNavActive}
    >
      {children}
    </PortalLayout>
  );
}

export { NAVY, GOLD };
