import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { getClientByPortalSlug } from '@/lib/airtable';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';

export const dynamic = 'force-dynamic';

export default async function MessagingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) redirect('/portal/login');
  if (session.slug !== slug) redirect(`/portal/${session.slug}/messaging`);

  const client = await getClientByPortalSlug(slug);
  if (!client) redirect('/portal/login');

  return (
    <PortalSubpage
      slug={slug}
      active="home"
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
