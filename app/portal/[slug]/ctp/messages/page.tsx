import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { buildCtpSupportView } from '@/lib/ctp-support-view';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';
import { designStudioPath } from '@/lib/ctp-opportunity-routes';
import { CX_EMOTION } from '@/lib/ctp-emotional-copy';

export const dynamic = 'force-dynamic';

/**
 * Client Experience — Contact your guide (mailto / support actions).
 * Honest packaging for Version 1 — framed as hospitality, not software limits.
 */
export default async function PortalCtpMessagesPage({
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

  const view = buildCtpSupportView(submission, slug, {
    pagePath: `/portal/${slug}/ctp/messages`,
  });
  const messageActions = view.actions.filter((action) =>
    /message|email|reach|contact|reply|ask/i.test(`${action.title} ${action.detail}`),
  );
  const actions = messageActions.length ? messageActions : view.actions.slice(0, 2);
  const primary = actions.find((action) => action.primary) ?? actions[0];
  const progressHref = designStudioPath(slug);

  return (
    <PortalSubpage
      slug={slug}
      active="ctp"
      clientNavActive="messages"
      kicker="Contact"
      title="Contact your guide"
      lede={CX_EMOTION.contact.lede}
    >
      <div className="cex-concierge">
        <section className="cex-concierge-panel" aria-labelledby="messages-heading">
          <p className="cex-concierge-kicker">
            {view.businessName}
            {view.clientTypeLabel ? ` · ${view.clientTypeLabel}` : ''}
          </p>
          <h2 id="messages-heading" className="cex-concierge-title">
            {CX_EMOTION.contact.panelTitle}
          </h2>
          <p className="cex-concierge-body">{CX_EMOTION.contact.panelBody}</p>
          {primary ? (
            <p style={{ margin: '1rem 0 0' }}>
              <a
                href={primary.href}
                className="cex-concierge-cta"
                target={primary.external ? '_blank' : undefined}
                rel={primary.external ? 'noreferrer' : undefined}
              >
                {primary.title}
              </a>
            </p>
          ) : null}
        </section>

        {actions.length ? (
          <ul className="cex-concierge-list">
            {actions.map((action) => (
              <li key={action.id} className="cex-concierge-item">
                <a
                  href={action.href}
                  target={action.external ? '_blank' : undefined}
                  rel={action.external ? 'noreferrer' : undefined}
                >
                  <p className="cex-concierge-item-title">{action.title}</p>
                  <p className="cex-concierge-item-detail">{action.detail}</p>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <section className="cex-concierge-panel">
            <p className="cex-concierge-empty">{CX_EMOTION.contact.empty}</p>
          </section>
        )}

        <div className="cex-concierge-actions">
          <Link href={`/portal/${slug}/ctp/support`} className="cex-concierge-cta-secondary">
            Help
          </Link>
          <Link href={progressHref} className="cex-concierge-cta">
            Back to Your Project
          </Link>
        </div>
      </div>
    </PortalSubpage>
  );
}
