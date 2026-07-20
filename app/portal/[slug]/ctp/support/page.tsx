import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GOLD, NAVY } from '@/lib/design-system';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { buildCtpSupportView } from '@/lib/ctp-support-view';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';
import { designStudioPath } from '@/lib/ctp-opportunity-routes';

export const dynamic = 'force-dynamic';

export default async function PortalCtpSupportPage({
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
  const { guide } = view;
  const progressHref = designStudioPath(slug);
  const primary = view.actions.find((action) => action.primary) ?? view.actions[0];

  return (
    <PortalSubpage
      slug={slug}
      active="ctp"
      clientNavActive="support"
      kicker="Support"
      title="We're here when you need us"
      lede="You never need to re-explain where your project stands — we already know."
    >
      <div className="ep-module-card" style={{ marginBottom: '1.25rem' }}>
        <p className="ep-module-card-note" style={{ marginBottom: '0.35rem' }}>
          {view.businessName}
          {view.clientTypeLabel ? ` · ${view.clientTypeLabel}` : ''}
          {` · ${guide.currentStage}`}
        </p>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
          {view.headline}
        </h2>
        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.72)' }}>
          {view.summary}
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

      <div className="ep-module-card" style={{ marginBottom: '1.25rem' }}>
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
          Your project context
        </p>
        <p style={{ margin: '0 0 0.5rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.55 }}>
          <strong>Current stage:</strong> {guide.currentStage}
        </p>
        <p style={{ margin: '0 0 0.5rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.55 }}>
          <strong>Next Best Action:</strong> {guide.nbaLabel}
        </p>
        <p style={{ margin: '0 0 0.5rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>
          {guide.nbaWhy}
        </p>
        {guide.recentMilestones.length ? (
          <p style={{ margin: '0 0 0.5rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>
            <strong>Recent milestones:</strong> {guide.recentMilestones.join(' · ')}
          </p>
        ) : null}
        <p style={{ margin: '0 0 0.5rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>
          <strong>Pending:</strong> {guide.pendingActions.join(' · ')}
        </p>
        <p style={{ margin: '0 0 0.5rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>
          <strong>Behind the scenes:</strong> {guide.behindTheScenes}
        </p>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>
          {guide.confidenceMessage}
        </p>
      </div>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.75rem' }}>
        {view.actions.map((action) => (
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
          href={progressHref}
          className="inline-block rounded-full px-6 py-3 text-sm font-bold"
          style={{ backgroundColor: GOLD, color: NAVY }}
        >
          Back to Your Project
        </Link>
        <Link
          href={`/portal/${slug}/ctp/documents`}
          className="inline-block rounded-full px-6 py-3 text-sm font-bold"
          style={{ border: '1px solid rgba(255,255,255,0.35)', color: '#fff' }}
        >
          Documents
        </Link>
      </div>
    </PortalSubpage>
  );
}
