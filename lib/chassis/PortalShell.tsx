import type { CSSProperties } from 'react';
import { HeaderPortalShell } from '@ea/portal-chassis/layout';

export type EAPortalTab = 'home' | 'pulse' | 'simplifi' | 'updates';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

type Props = {
  slug: string;
  active: EAPortalTab;
};

/** EA client portal header — chassis HeaderPortalShell with EA nav tabs. */
export function PortalShell({ slug, active }: Props) {
  const brandName = process.env.BRAND_NAME ?? 'Efficiency Architects';
  const base = `/portal/${slug}`;

  return (
    <div
      style={
        {
          '--portal-header-bg': NAVY,
          '--portal-accent': GOLD,
          '--portal-header-text': '#fff',
        } as CSSProperties
      }
    >
      <HeaderPortalShell
        logoSrc="/ea-logo.png"
        nameLine1="CLIENT PORTAL"
        nameLine2={brandName.toUpperCase()}
        activeTabId={active}
        logoutApiPath="/api/portal/logout"
        loginPath="/portal/login"
        tabs={[
          { id: 'home', label: 'Dashboard', href: base },
          { id: 'simplifi', label: 'Simplifi', href: `${base}/simplifi` },
          { id: 'pulse', label: 'Pulse', href: `${base}/pulse` },
          { id: 'updates', label: 'Update Requests', href: `${base}/updates` },
        ]}
      />
    </div>
  );
}

export { NAVY, GOLD };
