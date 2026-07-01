import type { ReactNode } from 'react';
import Link from 'next/link';
import { PortalShell } from '@/lib/chassis/PortalShell';
import { getPortalModuleAccessForSlug } from '@/lib/modules/portal-modules';
import type { ModuleId } from '@/lib/modules/registry';
import '../[slug]/ea-portal.css';

export async function PortalSubpage({
  slug,
  active,
  activeModuleId,
  kicker,
  title,
  lede,
  children,
}: {
  slug: string;
  active: 'home' | 'pulse' | 'simplifi' | 'amplifi' | 'updates';
  activeModuleId?: ModuleId;
  kicker: string;
  title: string;
  lede: string;
  children: ReactNode;
}) {
  const access = await getPortalModuleAccessForSlug(slug);

  return (
    <div className="ep-page">
      <PortalShell
        slug={slug}
        active={active}
        activeModuleId={activeModuleId}
        shellNavGroups={access?.shellNavGroups}
      >
        <main className="ep-main ep-main-shell">
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
    </div>
  );
}
