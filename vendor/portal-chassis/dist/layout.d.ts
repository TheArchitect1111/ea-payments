import * as react from 'react';

/**
 * Config-driven portal header + tab nav (CPR PortalShell pattern, no tenant branding baked in).
 */
type HeaderPortalTab = {
    id: string;
    label: string;
    href: string;
};
type HeaderPortalShellProps = {
    logoSrc: string;
    nameLine1: string;
    nameLine2?: string;
    tabs: HeaderPortalTab[];
    activeTabId: string;
    logoutApiPath?: string;
    loginPath?: string;
    showLogout?: boolean;
};
declare function HeaderPortalShell({ logoSrc, nameLine1, nameLine2, tabs, activeTabId, logoutApiPath, loginPath, showLogout, }: HeaderPortalShellProps): react.JSX.Element;

export { HeaderPortalShell, type HeaderPortalShellProps, type HeaderPortalTab };
