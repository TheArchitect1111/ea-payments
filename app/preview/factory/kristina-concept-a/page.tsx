import ExperiencePreview from '@/app/preview/experience/[slug]/[pageId]/ExperiencePreview';
import { buildKristinaConceptAPuckData } from '@/lib/factory-kristina-concept-a';

export const dynamic = 'force-dynamic';

export const metadata = {
  robots: { index: false, follow: false },
  title: 'Kristina Concept A — curated preview',
};

/** Local/Preview visual QA for curated Concept A (not a production publish path). */
export default function KristinaConceptAPreviewPage() {
  const data = buildKristinaConceptAPuckData({
    projectId: 'proj-ms68dh4m-3daac7',
    returnHref: '/admin/ea-factory/quick-launch?projectId=proj-ms68dh4m-3daac7',
  });
  return (
    <ExperiencePreview
      title="Compassionate Continuum"
      data={data}
      footerLabel="Factory preview · curated Concept A · draft (not published)"
    />
  );
}
