import Link from 'next/link';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';

export const dynamic = 'force-dynamic';

export default async function MessagingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requirePortalModule(slug, 'messaging');

  return (
    <PortalSubpage
      slug={slug}
      active="messaging"
      kicker="Communication"
      title="Messaging center"
      lede="Direct communication with your EA advisor. Post an update or enhancement request and our team will respond through your activity feed."
    >
      <ul className="ep-module-list">
        <li className="ep-module-card">
          <Link href={`/portal/${slug}/updates/new`} className="ep-module-card-title">
            Send a message to your advisor
          </Link>
          <p className="ep-module-card-note">
            Share context, questions, or files — routed to the Update Hub queue.
          </p>
        </li>
        <li className="ep-module-card">
          <Link href={`/portal/${slug}/updates`} className="ep-module-card-title">
            View activity &amp; replies
          </Link>
          <p className="ep-module-card-note">All outreach and advisor responses in one timeline.</p>
        </li>
        <li className="ep-module-card">
          <Link href={`/portal/${slug}/ask`} className="ep-module-card-title">
            Ask a quick question
          </Link>
          <p className="ep-module-card-note">Short-form questions for non-urgent guidance.</p>
        </li>
      </ul>
    </PortalSubpage>
  );
}
