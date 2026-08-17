import Link from 'next/link';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { listPortalMessagingThreads } from '@/lib/portal-messaging-hub';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';

export const dynamic = 'force-dynamic';

export default async function MessagingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { client } = await requirePortalModule(slug, 'messaging');
  const view = await listPortalMessagingThreads(slug, client);
  const isAmanda = slug.toLowerCase().startsWith('amanda-catherine');

  return (
    <PortalSubpage
      slug={slug}
      active="messaging"
      kicker="Communication"
      title={isAmanda ? 'Messages & announcements' : 'Messaging center'}
      lede={isAmanda ? 'Business and student messages go directly to Amanda’s team. Portal support requests go to Efficiency Architects.' : 'Advisor conversations live in Update Hub — start a request here, then follow replies in your activity feed.'}
    >
      <ul className="ep-module-list">
        {isAmanda ? (
          <>
            <li className="ep-module-card">
              <a href="mailto:amanda@aesthetikine.com" className="ep-module-card-title">
                Email Amanda’s team
              </a>
              <p className="ep-module-card-note">
                For appointments, applications, courses, certifications, memberships, and business questions.
              </p>
            </li>
            <li className="ep-module-card">
              <Link href={`/portal/${slug}/updates/new`} className="ep-module-card-title">
                Contact Efficiency Architects support
              </Link>
              <p className="ep-module-card-note">
                For portal access, technical problems, file issues, or requests to change the website or portal.
              </p>
            </li>
          </>
        ) : (
          <li className="ep-module-card">
            <Link href={`/portal/${slug}/updates/new`} className="ep-module-card-title">
              Send a message to your advisor
            </Link>
            <p className="ep-module-card-note">
              Share context, questions, or files with your advisor.
            </p>
          </li>
        )}
        <li className="ep-module-card">
          <Link href={`/portal/${slug}/updates`} className="ep-module-card-title">
            {isAmanda ? 'View support activity & replies' : 'View activity & replies'}
          </Link>
          <p className="ep-module-card-note">
            {view.pendingCount} open · {view.publishedCount} published in your feed.
          </p>
        </li>
        <li className="ep-module-card">
          <Link href={`/portal/${slug}/ask`} className="ep-module-card-title">
            {isAmanda ? 'Ask Efficiency Architects a quick question' : 'Ask a quick question'}
          </Link>
          <p className="ep-module-card-note">Short-form questions for non-urgent guidance.</p>
        </li>
        {view.threads.map((thread) => (
          <li key={thread.id} className="ep-module-card">
            <Link href={thread.href} className="ep-module-card-title">
              {thread.title}
            </Link>
            <p className="ep-module-card-meta">{thread.status}</p>
            <p className="ep-module-card-note">{thread.note}</p>
          </li>
        ))}
      </ul>
    </PortalSubpage>
  );
}
