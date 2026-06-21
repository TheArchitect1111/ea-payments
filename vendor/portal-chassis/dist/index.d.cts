export { TenantAirtable, TenantBrand, TenantConfig, TenantLayout, TenantNavItem } from './tenant.cjs';
import * as react from 'react';
import { ReactNode, ComponentType } from 'react';
import * as next_server from 'next/server';
export { HmacSessionConfig, SessionCookieOptions, makeSessionCookie, newSessionExpiry, signHmacSession, verifyHmacSession } from './hmac.cjs';
export { HmacPortalMiddlewareConfig, SlugRoleRoute, createHmacPortalMiddleware } from './middleware.cjs';
export { HeaderPortalShell, HeaderPortalShellProps, HeaderPortalTab } from './layout.cjs';
export { AirtableQueryParams, AirtableRecord, airtableCreate, airtableDelete, airtableGet, airtableGetOne, airtableUpdate } from './airtable.cjs';
export { triggerMakeWebhook } from './webhooks.cjs';
export { EmailPayload, sendEmail } from './email.cjs';
export { adminEmail, allowSampleData, isDemoMode, isProductionDeploy, requireEnv } from './env.cjs';
export { AdminNotifyInput, notifyAdmin } from './notify.cjs';

interface ClerkShellProps {
    brandColor: string;
    logoSrc: string;
    portalName: string;
    tagline: string;
    mode: "sign-in" | "sign-up";
}
/**
 * Universal login/signup shell used across all EA portals.
 * Left panel: brand color, logo, tagline. Right panel: Clerk component.
 * Left panel collapses below 768px so only the Clerk form is visible on mobile.
 */
declare function ClerkShell({ brandColor, logoSrc, portalName, tagline, mode }: ClerkShellProps): react.JSX.Element;

interface MiddlewareConfig {
    protectedPrefixes: string[];
    adminPrefixes: string[];
    publicRoutes: string[];
}
/**
 * Returns a ready-to-export Clerk middleware and its Next.js matcher config.
 *
 * Usage in middleware.ts:
 *   const { middleware, config } = createPortalMiddleware({ ... });
 *   export default middleware;
 *   export { config };
 */
declare function createPortalMiddleware(cfg: MiddlewareConfig): {
    middleware: next_server.NextMiddleware;
    config: {
        matcher: string[];
    };
};

interface RoleGuardProps {
    requiredRole: "Member" | "Officer" | "Admin";
    fallback?: ReactNode;
    children: ReactNode;
}
/**
 * Renders children only when the signed-in user's publicMetadata.role
 * meets or exceeds requiredRole. Renders fallback (default: null) otherwise.
 * Role hierarchy: Admin > Officer > Member.
 */
declare function RoleGuard({ requiredRole, fallback, children }: RoleGuardProps): react.JSX.Element | null;

/**
 * Server-side role check for API route handlers.
 * Returns a 401/403 Response if the check fails, or null if the caller may proceed.
 *
 * Usage:
 *   const guard = await withRoleProtection(request, "Officer");
 *   if (guard) return guard;
 */
declare function withRoleProtection(_request: Request, requiredRole: string): Promise<Response | null>;

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

export { ClerkShell, type ClerkShellProps, type MiddlewareConfig, type NavItem, PortalLayout, type PortalLayoutProps, RoleGuard, type RoleGuardProps, createPortalMiddleware, withRoleProtection };
