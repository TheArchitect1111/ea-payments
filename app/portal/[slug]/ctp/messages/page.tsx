import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GOLD, NAVY } from '@/lib/design-system';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { buildCtpSupportView } from '@/lib/ctp-support-view';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';

export const dynamic = 'force-dynamic';

/**
 * Client Experience — Messages.
 * Reuses the CTP support communication actions without Executive Workspace chrome.
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

  const view = buildCtpSupportView(submission, slug);
  const messageActions = view.actions.filter((action) =>
    /message|email|reach|contact|reply/i.test(`${action.title} ${action.detail}`),
  );
  const actions = messageActions.length ? messageActions : view.actions.slice(0, 2);
  const primary = actions.find((action) => action.primary) ?? actions[0];

  return (
    <PortalSubpage
      slug={slug}
      active="ctp"
      clientNavActive="messages"
      kicker="Messages"
      title="Message your team"
      lede="Stay in the loop on your build — send a note or check the conversation without leaving Client Experience."
    >
      <div className="ep-module-card" style={{ marginBottom: '1.25rem' }}>
        <p className="ep-module-card-note" style={{ marginBottom: '0.35rem' }}>
          {view.businessName}
          {view.clientTypeLabel ? ` · ${view.clientTypeLabel}` : ''}
        </p>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
          Your conversation space
        </h2>
        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.72)' }}>
          Reach the people building with you. Support and scheduling live next door under Support.
        </p>
        {primary ? (
          <p style={{ margin: '1rem 0 0' }}>
            <a
              href={primary.href}
              className="inline-block rounded-full px-6 py-3 text-sm font-bold"
              style={{ backgroundColor: GOLD, color: NAVY }}
            >
              {primary.title}
            </a>
          </p>
        ) : null}
      </div>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.75rem' }}>
        {actions.map((action) => (
          <li key={action.id} className="ep-module-card" style={{ margin: 0 }}>
            <a
              href={action.href}
              target={action.external ? '_blank' : undefined}
              rel={action.external ? 'noreferrer' : undefined}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <p style={{ margin: 0, fontWeight: 700, color: GOLD }}>{action.title}</p>
              <p
                style={{
                  margin: '0.35rem 0 0',
                  fontSize: '0.9rem',
                  lineHeight: 1.55,
                  color: 'rgba(255,255,255,0.7)',
                  wordBreak: 'break-word',
                }}
              >
                {action.detail}
              </p>
            </a>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link
          href={`/portal/${slug}/ctp/support`}
          className="inline-block rounded-full px-6 py-3 text-sm font-bold"
          style={{ border: '1px solid rgba(255,255,255,0.35)', color: '#fff' }}
        >
          Support
        </Link>
        <Link
          href={`/portal/${slug}/ctp/progress`}
          className="inline-block rounded-full px-6 py-3 text-sm font-bold"
          style={{ border: '1px solid rgba(255,255,255,0.35)', color: '#fff' }}
        >
          Progress
        </Link>
      </div>
    </PortalSubpage>
  );
}
