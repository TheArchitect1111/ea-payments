import Link from 'next/link';
import Image from 'next/image';
import type { EAPortalTab } from './PortalShell';
import type { PortalNavTab } from '@/lib/modules/portal-modules';

type Props = {
  slug: string;
  active: EAPortalTab;
  firstName?: string;
  navTabs?: PortalNavTab[];
};

export function EAPortalNav({ slug, active, firstName, navTabs }: Props) {
  const base = `/portal/${slug}`;
  const resolvedTabs: PortalNavTab[] = navTabs?.length
    ? navTabs
    : [
        { id: 'home', label: 'Dashboard', href: base },
        { id: 'simplifi', label: 'Simplifi', href: `${base}/simplifi` },
        { id: 'amplifi', label: 'Amplifi', href: `${base}/amplifi` },
        { id: 'pulse', label: 'Pulse', href: `${base}/pulse` },
        { id: 'updates', label: 'Updates', href: `${base}/updates` },
      ];

  return (
    <div className="ea-nav-wrap">
      <header className="ea-nav-bar">
        <div className="ea-nav-brand">
          <div className="ea-nav-logo-box">
            <Image src="/ea-logo.png" alt="Efficiency Architects" width={44} height={44} className="ea-nav-logo" />
          </div>
          <span className="ea-nav-brand-text">Efficiency Architects</span>
        </div>

        <nav className="ea-nav-tabs" aria-label="Portal sections">
          {resolvedTabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`ea-nav-tab${tab.id === active ? ' ea-nav-tab-active' : ''}`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <div className="ea-nav-actions">
          {firstName && (
            <span className="ea-nav-user" title={firstName}>
              {firstName.charAt(0)}
            </span>
          )}
          <a href="/api/portal/logout" className="ea-nav-logout">
            Log out
          </a>
        </div>
      </header>
    </div>
  );
}

export { NAVY, GOLD } from '@/lib/design-system';
