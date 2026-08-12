import Link from 'next/link';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { resolveConceptPreviewDraft } from '@/lib/factory-concept-previews';
import '@/app/components/experience/themes/amanda-editorial/amanda-editorial.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  robots: { index: false, follow: false },
  title: 'Factory concept portal preview',
};

function PreviewRecovery({
  reason,
  projectId,
  conceptId,
  conceptIds,
}: {
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
        background: '#17130F',
        color: '#F7F1E8',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <p style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 12, opacity: 0.65 }}>
          Preview not ready
        </p>
        <h1 style={{ fontSize: '1.75rem', margin: '0.75rem 0' }}>Portal preview unavailable</h1>
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
            style={{ fontWeight: 700, color: '#F7F1E8' }}
          >
            Open concept review
          </Link>
        </div>
      </div>
    </main>
  );
}

export default async function FactoryConceptPortalPreviewPage({
  params,
}: {
  params: Promise<{ projectId: string; conceptId: string }>;
}) {
  const { projectId: rawProjectId, conceptId: rawConceptId } = await params;
  const projectId = decodeURIComponent(rawProjectId);
  const conceptId = decodeURIComponent(rawConceptId);
  const resolved = await resolveConceptPreviewDraft(projectId, conceptId);

  if (!resolved.ok || !resolved.draft.portalShell) {
    return (
      <PreviewRecovery
        reason={resolved.ok ? 'Portal shell missing from concept draft.' : resolved.reason}
        projectId={projectId}
        conceptId={conceptId}
        conceptIds={resolved.ok ? [] : resolved.conceptIds}
      />
    );
  }

  const draft = resolved.draft;
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
      {shell.heroImageUrl ? (
        <div
          style={{
            width: '100%',
            maxHeight: '42vh',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shell.heroImageUrl}
            alt=""
            style={{
              width: '100%',
              height: '42vh',
              objectFit: 'cover',
              objectPosition: 'center 30%',
              display: 'block',
            }}
          />
        </div>
      ) : null}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
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
          Member home
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

        {shell.firstView.length > 0 ? (
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Your workspace
            </h2>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: '0.75rem 0 0',
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
          </section>
        ) : null}

        {shell.purpose ? (
          <p style={{ opacity: 0.8, lineHeight: 1.5, marginTop: '0.75rem' }}>{shell.purpose}</p>
        ) : null}
      </div>
    </main>
  );
}
