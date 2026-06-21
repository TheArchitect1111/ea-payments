import * as react from 'react';

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

export { ClerkShell, type ClerkShellProps };
