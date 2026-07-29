import Link from 'next/link';
import { resolveConceptPreviewDraft } from '@/lib/factory-concept-previews';
import ExperiencePreview from '@/app/preview/experience/[slug]/[pageId]/ExperiencePreview';

export const dynamic = 'force-dynamic';

export const metadata = {
  robots: { index: false, follow: false },
  title: 'Factory concept website preview',
};

function PreviewRecovery({
  title,
  reason,
  projectId,
  conceptId,
  conceptIds,
}: {
  title: string;
  reason: string;
  projectId: string;
  conceptId: string;
  conceptIds: string[];
}) {
  return (
    <main
      style={{
        minHeight: '100vh',
        margin: 0,
        padding: '3rem 1.25rem',
        background: '#F7F4ED',
        color: '#17130F',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <p style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 12, opacity: 0.65 }}>
          Preview not ready
        </p>
        <h1 style={{ fontSize: '1.75rem', margin: '0.75rem 0' }}>{title}</h1>
        <p style={{ lineHeight: 1.55 }}>{reason}</p>
        <p style={{ fontSize: 13, opacity: 0.7, marginTop: '1rem' }}>
          Project <code>{projectId}</code> · Concept <code>{conceptId}</code>
        </p>
        {conceptIds.length ? (
          <p style={{ fontSize: 13, opacity: 0.7 }}>
            Available concepts: {conceptIds.join(', ')}
          </p>
        ) : null}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.75rem' }}>
          <Link
            href={`/admin/ea-factory/concepts/${encodeURIComponent(projectId)}`}
            style={{ fontWeight: 700, color: '#0A0A0A' }}
          >
            Open concept review
          </Link>
          <Link
            href={`/admin/ea-factory/quick-launch`}
            style={{ fontWeight: 700, color: '#0A0A0A' }}
          >
            Universal Quick Launch
          </Link>
        </div>
      </div>
    </main>
  );
}

export default async function FactoryConceptWebsitePreviewPage({
  params,
}: {
  params: Promise<{ projectId: string; conceptId: string }>;
}) {
  const { projectId: rawProjectId, conceptId: rawConceptId } = await params;
  const projectId = decodeURIComponent(rawProjectId);
  const conceptId = decodeURIComponent(rawConceptId);
  const resolved = await resolveConceptPreviewDraft(projectId, conceptId);

  if (!resolved.ok) {
    return (
      <PreviewRecovery
        title="Website preview unavailable"
        reason={resolved.reason}
        projectId={resolved.projectId}
        conceptId={resolved.conceptId}
        conceptIds={resolved.conceptIds}
      />
    );
  }

  const draft = resolved.draft;
  return (
    <ExperiencePreview
      title={draft.name}
      data={draft.puckData}
      footerLabel={`Factory preview · ${draft.lens} · draft (not published) · ${resolved.source}`}
    />
  );
}
