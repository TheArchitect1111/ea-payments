import type { ReactNode } from 'react';
import Link from 'next/link';
import { PortalShell, type EAPortalTab } from '@/lib/chassis/PortalShell';
import { PortalModuleChromeStrip } from '@/lib/chassis/PortalChromeContext';
import { resolvePortalWorkspaceChrome } from '@/lib/platform/portal-workspace';
import '../[slug]/ea-portal.css';

export async function PortalSubpage({
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
  const chrome = await resolvePortalWorkspaceChrome(slug);

  return (
    <PortalShell slug={slug} active={active} pageTitle={title} chrome={chrome}>
      <main className="ep-main">
        <PortalModuleChromeStrip />
        <div className="ep-welcome">
          <p className="ep-welcome-label">{kicker}</p>
          <h1 className="ep-welcome-heading">{title}</h1>
          <p className="ep-lede">{lede}</p>
        </div>
        {children}
        <p className="ep-muted-link">
          <Link href={`/portal/${slug}`}>← Back to {chrome.homeLabel}</Link>
        </p>
      </main>
    </PortalShell>
  );
}
