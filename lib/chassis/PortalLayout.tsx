'use client';

import type { CSSProperties, ReactNode } from 'react';
import { PortalSidebarProvider, usePortalSidebar } from './PortalSidebarContext';
import { PortalSidebar } from './PortalSidebar';
import { PortalHeader } from './PortalHeader';
import { PortalChromeProvider } from './PortalChromeContext';
import type { EAPortalTab } from './PortalShell';
import type { PortalSidebarNavGroup } from '@/lib/modules/portal-modules';
import type {
  ClientExperienceNavId,
  ClientExperienceNavItem,
} from '@/lib/ctp-client-nav';
import ClientExperienceNav from '@/app/portal/components/ClientExperienceNav';
import '@/app/portal/components/client-experience-shell.css';

export type PortalWorkspaceLayoutProps = {
  slug: string;
  active?: EAPortalTab | string;
  firstName?: string;
  pageTitle?: string;
  shellNavGroups: PortalSidebarNavGroup[];
  cssVars?: Record<string, string>;
  brandName?: string;
  workspaceName?: string;
  logoSrc?: string;
  logoAlt?: string;
  memberLabel?: string;
  promoTitle?: string;
  promoCopy?: string;
  promoHref?: string;
  personalityName?: string;
  personalityId?: string;
  homeLabel?: string;
  /** Defaults to portal logout; admin shell passes /api/admin/logout. */
  logoutHref?: string;
  /**
   * `workspace` = Executive sidebar shell.
   * `experience` = full-bleed (legacy cinematic, no chrome).
   * `client` = Client Experience shell with client-only nav.
   */
  presentation?: 'workspace' | 'experience' | 'client';
  clientNavItems?: ClientExperienceNavItem[];
  clientNavActive?: ClientExperienceNavId;
  children: ReactNode;
};

function PortalLayoutFrame({
  slug,
  active,
  firstName,
  pageTitle,
  shellNavGroups,
  cssVars,
  brandName,
  workspaceName,
  logoSrc,
  logoAlt,
  memberLabel,
  promoTitle,
  promoCopy,
  promoHref,
  personalityName,
  personalityId,
  homeLabel,
  logoutHref = '/api/portal/logout',
  presentation = 'workspace',
  clientNavItems = [],
  clientNavActive = 'journey',
  children,
}: PortalWorkspaceLayoutProps) {
  const { sidebarExpanded } = usePortalSidebar();
  const style = (cssVars ?? {}) as CSSProperties;

  const chromeValue = {
    brandName,
    workspaceName,
    personalityName,
    memberLabel,
    homeLabel,
    personalityId,
  };

  if (presentation === 'client') {
    return (
      <PortalChromeProvider value={chromeValue}>
        <div
          className="ep-client-experience-shell cex-shell-frame ep-workspace-shell"
          style={style}
        >
          <ClientExperienceNav
            items={clientNavItems}
            active={clientNavActive}
            brandName={brandName}
            logoutHref={logoutHref}
          />
          <div className="cex-shell-main">{children}</div>
        </div>
      </PortalChromeProvider>
    );
  }

  if (presentation === 'experience') {
    return (
      <PortalChromeProvider value={chromeValue}>
        <div className="ep-client-experience-shell ep-workspace-shell" style={style}>
          {children}
        </div>
      </PortalChromeProvider>
    );
  }

  return (
    <PortalChromeProvider value={chromeValue}>
      <div className="ep-tailadmin ep-workspace-shell" style={style}>
        <PortalSidebar
          slug={slug}
          active={active}
          shellNavGroups={shellNavGroups}
          brandName={brandName}
          workspaceName={workspaceName}
          logoSrc={logoSrc}
          logoAlt={logoAlt}
          promoTitle={promoTitle}
          promoCopy={promoCopy}
          promoHref={promoHref}
        />
        <div className={`ep-tailadmin-main${sidebarExpanded ? '' : ' ep-tailadmin-main-collapsed'}`}>
          <PortalHeader
            firstName={firstName}
            pageTitle={pageTitle}
            memberLabel={memberLabel}
            logoutHref={logoutHref}
          />
          <div className="ep-tailadmin-content">{children}</div>
        </div>
      </div>
    </PortalChromeProvider>
  );
}

export function PortalLayout(props: PortalWorkspaceLayoutProps) {
  return (
    <PortalSidebarProvider>
      <PortalLayoutFrame {...props} />
    </PortalSidebarProvider>
  );
}
