import Link from 'next/link';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import {
  findPublishedSitePage,
  siteUrlForSlug,
} from '@/lib/provision-website-portal';
import { listExperiencePages } from '@/lib/experience-builder/page-store';

export const dynamic = 'force-dynamic';

export default async function LandingHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { session, client } = await requirePortalModule(slug, 'landing');

  let siteHref: string | null = null;
  try {
    const site = await findPublishedSitePage(slug);
    if (site) siteHref = siteUrlForSlug(slug);
  } catch {
    siteHref = null;
  }

  let pageCount = 0;
  if (session.orgId && !session.orgId.startsWith('org_')) {
    try {
      const pages = await listExperiencePages(session.orgId, slug);
      pageCount = pages.length;
    } catch {
      pageCount = 0;
    }
  }

  const brand = client.organization || client.clientName;

  return (
    <PortalSubpage
      slug={slug}
      active="landing"
      kicker="Landing Pages"
      title={`${brand} website workspace`}
      lede="Open your live site or edit pages in Experience Builder — same publish path as Factory."
    >
      <ul className="ep-module-list">
        {siteHref ? (
          <li className="ep-module-card">
            <Link href={siteHref} className="ep-module-card-title">
              View live website
            </Link>
            <p className="ep-module-card-note">{siteHref}</p>
          </li>
        ) : (
          <li className="ep-module-card">
            <p className="ep-module-card-title">No published site yet</p>
            <p className="ep-module-card-note">
              Publish from Experience Builder or Factory → Publish Future Website.
            </p>
          </li>
        )}
        <li className="ep-module-card">
          <Link href={`/portal/${slug}/experience-builder`} className="ep-module-card-title">
            Open Experience Builder
          </Link>
          <p className="ep-module-card-note">
            {pageCount > 0
              ? `${pageCount} page${pageCount === 1 ? '' : 's'} for this portal.`
              : 'Create and publish your Home experience.'}
          </p>
        </li>
      </ul>
    </PortalSubpage>
  );
}
