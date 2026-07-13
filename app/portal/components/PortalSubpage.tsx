import type { ReactNode } from 'react';
import Link from 'next/link';
import { PortalShell, type EAPortalTab } from '@/lib/chassis/PortalShell';
import { PortalModuleChromeStrip } from '@/lib/chassis/PortalChromeContext';
import { applyPortalCopy } from '@/lib/platform/portal-copy';
import { resolvePortalWorkspaceChrome } from '@/lib/platform/portal-workspace';
import {
  getCprPortalModuleCopy,
  isCprPortalClient,
  type PortalModuleCopyKey,
} from '@/lib/platform/content-packs/cpr-portal';
import '../[slug]/ea-portal.css';

export async function PortalSubpage({
  slug,
  active,
  module,
  kicker,
  title,
  lede,
  children,
}: {
  slug: string;
  active: EAPortalTab;
  /** When set, CPR (and future verticals) can override chrome copy. */
  module?: PortalModuleCopyKey;
  /** Supports {brand} {members} {home} {workspace} {focus} {start} {personality} */
  kicker: string;
  title: string;
  lede: string;
  children: ReactNode;
}) {
  const chrome = await resolvePortalWorkspaceChrome(slug);
  const vertical =
    module && isCprPortalClient(chrome.platformClientId)
      ? getCprPortalModuleCopy(module)
      : null;

  const resolvedKicker = applyPortalCopy(vertical?.kicker ?? kicker, chrome);
  const resolvedTitle = applyPortalCopy(vertical?.title ?? title, chrome);
  const resolvedLede = applyPortalCopy(vertical?.lede ?? lede, chrome);

  return (
    <PortalShell slug={slug} active={active} pageTitle={resolvedTitle} chrome={chrome}>
      <main className="ep-main">
        <PortalModuleChromeStrip />
        <div className="ep-welcome">
          <p className="ep-welcome-label">{resolvedKicker}</p>
          <h1 className="ep-welcome-heading">{resolvedTitle}</h1>
          <p className="ep-lede">{resolvedLede}</p>
        </div>
        {children}
        <p className="ep-muted-link">
          <Link href={`/portal/${slug}`}>← Back to {chrome.homeLabel}</Link>
        </p>
      </main>
    </PortalShell>
  );
}
