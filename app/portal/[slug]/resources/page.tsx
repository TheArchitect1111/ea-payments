import { portalContentDefault } from '@/lib/bricks/content-portal';
import { listContent } from '@/lib/bricks/content-family';
import CertifiedContentUpload from '@/app/portal/components/CertifiedContentUpload';
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
  const { session } = await requirePortalModule(slug, 'resources');
  // Read back tenant-specific durable defaults after module authorization.
  const certifiedContent = slug.toLowerCase().startsWith('amanda-catherine')
    ? null : await portalContentDefault(slug, 'resources');
  const staff=['staff','admin','owner'].includes(session.role);
  const savedResources=certifiedContent?await listContent({organizationId:certifiedContent.organizationId,portalSlug:slug},'resources',staff?'staff':'member'):[];

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
      {staff && certifiedContent ? <CertifiedContentUpload kind="resources" /> : null}
      <ul className="ep-module-list">
        {savedResources.filter(item=>Boolean(item.body)).map(item=>(
          <li key={item.id} className="ep-module-card">
            <Link href={`/api/portal/content/download?kind=resources&key=${encodeURIComponent(item.key)}`}
              className="ep-module-card-title">{item.title}</Link>
            <p className="ep-module-card-note">{item.visibility==='staff'?'Staff only':'Shared with portal members'} · Protected resource</p>
          </li>
        ))}
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
