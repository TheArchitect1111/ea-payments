import { notFound } from 'next/navigation';
import { getConceptPreviewDraft } from '@/lib/factory-concept-previews';
import { loadProjectContext } from '@/lib/factory-project-context';
import ExperiencePreview from '@/app/preview/experience/[slug]/[pageId]/ExperiencePreview';

export const dynamic = 'force-dynamic';

export const metadata = {
  robots: { index: false, follow: false },
  title: 'Factory concept website preview',
};

export default async function FactoryConceptWebsitePreviewPage({
  params,
}: {
  params: Promise<{ projectId: string; conceptId: string }>;
}) {
  const { projectId, conceptId } = await params;
  const context = await loadProjectContext(projectId);
  if (!context) notFound();

  const draft = getConceptPreviewDraft(context, conceptId);
  if (!draft?.puckData) notFound();

  return (
    <ExperiencePreview
      title={draft.name}
      data={draft.puckData}
      footerLabel={`Factory preview · ${draft.lens} · draft (not published)`}
    />
  );
}
