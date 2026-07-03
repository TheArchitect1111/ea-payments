import type { ReactNode } from 'react';
import Link from 'next/link';
import { PortalShell, type EAPortalTab } from '@/lib/chassis/PortalShell';
import '../[slug]/ea-portal.css';

export function PortalSubpage({
  slug,
  active,
  kicker,
  title,
  lede,
  children,
}: {
  slug: string;
  active: EAPortalTab;
  kicker: string;
  title: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <PortalShell slug={slug} active={active} pageTitle={title}>
      <main className="ep-main">
        <div className="ep-welcome">
          <p className="ep-welcome-label">{kicker}</p>
          <h1 className="ep-welcome-heading">{title}</h1>
          <p className="ep-lede">{lede}</p>
        </div>
        {children}
        <p className="ep-muted-link">
          <Link href={`/portal/${slug}`}>← Back to dashboard</Link>
        </p>
      </main>
    </PortalShell>
  );
}
