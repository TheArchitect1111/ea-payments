import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { getClientByPortalSlug } from '@/lib/airtable';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';

export const dynamic = 'force-dynamic';

export default async function AskAdvisorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) redirect('/portal/login');
  if (session.slug !== slug) redirect(`/portal/${session.slug}/ask`);

  const client = await getClientByPortalSlug(slug);
  if (!client) redirect('/portal/login');

  return (
    <PortalSubpage
      slug={slug}
      active="home"
      kicker="Guide™"
      title="Ask your advisor"
      lede="Submit a question and our team will respond through your Update Hub activity feed."
    >
      <div className="ep-module-card" style={{ maxWidth: '36rem' }}>
        <p className="ep-module-card-note" style={{ marginBottom: '1rem' }}>
          For detailed requests, use the message form — it creates a tracked update in your portal.
        </p>
        <Link
          href={`/portal/${slug}/updates/new`}
          className="inline-block rounded-full px-6 py-3 text-sm font-bold"
          style={{ backgroundColor: '#C9A844', color: '#1B2B4D' }}
        >
          Open message form
        </Link>
      </div>
    </PortalSubpage>
  );
}
