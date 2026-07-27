import type { CSSProperties } from 'react';
import { notFound } from 'next/navigation';
import { getConceptPreviewDraft } from '@/lib/factory-concept-previews';
import { loadProjectContext } from '@/lib/factory-project-context';
import '@/app/components/experience/themes/amanda-editorial/amanda-editorial.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  robots: { index: false, follow: false },
  title: 'Factory concept portal preview',
};

export default async function FactoryConceptPortalPreviewPage({
  params,
}: {
  params: Promise<{ projectId: string; conceptId: string }>;
}) {
  const { projectId, conceptId } = await params;
  const context = await loadProjectContext(projectId);
  if (!context) notFound();

  const draft = getConceptPreviewDraft(context, conceptId);
  if (!draft?.portalShell) notFound();

  const shell = draft.portalShell;
  const style: CSSProperties = {
    ['--ea-navy' as string]: shell.primaryColor,
    ['--ea-gold' as string]: shell.accentColor,
    minHeight: '100vh',
    margin: 0,
    background: `linear-gradient(165deg, ${shell.primaryColor} 0%, #2a241f 48%, #0f0d0b 100%)`,
    color: '#F7F1E8',
    fontFamily: 'Georgia, "Times New Roman", serif',
  };

  return (
    <main
      style={style}
      className={shell.themeId === 'amanda-editorial' ? 'amanda-editorial-theme' : undefined}
    >
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '3.5rem 1.5rem 4rem' }}>
        <p
          style={{
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontSize: '0.72rem',
            opacity: 0.72,
            marginBottom: '1.25rem',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          Portal preview · {draft.lens} · not production
        </p>
        <h1
          style={{
            fontSize: 'clamp(2rem, 5vw, 3.1rem)',
            lineHeight: 1.15,
            fontWeight: 500,
            margin: '0 0 0.75rem',
          }}
        >
          {shell.organizationName}
        </h1>
        <p style={{ fontSize: '1.15rem', lineHeight: 1.55, opacity: 0.92, margin: '0 0 2rem' }}>
          {shell.brandHeadline}
          {shell.brandSubhead ? ` — ${shell.brandSubhead}` : ''}
        </p>

        <section
          style={{
            borderTop: `1px solid ${shell.accentColor}66`,
            paddingTop: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Where you are
          </h2>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.5 }}>{shell.memberWhere}</p>
          <h2
            style={{
              fontSize: '0.85rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginTop: '1.5rem',
            }}
          >
            What happens next
          </h2>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.5 }}>{shell.memberNext}</p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Portal composition
          </h2>
          <p style={{ opacity: 0.9, lineHeight: 1.5 }}>{shell.composition}</p>
          <p style={{ opacity: 0.75, lineHeight: 1.5, marginTop: '0.75rem' }}>{shell.tone}</p>
          {shell.purpose ? (
            <p style={{ opacity: 0.8, lineHeight: 1.5, marginTop: '0.75rem' }}>{shell.purpose}</p>
          ) : null}
        </section>

        {shell.firstView.length > 0 ? (
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'grid',
              gap: '0.65rem',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {shell.firstView.map((item) => (
              <li
                key={item}
                style={{
                  borderLeft: `3px solid ${shell.accentColor}`,
                  padding: '0.55rem 0.85rem',
                  background: 'rgba(255,255,255,0.04)',
                }}
              >
                {item}
              </li>
            ))}
          </ul>
        ) : null}

        <p
          style={{
            marginTop: '3rem',
            fontSize: '0.78rem',
            opacity: 0.55,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          Draft portal shell only — chassis login, forms, and modules activate after concept
          selection + Experience Director Approved publish.
        </p>
      </div>
    </main>
  );
}
