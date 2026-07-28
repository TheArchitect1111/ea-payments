'use client';

import Link from 'next/link';
import type { ClientExperienceNavId, ClientExperienceNavItem } from '@/lib/ctp-client-nav';
import { isQuietClientExperienceNavId } from '@/lib/ctp-client-nav';

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
  const primary = items.filter((item) => !isQuietClientExperienceNavId(item.id));
  const quiet = items.find((item) => isQuietClientExperienceNavId(item.id));

  return (
    <header className="cex-shell-nav" role="banner">
      <div className="cex-shell-nav-inner">
        <div className="cex-shell-brand">
          <span className="cex-shell-brand-mark" aria-hidden>
            EA
          </span>
          <span className="cex-shell-brand-text">{brandName}</span>
        </div>
        <nav className="cex-shell-links" aria-label="Your project">
          {primary.map((item) => {
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
          {quiet ? (
            <Link
              href={quiet.href}
              className={`cex-shell-link cex-shell-link-quiet${
                active === quiet.id ? ' cex-shell-link-active' : ''
              }`}
              aria-current={active === quiet.id ? 'page' : undefined}
            >
              {quiet.label}
            </Link>
          ) : null}
        </nav>
        <details className="cex-shell-account">
          <summary className="cex-shell-account-summary" aria-label="Account menu">
            Account
          </summary>
          <div className="cex-shell-account-menu" role="menu">
            <Link href={logoutHref} className="cex-shell-account-logout" role="menuitem">
              Log out
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}
