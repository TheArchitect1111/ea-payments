'use client';

import Link from 'next/link';
import type { ClientExperienceNavId, ClientExperienceNavItem } from '@/lib/ctp-client-nav';

type Props = {
  items: ClientExperienceNavItem[];
  active: ClientExperienceNavId;
  brandName?: string;
  logoutHref?: string;
};

export default function ClientExperienceNav({
  items,
  active,
  brandName = 'Efficiency Architects',
  logoutHref = '/api/portal/logout',
}: Props) {
  return (
    <header className="cex-shell-nav" role="banner">
      <div className="cex-shell-nav-inner">
        <div className="cex-shell-brand">
          <span className="cex-shell-brand-mark" aria-hidden>
            EA
          </span>
          <span className="cex-shell-brand-text">{brandName}</span>
        </div>
        <nav className="cex-shell-links" aria-label="Client experience">
          {items.map((item) => {
            const isActive = item.id === active;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`cex-shell-link${isActive ? ' cex-shell-link-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link href={logoutHref} className="cex-shell-logout">
          Log out
        </Link>
      </div>
    </header>
  );
}
