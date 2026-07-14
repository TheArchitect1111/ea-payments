import { notFound } from 'next/navigation';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { getExperiencePage } from '@/lib/experience-builder/page-store';
import ExperienceBuilderEditor from './ExperienceBuilderEditor';

export const dynamic = 'force-dynamic';

export default async function ExperienceBuilderEditPage({ params }: { params: Promise<{ slug: string; pageId: string }> }) {
  const { slug, pageId } = await params;
  const { session } = await requirePortalModule(slug, 'landing');
  if (!session.orgId || session.orgId.startsWith('org_')) notFound();
  const page = await getExperiencePage(pageId, session.orgId);
  if (!page || page.portalSlug !== slug) notFound();
  return <ExperienceBuilderEditor slug={slug} page={page} />;
}
