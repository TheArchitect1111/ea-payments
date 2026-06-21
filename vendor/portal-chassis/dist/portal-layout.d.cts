import * as react from 'react';
import { ComponentType, ReactNode } from 'react';

interface NavItem {
    label: string;
    href: string;
    icon: ComponentType<{
        className?: string;
        style?: React.CSSProperties;
    }>;
}
interface PortalLayoutProps {
    portalName: string;
    logoSrc: string;
    brandColor: string;
    accentColor: string;
    navItems: NavItem[];
    adminNavItems?: NavItem[];
    mobileNavStyle?: "bottom" | "sheet";
    children: ReactNode;
}
declare function PortalLayout({ portalName, logoSrc, brandColor, accentColor, navItems, adminNavItems, mobileNavStyle, children, }: PortalLayoutProps): react.JSX.Element;

export { type NavItem, PortalLayout, type PortalLayoutProps };
