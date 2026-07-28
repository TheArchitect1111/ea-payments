import Link from 'next/link';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { listPortalMessagingThreads } from '@/lib/portal-messaging-hub';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { redirectCtpClientFromExecutiveSurface } from '@/lib/ctp-executive-surface-redirect';
import { CX_EMOTION } from '@/lib/ctp-emotional-copy';

export const dynamic = 'force-dynamic';

export default async function MessagingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await redirectCtpClientFromExecutiveSurface(slug, 'messages');
  const { client } = await requirePortalModule(slug, 'messaging');
  const view = await listPortalMessagingThreads(slug, client);

  return (
    <PortalSubpage
      slug={slug}
      active="messaging"
      kicker="Guide contact"
      title="Contact your guide"
      lede={CX_EMOTION.contact.lede}
    >
      <ul className="ep-module-list">
        <li className="ep-module-card">
          <Link href={`/portal/${slug}/updates/new`} className="ep-module-card-title">
            Submit a request
          </Link>
          <p className="ep-module-card-note">
            Share context, questions, or files — your guide reviews the queue.
          </p>
        </li>
        <li className="ep-module-card">
          <Link href={`/portal/${slug}/updates`} className="ep-module-card-title">
            View project updates
          </Link>
          <p className="ep-module-card-note">
            {view.pendingCount} open · {view.publishedCount} published updates.
          </p>
        </li>
        <li className="ep-module-card">
          <Link href={`/portal/${slug}/ask`} className="ep-module-card-title">
            Ask a quick question
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
