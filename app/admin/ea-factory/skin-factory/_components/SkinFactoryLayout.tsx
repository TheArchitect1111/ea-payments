import Link from 'next/link';
import type { ReactNode } from 'react';

export const SKIN_NAVY = '#1B2B4D';
export const SKIN_GOLD = '#C9A844';
export const SKIN_CREAM = '#FAF8F3';

export default function SkinFactoryLayout({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen text-neutral-900" style={{ backgroundColor: SKIN_CREAM }}>
      <section className="border-b border-neutral-200 bg-white px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: SKIN_GOLD }}>
            Pulse / EA Factory
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl" style={{ color: SKIN_NAVY }}>
                {title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-600">{subtitle}</p>
            </div>
            {actions}
          </div>
          <nav className="mt-6 flex flex-wrap gap-2 text-xs font-black uppercase tracking-wider">
            <NavPill href="/admin/ea-factory/skin-factory">Dashboard</NavPill>
            <NavPill href="/admin/ea-factory/skin-factory/new">New Skin Brief</NavPill>
            <NavPill href="/admin/ea-factory/skin-factory/briefs">Saved Briefs</NavPill>
            <NavPill href="/admin/ea-factory/repo-library">Repo Library</NavPill>
            <NavPill href="/admin/ea-factory">EA Factory</NavPill>
          </nav>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </main>
  );
}

function NavPill({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="border border-neutral-200 bg-white px-3 py-2 text-[#1B2B4D] hover:border-[#C9A844]">
      {children}
    </Link>
  );
}
