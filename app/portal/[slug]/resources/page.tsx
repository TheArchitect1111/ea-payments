import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { getClientByPortalSlug } from '@/lib/airtable';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';

export const dynamic = 'force-dynamic';

const RESOURCES = [
  { title: 'Experience template library', href: '/experience/templates', note: '10 Simplifi + Magnifi paired templates.' },
  { title: 'Simplifi workspace', href: '/simplifi/workspace', note: 'Daily brief, inbox, and capture outcomes.' },
  { title: 'Magnifi demo story', href: '/consider/selena', note: 'Shareable Consider experience for prospects.' },
  { title: 'Amplifi share', href: '/amplifi/share', note: 'Mobile-friendly amplify flow.' },
  { title: 'Tester hub', href: '/start', note: 'All friend-testing URLs in one place.' },
];

export default async function ResourcesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) redirect('/portal/login');
  if (session.slug !== slug) redirect(`/portal/${session.slug}/resources`);

  const client = await getClientByPortalSlug(slug);
  if (!client) redirect('/portal/login');

  return (
    <PortalSubpage
      slug={slug}
      active="home"
      kicker="Resource library"
      title="Tools & playbooks"
      lede="Curated links to Magnifi, Amplifi, assessments, and templates — your operating toolkit."
    >
      <ul className="ep-module-list">
        {RESOURCES.map((item) => (
          <li key={item.href} className="ep-module-card">
            <Link href={item.href} className="ep-module-card-title">
              {item.title}
            </Link>
            <p className="ep-module-card-note">{item.note}</p>
          </li>
        ))}
        <li className="ep-module-card">
          <Link href={`/portal/${slug}/updates`} className="ep-module-card-title">
            Update Hub requests
          </Link>
          <p className="ep-module-card-note">Submit content and enhancement requests to your EA team.</p>
        </li>
      </ul>
    </PortalSubpage>
  );
}
