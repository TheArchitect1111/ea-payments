import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GOLD, NAVY } from '@/lib/design-system';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { buildCtpDocumentsView } from '@/lib/ctp-documents-view';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';
import PortalCtpAssetGallery from '@/app/portal/components/PortalCtpAssetGallery';

export const dynamic = 'force-dynamic';

export default async function PortalCtpDocumentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { session, client } = await requirePortalModule(slug, 'ctp');

  const submission = await getCtpSubmissionForPortal({
    portalSlug: slug,
    email: session.email ?? client.email,
  });

  if (!submission) {
    redirect(`/portal/${slug}`);
  }

  const view = buildCtpDocumentsView(submission, slug);

  return (
    <PortalSubpage
      slug={slug}
      active="ctp"
      kicker="Documents"
      title="Your CTP document vault"
      lede="Uploads from Design Studio and generated deliverables — one place for the work product of your transformation."
    >
      <div className="ep-module-card" style={{ marginBottom: '1.25rem' }}>
        <p className="ep-module-card-note" style={{ marginBottom: '0.35rem' }}>
          {view.businessName}
          {view.clientTypeLabel ? ` · ${view.clientTypeLabel}` : ''}
        </p>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
          {view.headline}
        </h2>
        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.72)' }}>
          {view.summary}
        </p>
        <p style={{ margin: '0.85rem 0 0', fontSize: '0.85rem', color: 'rgba(216,173,61,0.9)' }}>
          {view.readyCount} ready · {view.totalCount} tracked
        </p>
      </div>

      <section className="ep-module-card" style={{ marginBottom: '1.25rem' }}>
        <p
          style={{
            margin: '0 0 0.75rem',
            fontSize: '0.7rem',
            fontWeight: 800,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(216,173,61,0.85)',
          }}
        >
          Generated deliverables
        </p>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.75rem' }}>
          {view.deliverables.map((doc) => (
            <li
              key={doc.id}
              style={{
                border: '1px solid rgba(255,255,255,0.12)',
                padding: '0.9rem 1rem',
                background: doc.ready ? 'rgba(216,173,61,0.06)' : 'rgba(255,255,255,0.03)',
                opacity: doc.ready ? 1 : 0.72,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  alignItems: 'baseline',
                }}
              >
                <div>
                  <p
                    style={{
                      margin: '0 0 0.25rem',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: doc.ready ? GOLD : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {doc.ready ? 'Ready' : 'Preparing'}
                  </p>
                  <p style={{ margin: 0, fontWeight: 700, color: '#fff' }}>{doc.title}</p>
                  <p
                    style={{
                      margin: '0.35rem 0 0',
                      fontSize: '0.88rem',
                      lineHeight: 1.55,
                      color: 'rgba(255,255,255,0.65)',
                      wordBreak: 'break-word',
                    }}
                  >
                    {doc.detail}
                  </p>
                </div>
                {doc.ready ? (
                  <a
                    href={doc.href}
                    target={doc.external ? '_blank' : undefined}
                    rel={doc.external ? 'noreferrer' : undefined}
                    className="inline-block rounded-full px-4 py-2 text-xs font-bold"
                    style={{ backgroundColor: GOLD, color: NAVY, whiteSpace: 'nowrap' }}
                  >
                    Open
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {view.uploads.length ? (
        <PortalCtpAssetGallery assets={view.uploads} />
      ) : (
        <section className="ep-module-card" style={{ marginBottom: '1.25rem' }}>
          <p
            style={{
              margin: '0 0 0.5rem',
              fontSize: '0.7rem',
              fontWeight: 800,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(216,173,61,0.85)',
            }}
          >
            Uploads
          </p>
          <p style={{ margin: '0 0 1rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
            No brand assets uploaded yet. Add logo, photos, or documents in Design Studio.
          </p>
          <Link
            href={`/portal/${slug}/ctp`}
            className="inline-block rounded-full px-5 py-2.5 text-sm font-bold"
            style={{ border: '1px solid rgba(255,255,255,0.35)', color: '#fff' }}
          >
            Open Design Studio
          </Link>
        </section>
      )}

      <div style={{ marginTop: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link
          href={`/portal/${slug}/ctp`}
          className="inline-block rounded-full px-6 py-3 text-sm font-bold"
          style={{ backgroundColor: GOLD, color: NAVY }}
        >
          Back to progress
        </Link>
        <Link
          href={`/portal/${slug}/ctp/bi`}
          className="inline-block rounded-full px-6 py-3 text-sm font-bold"
          style={{ border: '1px solid rgba(255,255,255,0.35)', color: '#fff' }}
        >
          Executive Snapshot
        </Link>
      </div>
    </PortalSubpage>
  );
}
