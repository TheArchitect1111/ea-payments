'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { PortalNavIcon } from './PortalNavIcons';
import { usePortalSidebar } from './PortalSidebarContext';
import type { PortalSidebarNavGroup } from '@/lib/modules/portal-modules';

type Props = {
  slug: string;
  active?: string;
  shellNavGroups: PortalSidebarNavGroup[];
  brandName?: string;
  workspaceName?: string;
  logoSrc?: string;
  logoAlt?: string;
  promoTitle?: string;
  promoCopy?: string;
  promoHref?: string;
};

function isActive(pathname: string, href: string, activeTab: string, active?: string) {
  if (active && active === activeTab) return true;
  if (activeTab === 'home') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PortalSidebar({
  slug,
  active,
  shellNavGroups,
  brandName = 'Efficiency Architects',
  workspaceName = 'Client Portal',
  logoSrc = '/ea-logo.png',
  logoAlt = 'Efficiency Architects',
  promoTitle = 'Your operating rhythm',
  promoCopy = 'Pulse, Simplifi, Magnifi, and Amplifi — unified in one portal.',
  promoHref,
}: Props) {
  const pathname = usePathname();
  const { mobileOpen, sidebarExpanded, closeMobile } = usePortalSidebar();

  const renderItems = (items: PortalSidebarNavGroup['items']) => (
    <ul className="ep-sidebar-list">
      {items.map((item) => {
        const on = isActive(pathname, item.href, item.activeTab, active);
        return (
          <li key={item.moduleId}>
            <Link
              href={item.href}
              className={`ep-sidebar-link${on ? ' ep-sidebar-link-active' : ''}`}
              onClick={closeMobile}
            >
              <PortalNavIcon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const brandHref = slug === 'ea' ? '/admin/master' : `/portal/${slug}`;
  const resolvedLogo = logoSrc?.trim() && logoSrc !== '/EA_Logo.png' ? logoSrc : '/ea-logo.png';

  return (
    <>
      <div
        className={`ep-sidebar-backdrop${mobileOpen ? ' ep-sidebar-backdrop-open' : ''}`}
        onClick={closeMobile}
        aria-hidden
      />
      <aside
        className={`ep-sidebar${mobileOpen ? ' ep-sidebar-mobile-open' : ''}${sidebarExpanded ? '' : ' ep-sidebar-collapsed'}`}
      >
        <Link href={brandHref} className="ep-sidebar-brand" onClick={closeMobile}>
          <Image src={resolvedLogo} alt={logoAlt} width={40} height={40} className="ep-sidebar-logo" />
          <div className="ep-sidebar-brand-text">
            <strong>{brandName}</strong>
            <span>{workspaceName}</span>
          </div>
        </Link>

        <nav className="ep-sidebar-nav" aria-label="Portal menu">
          {shellNavGroups.length === 0 ? (
            <p className="ep-sidebar-heading">Menu</p>
          ) : (
            shellNavGroups.map((group) => (
              <div key={group.id}>
                <p className="ep-sidebar-heading">{group.label}</p>
                {renderItems(group.items)}
              </div>
            ))
          )}
        </nav>

        {promoHref ? (
          <Link href={promoHref} className="ep-sidebar-promo" onClick={closeMobile}>
            <p className="ep-sidebar-promo-title">{promoTitle}</p>
            <p className="ep-sidebar-promo-copy">{promoCopy}</p>
          </Link>
        ) : (
          <div className="ep-sidebar-promo">
            <p className="ep-sidebar-promo-title">{promoTitle}</p>
            <p className="ep-sidebar-promo-copy">{promoCopy}</p>
          </div>
        )}
      </aside>
    </>
  );
}
