import { portalContentDefault } from '@/lib/bricks/content-portal';
import { listContent } from '@/lib/bricks/content-family';
import CertifiedReportGenerator from '@/app/portal/components/CertifiedReportGenerator';
import Link from 'next/link';
import Tb3MerchSales from '@/app/portal/components/Tb3MerchSales';
import { MerchantPaymentSetup } from '@/lib/bricks/merchant-onboarding/MerchantPaymentSetup';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { listReportArtifacts } from '@/lib/portal-reports';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import AmandaOperationsPanel from './AmandaOperationsPanel';

export const dynamic = 'force-dynamic';

export default async function ReportsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { client, access, session } = await requirePortalModule(slug, 'reports');
  // Read back tenant-specific durable defaults after module authorization.
  const certifiedContent = slug.toLowerCase().startsWith('amanda-catherine')
    ? null : await portalContentDefault(slug, 'reports');
  const staff=['staff','admin','owner'].includes(session.role ?? '');
  const canManageTb3Payments=['admin','owner'].includes(session.role ?? '');
  const reports=certifiedContent?await listContent({organizationId:certifiedContent.organizationId,portalSlug:slug},'reports',staff?'staff':'member'):[];
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
      {slug === 'tarris' ? <>
        {canManageTb3Payments ? <MerchantPaymentSetup tenantLabel="TB3" tenantSlug={slug} initialProvider="stripe" /> : null}
        {staff ? <Tb3MerchSales report canAudit /> : null}
      </> : null}
      {staff && certifiedContent && access.enabledModuleIds.has('documents') ?
        <CertifiedReportGenerator sourceKind="documents" /> :
        staff && certifiedContent && access.enabledModuleIds.has('resources') ?
        <CertifiedReportGenerator sourceKind="resources" /> : null}
      {reports.some(item=>item.state==='complete') ? (
        <ul className="ep-module-list">
          {reports.filter(item=>item.state==='complete').map(item=>(
            <li className="ep-module-card" key={item.id}>
              <Link className="ep-module-card-title"
                href={`/api/portal/content/download?kind=reports&key=${encodeURIComponent(item.key)}`}>
                {item.title}
              </Link>
              <p className="ep-module-card-note">Generated private report · {item.source||'tenant'} inventory</p>
            </li>
          ))}
        </ul>
      ):null}
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
