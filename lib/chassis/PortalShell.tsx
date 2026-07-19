import type { ReactNode } from 'react';

import { PortalLayout } from './PortalLayout';
import { NAVY, GOLD } from '@/lib/design-system';
import {
  resolvePortalWorkspaceChrome,
  type PortalWorkspaceChrome,
} from '@/lib/platform/portal-workspace';

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
  | 'ctp';

type Props = {
  slug: string;
  active: EAPortalTab;
  firstName?: string;
  pageTitle?: string;
  /** Pre-resolved chrome — skips a second resolve when the page already loaded it. */
  chrome?: PortalWorkspaceChrome;
  /** `experience` = full-bleed Client Experience without sidebar/header. */
  presentation?: 'workspace' | 'experience';
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
  ctp: 'Consider the Possibilities',
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

/** EA client portal - TailAdmin-style sidebar shell (portal routes only). */
export async function PortalShell({
  slug,
  active,
  firstName,
  pageTitle,
  chrome: chromeProp,
  presentation = 'workspace',
  children,
}: Props) {
  const chrome = chromeProp ?? (await resolvePortalWorkspaceChrome(slug));
  const resolvedTitle =
    pageTitle ??
    (active === 'home' ? chrome.homeLabel : undefined) ??
    titleFromNav(chrome, active) ??
    FALLBACK_TITLES[active] ??
    'Dashboard';

  return (
    <PortalLayout
      slug={slug}
      active={active}
      firstName={firstName}
      pageTitle={resolvedTitle}
      shellNavGroups={chrome.shellNavGroups}
      cssVars={chrome.cssVars}
      brandName={chrome.brandName}
      workspaceName={chrome.workspaceName}
      logoSrc={chrome.logoSrc}
      logoAlt={chrome.logoAlt}
      memberLabel={chrome.memberLabel}
      promoTitle={chrome.promoTitle}
      promoCopy={chrome.promoCopy}
      personalityName={chrome.personalityName}
      personalityId={chrome.personalityId}
      homeLabel={chrome.homeLabel}
      presentation={presentation}
    >
      {children}
    </PortalLayout>
  );
}

export { NAVY, GOLD };
