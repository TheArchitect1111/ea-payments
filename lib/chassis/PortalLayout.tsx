'use client';

import type { ReactNode } from 'react';
import { PortalSidebarProvider, usePortalSidebar } from './PortalSidebarContext';
import { PortalSidebar } from './PortalSidebar';
import { PortalHeader } from './PortalHeader';
import type { EAPortalTab } from './PortalShell';

type Props = {
  slug: string;
  active?: EAPortalTab | string;
  firstName?: string;
  pageTitle?: string;
  children: ReactNode;
};

function PortalLayoutFrame({ slug, active, firstName, pageTitle, children }: Props) {
  const { sidebarExpanded } = usePortalSidebar();

  return (
    <div className="ep-tailadmin">
      <PortalSidebar slug={slug} active={active} />
      <div className={`ep-tailadmin-main${sidebarExpanded ? '' : ' ep-tailadmin-main-collapsed'}`}>
        <PortalHeader firstName={firstName} pageTitle={pageTitle} />
        <div className="ep-tailadmin-content">{children}</div>
      </div>
    </div>
  );
}

export function PortalLayout({ slug, active, firstName, pageTitle, children }: Props) {
  return (
    <PortalSidebarProvider>
      <PortalLayoutFrame slug={slug} active={active} firstName={firstName} pageTitle={pageTitle}>
        {children}
      </PortalLayoutFrame>
    </PortalSidebarProvider>
  );
}
