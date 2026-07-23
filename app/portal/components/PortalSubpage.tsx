import type { ReactNode } from 'react';
import Link from 'next/link';
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
  hideWelcome = false,
  hideBackLink = false,
  children,
}: {
  slug: string;
  active: EAPortalTab;
  kicker: string;
  title: string;
  lede: string;
  clientNavActive?: ClientExperienceNavId;
  /** When true, the page owns the opening hierarchy (e.g. Guide home). */
  hideWelcome?: boolean;
  hideBackLink?: boolean;
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
        {hideWelcome ? null : (
          <div className="ep-welcome">
            <p className="ep-welcome-label">{kicker}</p>
            <h1 className="ep-welcome-heading">{title}</h1>
            <p className="ep-lede">{lede}</p>
          </div>
        )}
        {children}
        {hideBackLink ? null : (
          <p className="ep-muted-link">
            <Link href={clientShell ? guideHref : `/portal/${slug}`}>
              ← Back to {clientShell ? 'Your Project' : chrome.homeLabel}
            </Link>
          </p>
        )}
      </main>
    </PortalShell>
  );
}
