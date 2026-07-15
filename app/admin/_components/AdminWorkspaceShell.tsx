import type { ReactNode } from 'react';
import { PortalLayout } from '@/lib/chassis/PortalLayout';
import { resolveAdminWorkspaceChrome } from '@/lib/platform/admin-workspace-chrome';
import { getAdminPageUser } from '@/lib/admin-page-auth';
import AdminChromeTools from './AdminChromeTools';
import AdminShellGate from './AdminShellGate';
import '@/app/portal/[slug]/ea-portal.css';

/**
 * Same TailAdmin portal chrome as client portals — wraps authenticated /admin.
 * Command bar / voice / navigator live in AdminChromeTools above page content.
 */
export default async function AdminWorkspaceShell({ children }: { children: ReactNode }) {
  const chrome = resolveAdminWorkspaceChrome();
  const user = await getAdminPageUser();
  const firstName =
    user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Admin';

  const shell = (
    <PortalLayout
      slug="ea"
      firstName={firstName}
      pageTitle={chrome.homeLabel}
      shellNavGroups={chrome.shellNavGroups}
      cssVars={chrome.cssVars}
      brandName={chrome.brandName}
      workspaceName={chrome.workspaceName}
      logoSrc="/ea-logo.png"
      logoAlt={chrome.logoAlt}
      memberLabel={chrome.memberLabel}
      promoTitle={chrome.promoTitle}
      promoCopy={chrome.promoCopy}
      promoHref="/admin/master"
      personalityName={chrome.personalityName}
      personalityId={chrome.personalityId}
      homeLabel={chrome.homeLabel}
      logoutHref="/api/admin/logout"
    >
      <AdminChromeTools />
      {children}
    </PortalLayout>
  );

  return (
    <AdminShellGate chrome={shell}>{children}</AdminShellGate>
  );
}
