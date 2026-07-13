import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LandingPage } from '@/lib/landing-chassis/LandingPage';
import {
  listPublicSiteClients,
  resolvePublicSiteBySlug,
} from '@/lib/platform/landing-from-client';
import '@/lib/landing-chassis/landing.css';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return listPublicSiteClients().map((c) => ({ slug: c.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const site = await resolvePublicSiteBySlug(slug);
  if (!site) return { title: 'Site not found' };
  const { config } = site;
  return {
    title: config.possibility.headline
      ? `${config.brand.nameLine1} ${config.brand.nameLine2}`.trim()
      : slug,
    description: config.possibility.subheadline || config.footer.about,
    openGraph: {
      title: `${config.brand.nameLine1} ${config.brand.nameLine2}`.trim(),
      description: config.possibility.subheadline,
    },
  };
}

export default async function PublicClientSitePage({ params }: PageProps) {
  const { slug } = await params;
  const site = await resolvePublicSiteBySlug(slug);
  if (!site) notFound();

  const { config } = site;
  const cssVars = {
    ['--lc-primary' as string]: config.colors.primary,
    ['--lc-primary-bright' as string]: config.colors.primaryBright,
    ['--lc-black' as string]: config.colors.black,
    ['--lc-dark' as string]: config.colors.dark,
    ['--lc-off' as string]: config.colors.offWhite,
  };

  return (
    <main style={cssVars}>
      <LandingPage config={config} />
      <p
        style={{
          margin: 0,
          padding: '12px 24px 28px',
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#888',
          background: config.colors.dark,
          textAlign: 'center',
        }}
      >
        Assembled from ClientConfig · {site.source} · {site.platformClientId}
        {site.contentPackLabel ? ` · ${site.contentPackLabel}` : ''}
        {site.organizationName ? ` · ${site.organizationName}` : ''}
        {' · '}
        <a href={`/site/${encodeURIComponent(slug)}`} style={{ color: config.colors.primaryBright }}>
          /site/{slug}
        </a>
        {' · '}
        <a
          href={`/admin/reproduce-preview?client=${encodeURIComponent(site.reproduceClientId)}`}
          style={{ color: '#bbb' }}
        >
          Reproduce preview
        </a>
      </p>
    </main>
  );
}
