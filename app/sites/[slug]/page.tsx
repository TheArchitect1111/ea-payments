import { notFound } from 'next/navigation';
import ExperiencePreview from '@/app/preview/experience/[slug]/[pageId]/ExperiencePreview';
import { findPublishedSitePage, sitePathForSlug } from '@/lib/provision-website-portal';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await findPublishedSitePage(slug);
  if (!page) {
    return { title: 'Site not found', robots: { index: false, follow: false } };
  }
  return {
    title: page.title === 'Home' ? slug : page.title,
    robots: { index: true, follow: true },
    alternates: { canonical: sitePathForSlug(slug) },
  };
}

export default async function PublicSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await findPublishedSitePage(slug);
  if (!page) notFound();

  return <ExperiencePreview title={page.title} data={page.puckData} footerLabel="Live site" />;
}
