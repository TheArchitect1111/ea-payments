import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { buildCtpDocumentsView } from '@/lib/ctp-documents-view';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';
import { designStudioPath } from '@/lib/ctp-opportunity-routes';
import PortalCtpAssetGallery from '@/app/portal/components/PortalCtpAssetGallery';
import { CX_EMOTION } from '@/lib/ctp-emotional-copy';

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
  const progressHref = designStudioPath(slug);
  const readyDocs = view.deliverables.filter((doc) => doc.ready);
  const preparingDocs = view.deliverables.filter((doc) => !doc.ready);

  return (
    <PortalSubpage
      slug={slug}
      active="ctp"
      clientNavActive="documents"
      kicker="Documents"
      title="Documents"
      lede={CX_EMOTION.documents.lede}
    >
      <div className="cex-concierge">
        <section className="cex-concierge-panel" aria-labelledby="documents-heading">
          <p className="cex-concierge-kicker">
            {view.businessName}
            {view.clientTypeLabel ? ` · ${view.clientTypeLabel}` : ''}
          </p>
          <h2 id="documents-heading" className="cex-concierge-title">
            {view.readyCount > 0 ? view.headline : CX_EMOTION.documents.idleTitle}
          </h2>
          <p className="cex-concierge-body">
            {view.readyCount > 0 ? view.summary : CX_EMOTION.documents.idleBody}
          </p>
          {view.readyCount > 0 ? (
            <p className="cex-concierge-meta">
              {view.readyCount} ready
              {view.totalCount > view.readyCount
                ? ` · ${view.totalCount - view.readyCount} still being prepared`
                : ''}
            </p>
          ) : null}
        </section>

        {readyDocs.length || preparingDocs.length ? (
          <section className="cex-concierge-panel" aria-labelledby="documents-prepared">
            <p id="documents-prepared" className="cex-concierge-kicker">
              Prepared for you
            </p>
            <ul className="cex-concierge-list" style={{ marginBottom: 0 }}>
              {view.deliverables.map((doc) => (
                <li key={doc.id} className="cex-concierge-item">
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
                      <p className="cex-concierge-kicker" style={{ marginBottom: '0.25rem' }}>
                        {doc.ready ? 'Ready' : 'Preparing'}
                      </p>
                      <p className="cex-concierge-item-title">{doc.title}</p>
                      <p className="cex-concierge-item-detail">{doc.detail}</p>
                      <p className="cex-concierge-item-detail">
                        <strong>Why you’re receiving this:</strong> {doc.why}
                      </p>
                      <p className="cex-concierge-item-detail">
                        <strong>When to review:</strong> {doc.when}
                      </p>
                      <p className="cex-concierge-item-detail">
                        <strong>After you complete it:</strong> {doc.after}
                      </p>
                    </div>
                    {doc.ready ? (
                      <a
                        href={doc.href}
                        target={doc.external ? '_blank' : undefined}
                        rel={doc.external ? 'noreferrer' : undefined}
                        className="cex-concierge-cta"
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        Open
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <section className="cex-concierge-panel">
            <p className="cex-concierge-empty">{CX_EMOTION.documents.empty}</p>
          </section>
        )}

        {view.uploads.length ? (
          <PortalCtpAssetGallery assets={view.uploads} />
        ) : (
          <section className="cex-concierge-panel">
            <p className="cex-concierge-kicker">Uploads</p>
            <p className="cex-concierge-empty">
              No brand files yet. When Your Project asks for a logo or photos, you can add them
              there.
            </p>
            <p style={{ margin: '1rem 0 0' }}>
              <Link href={progressHref} className="cex-concierge-cta-secondary">
                Open Your Project
              </Link>
            </p>
          </section>
        )}

        <div className="cex-concierge-actions">
          <Link href={progressHref} className="cex-concierge-cta">
            Back to Your Project
          </Link>
        </div>
      </div>
    </PortalSubpage>
  );
}
