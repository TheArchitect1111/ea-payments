import type { ReactNode } from 'react';
import Link from 'next/link';
import PortalCtpHelpDrawer from '@/app/portal/components/PortalCtpHelpDrawer';
import { PortalShell, type EAPortalTab } from '@/lib/chassis/PortalShell';
import { PortalModuleChromeStrip } from '@/lib/chassis/PortalChromeContext';
import { resolvePortalWorkspaceChrome } from '@/lib/platform/portal-workspace';
import {
  shouldUseClientExperienceShell,
  type ClientExperienceNavId,
} from '@/lib/ctp-client-nav';
import { designStudioPath } from '@/lib/ctp-opportunity-routes';
import '../[slug]/ea-portal.css';

export async function PortalSubpage({
  slug,
  active,
  kicker,
  title,
  lede,
  clientNavActive,
  children,
}: {
  slug: string;
  active: EAPortalTab;
  kicker: string;
  title: string;
  lede: string;
  clientNavActive?: ClientExperienceNavId;
  children: ReactNode;
}) {
  const chrome = await resolvePortalWorkspaceChrome(slug);
  const clientShell = await shouldUseClientExperienceShell(slug);
  const guideHref = designStudioPath(slug);

  return (
    <PortalShell
      slug={slug}
      active={active}
      pageTitle={title}
      chrome={chrome}
      presentation={clientShell ? 'client' : 'workspace'}
      clientNavActive={clientNavActive}
    >
      <main className="ep-main">
        {clientShell ? null : <PortalModuleChromeStrip />}
        <div className="ep-welcome">
          <p className="ep-welcome-label">{kicker}</p>
          <h1 className="ep-welcome-heading">{title}</h1>
          <p className="ep-lede">{lede}</p>
        </div>
        {children}
        <p className="ep-muted-link">
          <Link href={clientShell ? guideHref : `/portal/${slug}`}>
            ← Back to {clientShell ? 'Your Project' : chrome.homeLabel}
          </Link>
        </p>
      </main>
      {active === 'ctp' ? <PortalCtpHelpDrawer /> : null}
    </PortalShell>
  );
}
