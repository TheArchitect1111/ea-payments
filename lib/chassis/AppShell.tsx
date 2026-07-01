'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import type { ModuleId } from '@/lib/modules/registry';
import type { ShellNavGroup } from '@/lib/modules/portal-modules';
import { NotificationCenter } from './NotificationCenter';

type Props = {
  slug: string;
  firstName?: string;
  activeModuleId?: ModuleId;
  shellNavGroups?: ShellNavGroup[];
  children: ReactNode;
};

function isActivePath(pathname: string, href: string, slug: string): boolean {
  const dashboardHref = `/portal/${slug}`;
  if (href === dashboardHref) return pathname === dashboardHref;
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function AppShell({ slug, firstName, activeModuleId, shellNavGroups, children }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const groups = shellNavGroups ?? [];

  return (
    <div className="ea-app-shell">
      <aside className={`ea-shell-sidebar${mobileOpen ? ' ea-shell-sidebar-open' : ''}`}>
        <div className="ea-shell-brand">
          <div className="ea-nav-logo-box">
            <Image src="/ea-logo.png" alt="Efficiency Architects" width={40} height={40} className="ea-nav-logo" />
          </div>
          <div>
            <p className="ea-shell-brand-kicker">Pulse OS</p>
            <p className="ea-shell-brand-name">Efficiency Architects</p>
          </div>
        </div>

        <nav className="ea-shell-nav" aria-label="Portal modules">
          {groups.map((group) => (
            <div key={group.id} className="ea-shell-nav-group">
              <p className="ea-shell-nav-label">{group.label}</p>
              {group.items.map((item) => {
                const active =
                  item.moduleId === activeModuleId || isActivePath(pathname, item.href, slug);
                return (
                  <Link
                    key={item.moduleId}
                    href={item.href}
                    className={`ea-shell-nav-link${active ? ' ea-shell-nav-link-active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="ea-shell-nav-icon" aria-hidden>
                      {item.label.charAt(0)}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="ea-shell-sidebar-foot">
          <a href="/api/portal/logout" className="ea-shell-logout">
            Log out
          </a>
        </div>
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          className="ea-shell-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div className="ea-shell-stage">
        <header className="ea-shell-topbar">
          <button
            type="button"
            className="ea-shell-menu-btn"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>

          <div className="ea-shell-topbar-spacer" />

          <NotificationCenter slug={slug} />

          {firstName ? (
            <span className="ea-nav-user" title={firstName}>
              {firstName.charAt(0)}
            </span>
          ) : null}
        </header>

        <div className="ea-shell-content">{children}</div>
      </div>
    </div>
  );
}
