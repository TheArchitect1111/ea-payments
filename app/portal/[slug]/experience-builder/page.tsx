import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalShell } from '@/lib/chassis/PortalShell';
import { listExperiencePages } from '@/lib/experience-builder/page-store';
import ExperienceBuilderIndex from './ExperienceBuilderIndex';
import '../ea-portal.css';

export const dynamic = 'force-dynamic';

export default async function ExperienceBuilderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requirePortalModule(slug, 'landing');
  const pages = await listExperiencePages(slug);

  return (
    <PortalShell slug={slug} active="home">
      <ExperienceBuilderIndex slug={slug} pages={pages} />
    </PortalShell>
  );
}
