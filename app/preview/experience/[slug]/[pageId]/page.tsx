import { notFound } from 'next/navigation';
import { getExperiencePage } from '@/lib/experience-builder/page-store';
import ExperiencePreview from './ExperiencePreview';

export const dynamic = 'force-dynamic';

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function ExperiencePreviewPage({
  params,
}: {
  params: Promise<{ slug: string; pageId: string }>;
}) {
  const { slug, pageId } = await params;
  const page = await getExperiencePage(pageId);
  if (!page || page.portalSlug !== slug) notFound();

  return <ExperiencePreview title={page.title} data={page.puckData} />;
}
