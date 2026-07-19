import Link from 'next/link';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import {
  findPublishedSitePage,
  siteUrlForSlug,
} from '@/lib/provision-website-portal';

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

  let siteHref: string | null = null;
  try {
    const site = await findPublishedSitePage(slug);
    if (site) siteHref = siteUrlForSlug(slug);
  } catch {
    siteHref = null;
  }

  const tenantLinks = [
    ...(siteHref
      ? [{ title: 'Your website', href: siteHref, note: 'Published site for this portal tenant.' }]
      : []),
    {
      title: 'CTP workspace',
      href: `/portal/${slug}/ctp`,
      note: 'Consider The Possibilities™ workspace and production status.',
    },
    {
      title: 'Update Hub',
      href: `/portal/${slug}/updates`,
      note: 'Submit content and enhancement requests to your EA team.',
    },
    {
      title: 'Documents',
      href: `/portal/${slug}/documents`,
      note: 'Onboarding essentials, training titles, and shared deliverables.',
    },
  ];

  return (
    <PortalSubpage
      slug={slug}
      active="resources"
      kicker="Resource library"
      title="Tools & playbooks"
      lede="Tenant links first, then curated Magnifi, Amplifi, assessments, and templates."
    >
      <ul className="ep-module-list">
        {tenantLinks.map((item) => (
          <li key={item.href} className="ep-module-card">
            <Link href={item.href} className="ep-module-card-title">
              {item.title}
            </Link>
            <p className="ep-module-card-note">{item.note}</p>
          </li>
        ))}
        {RESOURCES.map((item) => (
          <li key={item.href} className="ep-module-card">
            <Link href={item.href} className="ep-module-card-title">
              {item.title}
            </Link>
            <p className="ep-module-card-note">{item.note}</p>
          </li>
        ))}
      </ul>
    </PortalSubpage>
  );
}
