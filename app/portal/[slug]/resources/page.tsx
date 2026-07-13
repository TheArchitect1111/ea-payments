import Link from 'next/link';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { resolvePortalWorkspaceChrome } from '@/lib/platform/portal-workspace';
import {
  CPR_PORTAL_RESOURCES,
  isCprPortalClient,
} from '@/lib/platform/content-packs/cpr-portal';

export const dynamic = 'force-dynamic';

const DEFAULT_RESOURCES = [
  { title: 'Experience template library', href: '/experience/templates', note: '10 Simplifi + Magnifi paired templates.' },
  { title: 'Simplifi workspace', href: '/simplifi/workspace', note: 'Daily brief, inbox, and capture outcomes.' },
  { title: 'Magnifi demo story', href: '/consider/selena', note: 'Shareable Consider experience for prospects.' },
  { title: 'Amplifi share', href: '/amplifi/share', note: 'Mobile-friendly amplify flow.' },
  { title: 'Tester hub', href: '/start', note: 'All friend-testing URLs in one place.' },
];

export default async function ResourcesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requirePortalModule(slug, 'resources');
  const chrome = await resolvePortalWorkspaceChrome(slug);
  const cpr = isCprPortalClient(chrome.platformClientId);

  const resources = cpr
    ? CPR_PORTAL_RESOURCES.map((item) => ({
        ...item,
        href: item.href === 'ask' ? `/portal/${slug}/ask` : item.href,
      }))
    : DEFAULT_RESOURCES;

  return (
    <PortalSubpage
      slug={slug}
      active="resources"
      module="resources"
      kicker="Resource library"
      title="Tools & playbooks"
      lede="Curated links for {workspace} — assessments, templates, and the {brand} operating toolkit."
    >
      <ul className="ep-module-list">
        {resources.map((item) => (
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
