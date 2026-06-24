'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { portalNavItems } from './portal-nav-config';
import { PortalNavIcon } from './PortalNavIcons';
import { usePortalSidebar } from './PortalSidebarContext';

type Props = {
  slug: string;
  active?: string;
};

function isActive(pathname: string, href: string, id: string, active?: string) {
  if (active && active === id) return true;
  if (id === 'home') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PortalSidebar({ slug, active }: Props) {
  const pathname = usePathname();
  const { mobileOpen, sidebarExpanded, closeMobile } = usePortalSidebar();
  const [, setHovered] = useState(false);
  const { menu, others } = portalNavItems(slug);

  const renderItems = (items: typeof menu) => (
    <ul className="ep-sidebar-list">
      {items.map((item) => {
        const on = isActive(pathname, item.href, item.id, active);
        return (
          <li key={item.id}>
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
        <div className="ep-sidebar-brand">
          <Image src="/ea-logo.png" alt="Efficiency Architects" width={40} height={40} className="ep-sidebar-logo" />
          <div className="ep-sidebar-brand-text">
            <strong>Efficiency Architects</strong>
            <span>Client Portal</span>
          </div>
        </div>

        <nav className="ep-sidebar-nav" aria-label="Portal menu">
          <p className="ep-sidebar-heading">Menu</p>
          {renderItems(menu)}

          <p className="ep-sidebar-heading ep-sidebar-heading-others">Others</p>
          {renderItems(others)}
        </nav>

        <div className="ep-sidebar-promo">
          <p className="ep-sidebar-promo-title">Your operating rhythm</p>
          <p className="ep-sidebar-promo-copy">Pulse, Simplifi, Magnifi, and Amplifi — unified in one portal.</p>
        </div>
      </aside>
    </>
  );
}
