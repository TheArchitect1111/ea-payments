import { notFound } from 'next/navigation';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalShell } from '@/lib/chassis/PortalShell';
import { listExperiencePages } from '@/lib/experience-builder/page-store';
import ExperienceBuilderIndex from './ExperienceBuilderIndex';
import '../ea-portal.css';

export const dynamic = 'force-dynamic';

export default async function ExperienceBuilderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { session } = await requirePortalModule(slug, 'landing');
  if (!session.orgId || session.orgId.startsWith('org_')) notFound();
  const pages = await listExperiencePages(session.orgId, slug);
  return <PortalShell slug={slug} active="home"><ExperienceBuilderIndex slug={slug} pages={pages} /></PortalShell>;
}
