import Link from 'next/link';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { listReportArtifacts } from '@/lib/portal-reports';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import AmandaOperationsPanel from './AmandaOperationsPanel';

export const dynamic = 'force-dynamic';

export default async function ReportsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { client, access } = await requirePortalModule(slug, 'reports');
  const isAmanda = slug.toLowerCase().startsWith('amanda-catherine');
  const artifacts = listReportArtifacts(slug, client, access);

  return (
    <PortalSubpage
      slug={slug}
      active="reports"
      kicker="Reports"
      title={isAmanda ? 'Amanda operations & reports' : 'Reports & insights'}
      lede={isAmanda ? 'Live intake, application, membership, media, volunteer, event, and follow-up signals.' : `Curated operational views for ${client.organization || client.clientName}.`}
    >
      {isAmanda ? <AmandaOperationsPanel slug={slug} /> : null}
      {artifacts.length === 0 ? (
        <p className="ep-module-card-note">No report surfaces are entitled for this portal yet.</p>
      ) : (
        <ul className="ep-module-list">
          {artifacts.map((item) => (
            <li key={item.href} className="ep-module-card">
              <Link href={item.href} className="ep-module-card-title">
                {item.title}
              </Link>
              <p className="ep-module-card-note">{item.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </PortalSubpage>
  );
}
