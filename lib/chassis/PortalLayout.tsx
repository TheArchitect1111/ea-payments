'use client';

import type { CSSProperties, ReactNode } from 'react';
import { PortalSidebarProvider, usePortalSidebar } from './PortalSidebarContext';
import { PortalSidebar } from './PortalSidebar';
import { PortalHeader } from './PortalHeader';
import { PortalChromeProvider } from './PortalChromeContext';
import type { EAPortalTab } from './PortalShell';
import type { PortalSidebarNavGroup } from '@/lib/modules/portal-modules';

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
  personalityName?: string;
  personalityId?: string;
  homeLabel?: string;
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
  personalityName,
  personalityId,
  homeLabel,
  children,
}: PortalWorkspaceLayoutProps) {
  const { sidebarExpanded } = usePortalSidebar();
  const style = (cssVars ?? {}) as CSSProperties;

  return (
    <PortalChromeProvider
      value={{
        brandName,
        workspaceName,
        personalityName,
        memberLabel,
        homeLabel,
        personalityId,
      }}
    >
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
        />
        <div className={`ep-tailadmin-main${sidebarExpanded ? '' : ' ep-tailadmin-main-collapsed'}`}>
          <PortalHeader firstName={firstName} pageTitle={pageTitle} memberLabel={memberLabel} />
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
