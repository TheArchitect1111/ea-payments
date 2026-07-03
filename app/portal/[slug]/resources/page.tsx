import Link from 'next/link';
import { requirePortalModule } from '@/lib/modules/portal-modules';
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
  await requirePortalModule(slug, 'resources');

  return (
    <PortalSubpage
      slug={slug}
      active="resources"
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
