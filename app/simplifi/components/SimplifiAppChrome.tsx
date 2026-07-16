import Link from 'next/link';
import type { ReactNode } from 'react';

export type SimplifiNavId = 'brief' | 'capture' | 'inbox' | 'settings';

const NAV: { id: SimplifiNavId; href: string; label: string }[] = [
  { id: 'brief', href: '/simplifi/workspace', label: 'Brief' },
  { id: 'capture', href: '/simplifi/capture', label: 'Capture' },
  { id: 'inbox', href: '/simplifi/inbox', label: 'Inbox' },
  { id: 'settings', href: '/simplifi/settings', label: 'Settings' },
];

export default function SimplifiAppChrome({
  active,
  slug,
  extra,
}: {
  active: SimplifiNavId;
  slug?: string | null;
  extra?: ReactNode;
}) {
  return (
    <header className="sw-header">
      <Link href="/simplifi/workspace" className="sw-brand">
        SIMPLIFI
      </Link>
      <nav className="sw-nav" aria-label="Simplifi primary">
        {NAV.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={active === item.id ? 'sw-nav-active' : undefined}
            aria-current={active === item.id ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ))}
        {slug ? (
          <Link href={`/portal/${slug}`}>Portal</Link>
        ) : (
          <Link href={`/simplifi/login?next=${encodeURIComponent(NAV.find((n) => n.id === active)?.href ?? '/simplifi/workspace')}`}>
            Sign in
          </Link>
        )}
        {extra}
      </nav>
    </header>
  );
}
