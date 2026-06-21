import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { PortalNav } from '../../PortalNav';
import NewContentRequestForm from './NewContentRequestForm';
import '../../ea-portal.css';

export const dynamic = 'force-dynamic';

export default async function NewContentRequestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) redirect('/portal/login');
  if (session.slug !== slug) redirect(`/portal/${session.slug}/updates/new`);

  return (
    <div className="ep-page">
      <PortalNav slug={slug} active="updates" />
      <main className="ep-main">
        <div className="ep-welcome">
          <p className="ep-welcome-label">Update Hub™</p>
          <h1 className="ep-welcome-heading">Submit Update Request</h1>
        </div>
        <div className="ep-card">
          <NewContentRequestForm slug={slug} />
        </div>
      </main>
    </div>
  );
}
